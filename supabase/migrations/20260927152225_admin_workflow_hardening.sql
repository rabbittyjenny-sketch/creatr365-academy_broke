-- Admin workflow hardening (2026-09-27 audit). Every policy dropped below was
-- verified unused by any client code or edge function before removal.

-- 1. Events: draft/published state. Existing rows stay published.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- Public (and every non-admin) only ever sees published events. Admins keep
-- full access through "Admins manage all events".
DROP POLICY IF EXISTS "Events are public" ON public.events;
CREATE POLICY "Published events are public" ON public.events
  FOR SELECT USING (is_published = true);

-- Events are official Creatr365 workshops, managed only from the admin
-- content page. These template-era policies let any logged-in user publish
-- straight onto the public /events page with no review.
DROP POLICY IF EXISTS "Authenticated users create events" ON public.events;
DROP POLICY IF EXISTS "Creators can update events" ON public.events;
DROP POLICY IF EXISTS "Creators can delete events" ON public.events;

-- 2. Enrollments are only ever written by edge functions (service role).
-- This policy let any logged-in user insert their own row with
-- status = 'paid' through the public API — i.e. take a paid course free.
DROP POLICY IF EXISTS "Users create own enrollment" ON public.course_enrollments;

-- 3. Assignments are submitted through save-submission (service role).
-- This policy let a user insert their own row as status = 'approved' with
-- any score.
DROP POLICY IF EXISTS "Users create assignments" ON public.assignments;

-- 4. Promo codes are validated server-side in create-checkout (service
-- role). Public read let anyone list every code, including free ones.
DROP POLICY IF EXISTS "Promo codes public read" ON public.promo_codes;

-- 5. Reviewer feedback shown to the learner on their Dashboard, so a
-- rejected submission says why.
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS review_note text;

-- 6. The admin form saved baht discounts as 'fixed', but create-checkout
-- only understands 'amount' — so those codes silently gave no discount.
UPDATE public.promo_codes SET discount_type = 'amount' WHERE discount_type = 'fixed';
ALTER TABLE public.promo_codes
  DROP CONSTRAINT IF EXISTS promo_codes_discount_valid;
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_valid CHECK (
    discount_type IN ('percent', 'amount', 'free')
    AND discount_value >= 0
    AND (discount_type <> 'percent' OR discount_value <= 100)
  );
