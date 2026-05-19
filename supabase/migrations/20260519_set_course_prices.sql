-- Set course prices (THB text, first numeric value used for Stripe checkout)
-- Verify these prices with the business before applying to production

UPDATE public.courses SET price = '1,500 ฿'   WHERE slug = 'micro-express';
UPDATE public.courses SET price = '3,900 ฿'   WHERE slug = 'signal';
UPDATE public.courses SET price = '3,900 ฿'   WHERE slug = 'matrix';
UPDATE public.courses SET price = '6,900 ฿'   WHERE slug = 'stage';
UPDATE public.courses SET price = '25,000 ฿'  WHERE slug = 'blueprint';
UPDATE public.courses SET price = '45,000 ฿'  WHERE slug = 'frontier';
