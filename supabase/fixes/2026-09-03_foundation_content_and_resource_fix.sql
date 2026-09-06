-- =============================================================================
-- 2026-09-03 — THE FOUNDATION content accuracy fix + course_resources reassignment
--
-- STATUS: already applied directly to production (project exybvjqjdqxonhesydhk)
-- via Supabase MCP execute_sql. This file is a change record only, kept for
-- traceability per the drift warning in Creatr365_TODO_Master.md Phase 3
-- ("course_resources ไม่มีไฟล์ migration คู่กันเก็บไว้ใน repo").
-- Idempotent — safe to re-run if the production state ever needs restoring.
--
-- Context: `courses`/`course_modules` for the live 5-course catalog
-- (magnet/foundation/signal/stage/brand-host-architect) were seeded directly
-- against production sometime before 2026-08-31 and were NEVER captured by
-- supabase/creatr365_seed_v2.sql (that file only seeds the old, superseded
-- 6-course catalog: micro-express/signal/matrix/stage/blueprint/frontier).
-- Do not run creatr365_seed_v2.sql expecting it to touch 'foundation' — it
-- can't, it doesn't know that slug exists.
-- =============================================================================

BEGIN;

-- 1) F05 "เทคนิค ASBC" duration was left over from a superseded 20-minute
--    draft of the module. THE FOUNDATION handbook's own overview table
--    (page 3) lists it as 35 min, and the total course runtime it states
--    on page 21 ("ประมาณ 4 ชั่วโมง 10 นาที") only reconciles at 35 min
--    (15+25+25+15+60+35+25+50 = 250min = 4h10min).
UPDATE public.course_modules cm
SET duration_label = '35 นาที', updated_at = now()
FROM public.courses c
WHERE cm.course_id = c.id AND c.slug = 'foundation' AND cm.code = 'F05';

-- 2) Module summaries were all NULL. Populated with accurate one-line
--    descriptions sourced directly from the THE FOUNDATION handbook PDF
--    (Creatr365 Live Commerce Host Academy — Course 0).
UPDATE public.course_modules cm SET summary = x.summary, updated_at = now()
FROM (VALUES
  ('F001', 'ทำไมคนไทยซื้อไลฟ์เยอะที่สุดในโลก แต่โฮสต์ส่วนใหญ่ยังไม่มีสูตรพูดที่ถูกต้องสำหรับสินค้าของตัวเอง'),
  ('F01',  'นิยามและ 3 หัวใจสำคัญของ Live Commerce (Real-time / Two-way / Commerce) พร้อมไทม์ไลน์วิวัฒนาการตั้งแต่ยุค QVC ถึง Agentic Web 2026'),
  ('F02',  'จรรยาบรรณ 6 ข้อของโฮสต์มืออาชีพ พร้อม 4 กรณีศึกษาจริง (Viya, Li Jiaqi, คดีของปลอมเกาหลีใต้, สคบ.)'),
  ('F03',  'Workshop ค้นหาว่าคุณเป็นโฮสต์ประเภทไหนใน 5 แบบ (The Expert / Entertainer / Relatable / Storyteller / Motivator)'),
  ('F04',  'สถิติ 2.3 วินาทีที่ตัดสินว่าคนจะดูต่อหรือเลื่อนผ่าน + สูตร 30-Second Hook Formula (Grabber/Value Statement/Social Proof) + Hook 5 Template ตามประเภทสินค้า'),
  ('F05',  'โครงสร้างการพูดสินค้า A-S-B-C (Appeal / Sales Point / Benefit Focus / Conscious Choice) พร้อมตัวเลือกย่อย 3 แบบต่อตัวอักษร ใช้ได้กับสินค้าทุกหมวด'),
  ('F06',  'STEP 1-5 เตรียมตัวก่อนไลฟ์ครั้งแรก และโครงสร้างไลฟ์มาตรฐาน 60 นาทีที่ทำตามได้ทันที'),
  ('F07',  'KPI พื้นฐาน 5 ตัว, 5 ตัวชี้วัดทองคำหลังจบไลฟ์, Live Health Score และโครงสร้างค่าคอมมิชชัน Platform')
) AS x(code, summary)
JOIN public.courses c ON c.slug = 'foundation'
WHERE cm.course_id = c.id AND cm.code = x.code;

-- 3) course_resources handbook PDFs were attached to the wrong course_id
--    (upload-time mistake — 3 of the 4 rows were on the wrong course):
--    - SIGNAL handbook was on 'magnet'      → moved to 'signal'
--    - FR-MAGNET handbook was on 'brand-host-architect' → moved to 'magnet'
--    - a duplicate FOUNDATION handbook was on 'stage'   → deactivated
--      (STAGE's own handbook is a .docx that was never converted/uploaded;
--      deactivated rather than deleted so nothing 404s and it's reversible)
UPDATE public.course_resources
SET course_id = (SELECT id FROM public.courses WHERE slug='signal'), updated_at = now()
WHERE id = '9fc5b64b-4e6f-4b59-ab29-95b46b13d492';

UPDATE public.course_resources
SET course_id = (SELECT id FROM public.courses WHERE slug='magnet'), updated_at = now()
WHERE id = '312a4afa-dac2-4780-9586-d5f010a4f8bb';

UPDATE public.course_resources
SET is_active = false, updated_at = now()
WHERE id = 'bced359f-8868-4711-a568-1d4805395576';

COMMIT;
