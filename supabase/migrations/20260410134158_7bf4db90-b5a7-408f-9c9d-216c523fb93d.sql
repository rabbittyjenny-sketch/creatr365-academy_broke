
-- Add new columns to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS learning_type text NOT NULL DEFAULT 'offline';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS max_slots integer DEFAULT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS stripe_price_id text DEFAULT NULL;

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'amount', 'free')),
  discount_value numeric NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code, course_id)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active promo codes" ON public.promo_codes
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create course_enrollments table
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'free', 'cancelled')),
  stripe_session_id text,
  promo_code_id uuid REFERENCES public.promo_codes(id),
  amount_paid numeric DEFAULT 0,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments" ON public.course_enrollments
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enrollments" ON public.course_enrollments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON public.course_enrollments
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update enrollments" ON public.course_enrollments
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
