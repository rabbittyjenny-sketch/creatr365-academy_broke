# CHANGELOG — Live Notes + Toolbox Premium + โปรไฟล์ชื่อจริง (4 ต.ค. 2569)

ภาพรวมระบบและกฎ "ห้ามทำ" อยู่ที่ `README.md` §41 · งานที่เหลืออยู่ที่ `Creatr365_TODO_Master.md` › PHASE 4
ไฟล์นี้เก็บเฉพาะ: เปลี่ยนอะไร, ตรวจอะไรแล้ว, ขั้นตอนขึ้นระบบ, รายการทดสอบหลังขึ้นระบบ

**สถานะ:** โค้ดเสร็จ · ยังไม่ push · migration ยังไม่ apply · edge function ยังไม่ deploy

## สิ่งที่เปลี่ยน

1. **Live Notes** — คลิปความรู้ฉบับเต็ม (คนมาจากคลิปโปรโมทบนโซเชียล) แสดงท้ายหน้า `/courses` เป็นการ์ดเลื่อนแนวนอน ต้อง login ก่อนดู เล่นในเว็บ ดูจบชวนไปหลักสูตรที่ผูกไว้ เก็บสถิติผู้ชม (เพศ/อายุ/อาชีพ/จังหวัด/แพลตฟอร์มที่มา) ให้แอดมิน จัดการในแท็บ Live Notes ของ Admin › เนื้อหา
2. **หน้าหลักสูตร** — แสดงหน้าละ 6 หลักสูตร มีเลขหน้า (การ์ดหลักสูตรเดิมไม่ได้แก้)
3. **Community** — กลุ่ม "คลิปความรู้" เปลี่ยนเป็น "คลิปกิจกรรม" (บรรยากาศ/ข่าว) และเล่นในเว็บแทนลิงก์ออก
4. **กลับหน้าเดิมหลัง login** — ทั้งอีเมล, LINE (LIFF), และลิงก์ยืนยันอีเมล; หน้า `/auth` แสดงข้อความเฉพาะเมื่อมาจากลิงก์ Live Notes และเปิดที่โหมดสมัคร
5. **โปรไฟล์** — ชื่อ-นามสกุลไทย/อังกฤษ (ล็อกเมื่อออกใบบันทึกการเรียนจบแล้ว), จังหวัด, อาชีพแบบรายการ เป็นฟิลด์บังคับ; Dashboard มีการ์ดเตือนเมื่อยังกรอกไม่ครบ
6. **Toolbox** — ทุกไฟล์ต้อง login; ถอดป๊อปอัปถามข้อมูลประชากร; เพิ่ม Premium (สวิตช์ แจกฟรี/Premium ใน Admin) ชำระผ่าน Stripe แล้วไฟล์ไปอยู่ที่ Dashboard › เอกสาร; ปุ่มดาวน์โหลดเป็นสีฟ้า
7. **ปิดช่องโหว่** — storage policy เดิมให้ทุกคนที่ login โหลดไฟล์ใดก็ได้ใน `toolbox-files`; policy ของ `articles` เดิมให้คนทั่วไปเห็นฉบับร่าง
8. **Admin** — Admin › การชำระเงิน มีแท็บ Toolbox Premium; Admin › นักเรียน แสดงการซื้อ Premium รายคน
9. **แก้บั๊กเดิม** — ปุ่มดาวน์โหลดเอกสารคอร์สใน Dashboard ใช้ไม่ได้ในแอป LINE (`window.open` หลัง await ถูกบล็อก)
10. ข้อความการ์ด Toolbox ในหน้า Explore แก้ให้ตรงว่ามีทั้งแจกฟรีและ Premium
11. **สี/hover ให้สอดคล้องกันทั้ง block** ตามระบบ sharp-card ล่าสุด (`19ac127`): Live Notes, หน้า Toolbox, หน้าต่างเล่นคลิป, หน้าต่างซื้อ Premium ประกาศ `section-accent` สีเดียว (`#4A7FB5`) — เดิมหัวข้อ/ข้อความ hover เป็นแดงแต่ป้ายและปุ่มเป็นฟ้า · การ์ด Live Notes เปลี่ยนเป็น sharp-card (เหลี่ยม + เงาแข็ง) แบบเดียวกับ Explore/Toolbox · ส่วนที่เพิ่มใน Dashboard ใช้สีกลาง/แดงตามหน้า ไม่ใส่ฟ้าหรือทอง · ส่วน Admin ที่เพิ่มใช้ทอง `#D4A843` ของ Admin ตาม README §30.3

## ไฟล์

