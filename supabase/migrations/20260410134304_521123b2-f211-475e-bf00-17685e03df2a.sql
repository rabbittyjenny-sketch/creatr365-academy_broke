
CREATE OR REPLACE FUNCTION public.increment_promo_used(promo_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE id = promo_id;
$$;
