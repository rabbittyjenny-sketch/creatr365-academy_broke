-- New optional field for Profile.tsx's personal-info section.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
