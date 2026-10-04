-- ─────────────────────────────────────────────────────────────────────────
-- Toolbox: Free / Premium
--
-- pricing_type is the one switch Admin uses ('free' | 'paid'); Premium items
-- carry their own price fields. Payment reuses the course pattern
-- (Stripe Checkout with inline THB price_data + purchase_events audit log),
-- implemented in supabase/functions/toolbox-checkout.
--
-- Where bought files live: in the buyer's Dashboard › เอกสาร, next to course
-- materials (same pattern as course_resources). The Toolbox page only sells;
-- it does not re-download Premium files.
--
-- Security: the old storage policy let ANY signed-in user read ANY file in
-- toolbox-files. The rule now lives in the storage policy itself, so the
-- Dashboard download button is the only way in for Premium files:
--   free  → readable by any signed-in user while the asset is published
--   paid  → readable only by users with a paid purchase — even after the
--           asset is hidden from the shop (hiding must not revoke a purchase)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.toolbox_assets
  ADD COLUMN IF NOT EXISTS pricing_type    text    NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS price_thb       integer,
  ADD COLUMN IF NOT EXISTS promo_price_thb integer,
  ADD COLUMN IF NOT EXISTS paid_details    text;

ALTER TABLE public.toolbox_assets DROP CONSTRAINT IF EXISTS toolbox_assets_pricing_type_check;
ALTER TABLE public.toolbox_assets ADD CONSTRAINT toolbox_assets_pricing_type_check
  CHECK (pricing_type IN ('free', 'paid'));

ALTER TABLE public.toolbox_assets DROP CONSTRAINT IF EXISTS toolbox_assets_price_check;
ALTER TABLE public.toolbox_assets ADD CONSTRAINT toolbox_assets_price_check
  CHECK (
    pricing_type = 'free'
    OR (
      price_thb IS NOT NULL AND price_thb > 0
      AND (promo_price_thb IS NULL OR (promo_price_thb > 0 AND promo_price_thb < price_thb))
    )
  );

COMMENT ON COLUMN public.toolbox_assets.pricing_type IS 'free = แจกฟรี (ต้องล็อกอิน), paid = Premium (ต้องชำระเงินก่อนดาวน์โหลด)';
COMMENT ON COLUMN public.toolbox_assets.paid_details IS 'Premium: สิ่งที่ผู้ซื้อได้รับ / เงื่อนไขการใช้งาน แสดงก่อนชำระเงิน';

-- ── Purchases (entitlement) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.toolbox_purchases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          uuid NOT NULL REFERENCES public.toolbox_assets(id) ON DELETE RESTRICT,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'abandoned')),
  amount_thb        integer NOT NULL CHECK (amount_thb >= 0),
  stripe_session_id text,
  receipt_email     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  paid_at           timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS toolbox_purchases_one_paid_per_user
  ON public.toolbox_purchases (user_id, asset_id) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS toolbox_purchases_session_idx ON public.toolbox_purchases (stripe_session_id);

ALTER TABLE public.toolbox_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own toolbox purchases" ON public.toolbox_purchases;
CREATE POLICY "Users view own toolbox purchases" ON public.toolbox_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view toolbox purchases" ON public.toolbox_purchases;
CREATE POLICY "Admins view toolbox purchases" ON public.toolbox_purchases
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Writes only from the toolbox-checkout / stripe-webhook edge functions (service role).

-- Buyers keep seeing what they bought in their Dashboard even if Admin later
-- hides the item from the shop ("Active toolbox assets are public" covers
-- only is_active = true).
DROP POLICY IF EXISTS "Buyers view purchased toolbox assets" ON public.toolbox_assets;
CREATE POLICY "Buyers view purchased toolbox assets" ON public.toolbox_assets
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.toolbox_purchases tp
    WHERE tp.asset_id = toolbox_assets.id AND tp.user_id = auth.uid() AND tp.status = 'paid'
  ));

-- ── Audit log: reuse purchase_events ─────────────────────────────────────
ALTER TABLE public.purchase_events
  ADD COLUMN IF NOT EXISTS toolbox_asset_id    uuid REFERENCES public.toolbox_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS toolbox_purchase_id uuid REFERENCES public.toolbox_purchases(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_events DROP CONSTRAINT IF EXISTS purchase_events_event_check;
ALTER TABLE public.purchase_events ADD CONSTRAINT purchase_events_event_check
  CHECK (event = ANY (ARRAY[
    'checkout_started', 'already_enrolled', 'course_full', 'promo_applied', 'promo_rejected',
    'free_enrolled', 'pending_replaced', 'pending_created', 'stripe_session_created',
    'checkout_cancelled', 'checkout_expired', 'payment_verified', 'webhook_paid', 'error',
    'already_purchased'
  ]));

-- ── Storage: purchase-aware read policy ─────────────────────────────────
DROP POLICY IF EXISTS "Toolbox files readable when signed in" ON storage.objects;
DROP POLICY IF EXISTS "Toolbox files readable when free or purchased" ON storage.objects;
CREATE POLICY "Toolbox files readable when free or purchased" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'toolbox-files'
    AND EXISTS (
      SELECT 1 FROM public.toolbox_assets a
      WHERE a.file_path = storage.objects.name
        AND (
          (a.pricing_type = 'free' AND a.is_active = true)
          OR EXISTS (
            SELECT 1 FROM public.toolbox_purchases tp
            WHERE tp.asset_id = a.id AND tp.user_id = auth.uid() AND tp.status = 'paid'
          )
        )
    )
  );
-- "Admins manage toolbox files" (ALL, admin only) is unchanged.