ใหม่
- `supabase/migrations/20261004100000_profile_identity_fields.sql`
- `supabase/migrations/20261004100100_live_notes.sql`
- `supabase/migrations/20261004100200_toolbox_premium.sql`
- `supabase/functions/toolbox-checkout/index.ts`
- `src/lib/authRedirect.ts`, `src/lib/profileFields.ts`, `src/lib/youtube.ts`
- `src/components/live-notes/LiveNotesSection.tsx`, `src/components/live-notes/LiveNotePlayerDialog.tsx`
- `src/components/admin/LiveNoteStatsPanel.tsx`, `src/components/admin/LiveNoteLinkMenu.tsx`

แก้
- `supabase/functions/stripe-webhook/index.ts`
- `src/pages/` › `Courses.tsx`, `Articles.tsx`, `ArticleDetail.tsx`, `Auth.tsx`, `Register.tsx`, `Profile.tsx`, `Dashboard.tsx`, `Toolbox.tsx`, `AdminArticles.tsx`, `AdminToolbox.tsx`, `AdminPayments.tsx`, `AdminStudents.tsx`, `Explore.tsx`
- `src/components/AuthSheet.tsx`, `src/components/ToolboxDownloadConsentDialog.tsx`
- `src/integrations/supabase/types.ts` (แก้มือ — รัน `supabase gen types` ใหม่หลัง apply)
- `tailwind.config.ts` (token `section.*`)
- เอกสาร: `README.md` (§41 + หมายเหตุอัปเดตใน §9, §20, §21, §30.1, §39.2), `CLAUDE.md`, `Creatr365_TODO_Master.md`, ไฟล์นี้

## ตรวจแล้ว

- `npx tsc --noEmit -p tsconfig.app.json` ไม่มี error · `npx vite build` ผ่าน
- migration ทั้ง 3 ไฟล์รันบน production แบบ `BEGIN … ROLLBACK` ผ่าน แล้ว query ยืนยันว่าไม่มีอะไรค้าง
- ยังไม่ได้ทดสอบในเบราว์เซอร์/แอป LINE จริง และยังไม่ได้ชำระเงิน Stripe จริง (sandbox ที่ใช้ทำงานต่อ Supabase/YouTube ไม่ได้)

## ขั้นตอนขึ้นระบบ (ตามลำดับ)

1. Supabase SQL Editor รัน migration ตามเลขชื่อไฟล์: `…100000` → `…100100` → `…100200`
2. `supabase functions deploy toolbox-checkout` และ `supabase functions deploy stripe-webhook` (webhook endpoint ใน Stripe ใช้ตัวเดิม ไม่ต้องตั้งใหม่)
3. (แนะนำ) secret `SITE_URL=https://c365.ideas365.space` ให้ `toolbox-checkout` ส่งผู้ซื้อกลับเว็บหลักเสมอ
4. Supabase › Authentication › URL Configuration › Redirect URLs เพิ่ม `https://c365.ideas365.space/**`
5. Push → Vercel build
6. `supabase gen types` แล้ว diff กับ `types.ts` ที่แก้มือ · รัน `get_advisors` (security) เทียบก่อน/หลัง

## ทดสอบหลังขึ้นระบบ

Live Notes
- Admin › เนื้อหา › แท็บ Live Notes › สร้าง (วาง YouTube URL, ผูกหลักสูตร) › เผยแพร่ › ปุ่ม "ลิงก์" › คัดลอกลิงก์ TikTok
- เปิดลิงก์ในหน้าต่างไม่ระบุตัวตน → ต้องไปหน้าสมัคร → สมัครด้วยอีเมล → ยืนยันอีเมล → กลับมาเล่นคลิปนั้น
- ทำซ้ำโดยเปิดลิงก์ในแอป LINE และ login ด้วย LINE
- ดูจนจบ → การ์ดชวนไปหลักสูตร → Admin › ปุ่ม "ผู้ชม" มีตัวเลข และแพลตฟอร์มที่มา = tiktok
- เปิด `/articles/<slug ของ live note>` ต้องถูกพาไป `/courses?note=`

Toolbox
- ไฟล์ฟรี: ยังไม่ login กดแล้วต้องไปหน้า login แล้วกลับมา · login แล้วโหลดได้ ไม่มีป๊อปอัปถามเพศ/อายุ
- ตั้งไฟล์หนึ่งเป็น Premium › บัญชีทดสอบซื้อด้วยบัตรทดสอบ Stripe › ต้องกลับมาที่ Dashboard › เอกสาร เห็นไฟล์ในกลุ่ม "Toolbox Premium ที่ซื้อแล้ว" (ป้าย "ใหม่") › ดาวน์โหลด → เงื่อนไขการใช้งาน + ไม่คืนเงิน (ครั้งแรก) → ได้ไฟล์
- กลับหน้า Toolbox: การ์ดที่ซื้อแล้วเป็นปุ่ม "ดาวน์โหลดที่แดชบอร์ด"
- Admin ซ่อนไฟล์ Premium นั้น → ผู้ซื้อยังโหลดได้ในแดชบอร์ด · ลองลบ → ต้องลบไม่ได้ (มีผู้ซื้อ)
- บัญชีที่ยังไม่ซื้อ เรียกไฟล์ Premium ตรง ๆ ต้องไม่ได้
- Admin › การชำระเงิน › Toolbox Premium และ Admin › นักเรียน เห็นรายการซื้อ

