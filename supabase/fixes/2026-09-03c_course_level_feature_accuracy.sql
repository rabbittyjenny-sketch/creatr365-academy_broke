-- =============================================================================
-- 2026-09-03 (part 3) — Course-level feature accuracy audit
--
-- STATUS: already applied directly to production via Supabase MCP.
-- The earlier two fixes in this folder only checked course_modules
-- (per-lesson name/duration/summary). This pass checks the COURSE-level
-- fields (courses.features, courses.deliverables) against each course's
-- own handbook, which had NOT been audited until now.
--
-- Finding: MAGNET's `features` array contained the line
-- "ทำไม Live ได้ยอดสูงกว่าเว็บ 10–15 เท่า" — that specific stat/comparison
-- does not appear anywhere in the MAGNET handbook (FR-MAGNET_Live_
-- Commerce_Blueprint_Handbook_Complete.docx). It is FOUNDATION's stat
-- ("ไลฟ์คอมเมิร์ซปิดยอดได้ 3–30% เทียบกับเว็บอีคอมเมิร์ซทั่วไปที่ 2–3% —
-- ส่วนต่าง 10–15 เท่า", THE FOUNDATION handbook, page 2), not MAGNET's.
-- Replaced with a stat MAGNET's own handbook actually states (TikTok Shop
-- GMV growth >500% in 8 months, 95min/day average usage — page 5 of the
-- MAGNET handbook's market-stats table).
--
-- Also checked and found genuinely unverifiable against the attached
-- handbook, but NOT changed (flagged to the user instead of silently
-- edited, since these read as plausible real business/certificate
-- program details rather than factual claims borrowed from elsewhere):
-- - brand-host-architect.features: "Agency Starter Kit — สัญญา Rate Card
--   ทีม Scaling Framework" — this term belongs to a separate "extended/
--   advanced 2-day Business & Global" companion instructor-script
--   artifact, not the base BRAND HOST ARCHITECT handbook attached here.
-- - brand-host-architect.deliverables: "Certified Brand Host Architect —
--   Certificate + Digital Badge" — does not appear in the handbook text
--   (grepped all 809 lines, zero matches for "Certificate"/"Digital Badge").
-- =============================================================================

BEGIN;

UPDATE public.courses
SET features = array_replace(features,
  'ทำไม Live ได้ยอดสูงกว่าเว็บ 10–15 เท่า',
  'TikTok Shop GMV โตกว่า 500% ในรอบ 8 เดือน คนไทยใช้ TikTok เฉลี่ย 95 นาที/วัน'
), updated_at = now()
WHERE slug = 'magnet';

COMMIT;
