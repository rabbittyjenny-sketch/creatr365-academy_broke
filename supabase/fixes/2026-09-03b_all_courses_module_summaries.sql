-- =============================================================================
-- 2026-09-03 (part 2) — Populate course_modules.summary for MAGNET, SIGNAL,
-- STAGE, BRAND HOST ARCHITECT (FOUNDATION was already done in the sibling
-- file 2026-09-03_foundation_content_and_resource_fix.sql)
--
-- STATUS: already applied directly to production (project exybvjqjdqxonhesydhk)
-- via Supabase MCP execute_sql. This file is a change record only — see the
-- sibling file's header for why (creatr365_seed_v2.sql doesn't know these
-- slugs, production was seeded directly). Idempotent — safe to re-run.
--
-- Also verified while doing this: duration_label for all 27 modules across
-- these 4 courses already matched their source handbooks exactly (unlike
-- FOUNDATION's F05, no timing bugs were found here) — this file only adds
-- the summaries, which were NULL on all of them.
--
-- Sources: OK#L01f308-01-SIGNAL_The_Conversion_Host_Handbook_Complete.docx,
-- ok#L01f308-02-STAGE-for student sheet.docx,
-- ok#L01f308-03-BRAND_HOST_ARCHITECT_Handbook (1) (1).docx,
-- ok#L01f308-FR-MAGNET_Live_Commerce_Blueprint_Handbook_Complete (2).docx
-- (all attached by the user, module/session headings and overview tables).
-- =============================================================================

BEGIN;

UPDATE public.course_modules cm SET summary = x.summary, updated_at = now()
FROM (VALUES
  ('MG01','นิยาม Live Commerce 3 องค์ประกอบ (Real-time/Two-way/Commerce Driven) และสถานการณ์ตลาด Live Commerce ไทยปี 2026'),
  ('MG02','3 ความเข้าใจผิดที่พบบ่อย vs ความจริง และ 4 สัญญาณเตือนของไลฟ์ที่กำลังล้มเหลว'),
  ('MG03','Host Archetypes 5 แนวทางของ MAGNET (E-Commerce Host, In-House Expert, Influencer Host, Multi-Platform Host, Brand Ambassador) พร้อม Self-Assessment'),
  ('MG04','STEP 1-5 เวอร์ชันย่อ: Define Objective, Choose Product, Prepare Environment, Create Simple Flow, Launch Plan'),
  ('MG05','กรณีศึกษาไลฟ์ที่ประสบความสำเร็จ 3 หมวด (ความงาม/แฟชั่น/FMCG) และองค์ประกอบของไลฟ์ที่ชนะ'),
  ('MG06','KPI Essentials, Live Health Score ของ TikTok และลำดับการพัฒนา Retention→Engagement→Add to Cart→Conversion→Revenue')
) AS x(code, summary)
JOIN public.courses c ON c.slug = 'magnet'
WHERE cm.course_id = c.id AND cm.code = x.code;

UPDATE public.course_modules cm SET summary = x.summary, updated_at = now()
FROM (VALUES
  ('S00','แผนที่ PPACT (Trust→Presence→Communication→Psychology→Authority) และเหตุผลที่ต้องเปลี่ยนวิธีขายจากยุคเก่า'),
  ('S01','4C Framework (Consumer/Cost/Convenience/Communication), สมการความน่าเชื่อถือ Trust=(C+R+I)/S, จรรยาบรรณ 5 ข้อ และกฎแพลตฟอร์ม/FTC'),
  ('S02','ระบบแสง 3 จุด, วิทยาศาสตร์การฝึกเสียง 10 แบบฝึกหัด, โมเดล SOFTEN และกฎ 15-5-3'),
  ('S03','กฎ 95/5 ของ Damasio และโครงสร้าง A-S-B-C (Appeal/Sales Point/Benefit Focus/Conscious Choice) พร้อมตัวเลือกย่อย 3 แบบต่อตัวอักษร'),
  ('S04','Aristotle''s Rhetoric (Ethos/Pathos/Logos), ศาสตร์ลูกค้า 4 สี, บันได FOMO 4 ขั้น และ S-O-R Framework'),
  ('S05','AI-assisted scripting (Pillar Mix), ตาราง KPI หลักพร้อมสูตร Live Health Score และ Pre-Live Master Checklist'),
  ('S06','5 เกณฑ์ที่แบรนด์ใหญ่ใช้คัดเลือกโฮสต์ (Credibility, Consistency, Professionalism, Compliance, Measurable Results)')
) AS x(code, summary)
JOIN public.courses c ON c.slug = 'signal'
WHERE cm.course_id = c.id AND cm.code = x.code;

UPDATE public.course_modules cm SET summary = x.summary, updated_at = now()
FROM (VALUES
  ('ST1','กฎทอง 8 ประการของ TikTok Shop, การบริหาร Live Health Score, ระบบแสง 3 จุด และ 10 แบบฝึกหัด Vocal + SOFTEN Framework'),
  ('ST2','Eye-line Discipline (Sticky Dot), Champion Stance, กฎ 15-5-3 สลับมุมกล้อง และ Product Handling Architecture'),
  ('ST3','จิตวิทยา 95/5 ของ Damasio, โครงสร้าง ASBC และ Hook Template 5 หมวดสินค้า พร้อมฝึกหน้ากล้อง + Feedback สด'),
  ('ST4','ASBC ภาคปฏิบัติ, FOMO Ladder 4 ขั้น, ตารางคำต้องห้าม, Cialdini''s 4-Color Response และ Product Demo 3 มุมกล้อง'),
  ('ST5','Yes-And Technique, Emotional Flatlining และ Recovery Scripts 5 สถานการณ์วิกฤต'),
  ('ST6','ไลฟ์จริง 5 นาทีวัดผล, LIVE Diagnosis ระบบวิเคราะห์หลังบ้าน, 5 ตัวชี้วัดทองคำ และโครงสร้างค่าคอมมิชชัน')
) AS x(code, summary)
JOIN public.courses c ON c.slug = 'stage'
WHERE cm.course_id = c.id AND cm.code = x.code;

UPDATE public.course_modules cm SET summary = x.summary, updated_at = now()
FROM (VALUES
  ('BH1','โมเดล 5 Archetypes (Sage, Hero, Creator, Connector, Ruler) และ Workshop ค้นหา Primary/Secondary Archetype'),
  ('BH2','กรอบ Brand CI 4 มิติ (Design, Communication, Behavior, Culture) พร้อม Scorecard ประเมินตัวเอง'),
  ('BH3','4 โมเดลธุรกิจไลฟ์คอมเมิร์ซ, สูตรราคาขายขั้นต่ำ, กลยุทธ์ Flash Deal ที่รักษา Margin และเกณฑ์คัดเลือกโฮสต์'),
  ('BH4','5 ประเภทสัญญา, ข้อสัญญาที่ต้องมีใน Host Service Agreement และ Multi-Channel Contract Framework'),
  ('BH5','3-Camera Setup มาตรฐาน, ระบบไฟ 3 จุด, การตั้งค่า OBS Studio และฟีเจอร์ ATEM Mini Switcher'),
  ('BH6','โครงสร้างทีมมาตรฐาน 5 ตำแหน่ง, ระบบ Hand Signal และ Production Rundown Template'),
  ('BH7','Live Commerce P&L Framework, ต้นทุนโปรดักชัน/บุคลากร และ Hidden Cost ที่มองไม่เห็น'),
  ('BH8','ภาพรวมตลาด ASEAN 5 ประเทศ, กลยุทธ์บุคลากร Cross-border และ Commerce OS Checklist ก่อน Scale')
) AS x(code, summary)
JOIN public.courses c ON c.slug = 'brand-host-architect'
WHERE cm.course_id = c.id AND cm.code = x.code;

COMMIT;