โปรไฟล์
- บันทึกโปรไฟล์ที่ขาดช่องบังคับ → ต้องบันทึกไม่ได้และบอกว่าขาดอะไร · ชื่อไทยพิมพ์อังกฤษ → เตือน
- บัญชีที่มีใบบันทึกการเรียนจบแล้ว → ช่องชื่อถูกล็อก

## เรื่องที่เจ้าของระบบต้องตัดสินใจ

- หน้า `RefundPolicy.tsx` ยังพูดถึงเฉพาะคอร์ส ควรเพิ่มว่าไฟล์ Toolbox Premium ขอคืนเงินไม่ได้หลังดาวน์โหลด ให้ตรงกับหน้าต่างยืนยันที่ระบบแสดงแล้ว (ยังไม่ได้แก้ เพราะเป็นข้อความเชิงนโยบาย)


---

## รอบ 2 (4 ต.ค. 2569 ช่วงบ่าย) — หลัง push `01343e1`

1. **Toolbox Premium เข้า Stripe ไม่ได้ — แก้แล้ว:** สาเหตุคือ `toolbox-checkout` ไม่เคยถูก deploy (ไม่มี `purchase_events` ของ Toolbox สักแถว = ฟังก์ชันไม่เคยรัน) → deploy แล้ว (v1) · `stripe-webhook` deploy v7 โดยสร้างจาก **โค้ดที่ deploy จริง (v6)** + branch Toolbox (+ จัดการ `checkout.session.expired` ของ Toolbox) — ไฟล์ใน repo เดิมตามหลัง production จึงไม่ใช้ไฟล์ repo ตรง ๆ
2. **Live Notes ไล่สี System B** วน 8 สีตามลำดับการ์ด (`src/lib/accentPalette.ts`), หัวข้อ section ตามหน้าหลักสูตร (แดง), หน้าต่างเล่นคลิปใช้สีของการ์ดที่เปิด
3. **คลิปกิจกรรมใน Community** ใช้แถวการ์ดเดียวกับ Live Notes (`src/components/clips/ClipCarousel.tsx`) ไม่มีส่วนชวนไปหลักสูตร · เครื่องเล่นรองรับคลิปแนวตั้ง (Shorts) เป็น 9:16 ข้างรายละเอียด
4. **ไล่แก้สีปนทั้งเว็บ:** หัวข้อใน dialog ไม่มี hover แล้ว (เดิมแดง+เส้นใต้แดง) · Community แต่ละกลุ่มประกาศสีของกลุ่ม · Creator Tools ทั้งหน้าเป็นทองแดง (ลิงก์เดิมบังคับแดง) · สี Google เดิม (`data-accent` blue/yellow/green) ใน Enroll/Contact/ResetPassword/Register → แดง · หน้า Legal + บทความเดี่ยวเลิกใช้ทอง Admin `#D4A843` → ทอง brand `#C0A060` และปุ่มเป็นเหลี่ยม · ปุ่มบันทึกโปรไฟล์เป็น `btn-brand` เหมือนหน้า login
5. ตรวจด้วย headless browser (mock data): การ์ด Live Notes 9 ใบได้สี gold→blue→green→copper→navy→purple→red→teal→gold, hover หัวข้อ/เส้นใต้ตรงสีการ์ด, กลุ่ม Community ตรงสีกลุ่ม, หัวข้อ dialog ไม่เปลี่ยนสี · `tsc` สะอาด · `vite build` ผ่าน

ไฟล์รอบนี้: `stripe-webhook/index.ts`, `src/lib/accentPalette.ts` (ใหม่), `src/components/clips/ClipCarousel.tsx` (ใหม่), `src/lib/youtube.ts`, `LiveNotesSection.tsx`, `LiveNotePlayerDialog.tsx`, `Articles.tsx`, `index.css`, `CreatorTools.tsx`, `Enroll.tsx`, `Contact.tsx`, `ResetPassword.tsx`, `Register.tsx`, `RefundPolicy.tsx`, `Privacy.tsx`, `Terms.tsx`, `ArticleDetail.tsx`, `Profile.tsx`, เอกสาร README §41 / CLAUDE.md / TODO
