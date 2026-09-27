-- Events phase 1: "request to join → admin approves" (Luma-style approval).
-- Payment and any back-and-forth happen on LINE with a real person; the
-- system only records who asked, what the admin decided, and shows the
-- learner their status. Phase 2 (auto-confirm, Stripe, reminders) builds on
-- the same event_registrations rows.

-- ── Event details the admin fills in ─────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_type text NOT NULL DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS venue_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS map_url text NOT NULL DEFAULT '',
  -- Display only: nothing is charged in-system. NULL price = free.
  ADD COLUMN IF NOT EXISTS price numeric(10,2),
  ADD COLUMN IF NOT EXISTS early_bird_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS early_bird_until timestamptz,
  ADD COLUMN IF NOT EXISTS price_note text NOT NULL DEFAULT '';

ALTER TABLE public.events
  ADD CONSTRAINT events_capacity_positive CHECK (capacity IS NULL OR capacity > 0),
  ADD CONSTRAINT events_location_type_valid CHECK (location_type IN ('onsite', 'online')),
  ADD CONSTRAINT events_prices_valid CHECK (
    (price IS NULL OR price >= 0)
    AND (early_bird_price IS NULL OR (early_bird_price >= 0 AND (price IS NULL OR early_bird_price <= price)))
  ),
  ADD CONSTRAINT events_registration_window_valid CHECK (
    registration_opens_at IS NULL OR registration_closes_at IS NULL
    OR registration_opens_at < registration_closes_at
  );

-- Meeting link / attendee instructions: only for confirmed attendees.
-- Kept out of `events` because that table is publicly readable.
CREATE TABLE IF NOT EXISTS public.event_private_details (
  event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  online_url text NOT NULL DEFAULT '',
  attendee_info text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_private_details ENABLE ROW LEVEL SECURITY;

-- ── Registration = a request with a status ───────────────────────────────
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'requested',
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS line_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS admin_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS decided_at timestamptz;

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_status_valid
    CHECK (status IN ('requested', 'confirmed', 'rejected', 'cancelled'));

-- ── RLS ──────────────────────────────────────────────────────────────────
-- "Event registrations public read" (USING true) let anyone with the site's
-- public API key list who registered for what. Now that rows carry name /
-- phone / LINE, reads are own-rows + admin only. Learners no longer write
-- directly — the two functions below enforce the rules.
DROP POLICY IF EXISTS "Event registrations public read" ON public.event_registrations;
DROP POLICY IF EXISTS "Users manage own event registrations" ON public.event_registrations;

CREATE POLICY "Users read own event registrations"
  ON public.event_registrations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage event registrations"
  ON public.event_registrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage event private details"
  ON public.event_private_details FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Confirmed attendees read event private details"
  ON public.event_private_details FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.event_registrations r
    WHERE r.event_id = event_private_details.event_id
      AND r.user_id = auth.uid()
      AND r.status = 'confirmed'
  ));

-- ── Functions ────────────────────────────────────────────────────────────
-- Submit (or edit, while still pending) a request to join. A cancelled
-- request can be re-submitted; a confirmed/rejected one goes through LINE.
CREATE OR REPLACE FUNCTION public.request_event_registration(
  _event_id uuid,
  _full_name text,
  _phone text,
  _line_name text,
  _email text,
  _note text DEFAULT ''
) RETURNS public.event_registrations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _ev public.events;
  _existing text;
  _taken integer;
  _row public.event_registrations;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'กรุณาเข้าสู่ระบบก่อน'; END IF;
  IF coalesce(btrim(_full_name), '') = '' OR coalesce(btrim(_phone), '') = '' THEN
    RAISE EXCEPTION 'กรุณากรอกชื่อและเบอร์โทร';
  END IF;

  SELECT * INTO _ev FROM public.events WHERE id = _event_id AND is_published;
  IF NOT FOUND THEN RAISE EXCEPTION 'ไม่พบกิจกรรมนี้'; END IF;

  SELECT status INTO _existing FROM public.event_registrations
    WHERE event_id = _event_id AND user_id = _uid;
  IF _existing IN ('confirmed', 'rejected') THEN
    RAISE EXCEPTION 'คำขอนี้ได้รับการพิจารณาแล้ว — ติดต่อแอดมินทาง LINE หากต้องการเปลี่ยนแปลง';
  END IF;

  -- Window and capacity gate new requests; editing a pending one is allowed.
  IF _existing IS DISTINCT FROM 'requested' THEN
    IF _ev.registration_opens_at IS NOT NULL AND now() < _ev.registration_opens_at THEN
      RAISE EXCEPTION 'ยังไม่เปิดรับสมัคร';
    END IF;
    IF _ev.registration_closes_at IS NOT NULL AND now() > _ev.registration_closes_at THEN
      RAISE EXCEPTION 'ปิดรับสมัครแล้ว';
    END IF;
    IF _ev.capacity IS NOT NULL THEN
      SELECT count(*) INTO _taken FROM public.event_registrations
        WHERE event_id = _event_id AND status = 'confirmed';
      IF _taken >= _ev.capacity THEN RAISE EXCEPTION 'ที่นั่งเต็มแล้ว'; END IF;
    END IF;
  END IF;

  INSERT INTO public.event_registrations
    (event_id, user_id, status, full_name, phone, line_name, email, note)
  VALUES
    (_event_id, _uid, 'requested', left(btrim(_full_name), 200), left(btrim(_phone), 50),
     left(btrim(coalesce(_line_name, '')), 100), left(btrim(coalesce(_email, '')), 200),
     left(btrim(coalesce(_note, '')), 1000))
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    status = 'requested',
    full_name = excluded.full_name,
    phone = excluded.phone,
    line_name = excluded.line_name,
    email = excluded.email,
    note = excluded.note,
    registered_at = CASE WHEN event_registrations.status = 'cancelled' THEN now() ELSE event_registrations.registered_at END,
    decided_at = NULL
  RETURNING * INTO _row;

  RETURN _row;
END $$;

-- Learners can withdraw a pending request themselves. A confirmed seat may
-- already be paid for on LINE, so that goes through the admin.
CREATE OR REPLACE FUNCTION public.cancel_event_registration(_event_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'กรุณาเข้าสู่ระบบก่อน'; END IF;
  UPDATE public.event_registrations
    SET status = 'cancelled', decided_at = now()
    WHERE event_id = _event_id AND user_id = auth.uid() AND status = 'requested';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ยกเลิกได้เฉพาะคำขอที่รอยืนยัน — หากยืนยันแล้วกรุณาติดต่อแอดมินทาง LINE';
  END IF;
END $$;

-- Confirmed-seat counts for public pages ("เหลือ N ที่"), without exposing
-- who registered.
CREATE OR REPLACE FUNCTION public.event_confirmed_counts(_event_ids uuid[])
RETURNS TABLE (event_id uuid, confirmed integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.event_id, count(*)::integer
  FROM public.event_registrations r
  JOIN public.events e ON e.id = r.event_id AND e.is_published
  WHERE r.event_id = ANY(_event_ids) AND r.status = 'confirmed'
  GROUP BY r.event_id
$$;

REVOKE EXECUTE ON FUNCTION public.request_event_registration(uuid, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_event_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_event_registration(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_event_registration(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_confirmed_counts(uuid[]) TO anon, authenticated;
