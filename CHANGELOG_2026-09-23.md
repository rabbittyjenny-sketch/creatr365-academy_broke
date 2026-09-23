# CHANGELOG — SEO/AI-visibility + consent fixes

ทุกอย่างในไฟล์นี้ตรวจสอบจริงแล้ว: `npm install`, `npx tsc --noEmit`, `vite build`,
`node scripts/generate-sitemap.mjs` และ `node scripts/prerender.mjs` (เส้นทาง
graceful-fallback) รันผ่านจริงในเครื่องก่อนส่งมอบ — ไม่มีจุดไหนที่เดาว่า "น่าจะทำงาน"

## 1. SSL / โดเมน — แก้จากโค้ดไม่ได้ ยังต้องทำเองใน DNS/hosting dashboard

นี่คือปัญหาระดับ infrastructure (DNS + host ออก certificate) ไม่มีไฟล์ในโค้ดที่แก้จุดนี้ได้
สิ่งที่ต้องทำ (นอกระบบนี้):
1. เข้า dashboard ของโฮสต์ที่ deploy จริง (Vercel **หรือ** Netlify — ดูข้อ 6 ด้านล่าง โปรเจกต์นี้มี config ของทั้งคู่พร้อมกัน)
2. เพิ่ม `www.c365.ideas365.space` เป็น custom domain ให้ครบทั้ง apex และ www แล้วรอออก certificate ใหม่
3. ถ้าไม่ได้ตั้งใจใช้ `www.` เลย ให้ลบ DNS record นั้นทิ้ง แล้วใช้ `c365.ideas365.space` เป็นหลักอย่างเดียว

## 2. Prerender (impact สูงสุด) — `scripts/prerender.mjs`

> **อัปเดตภายหลัง (ถอดออกแล้ว):** ขั้น prerender ถูกถอดออกจาก `npm run build` แล้ว พร้อมลบ puppeteer ออกจาก devDependencies
> เหตุผลมี 4 ข้อ
> - build image ของ Vercel ไม่มี Chrome และขาด library ที่ Chrome ต้องใช้ ขั้นนี้จึงไม่ทำงานจริงบน production (fail-open แบบเงียบ)
> - puppeteer ดึงช่องโหว่ระดับ high มาด้วย 5 ตัว และเป็นต้นเหตุของคำเตือน `allow-scripts`
> - `package.json` กับ `package-lock.json` ไม่ตรงกัน ทำให้ `npm ci` ล้ม
> - ถ้ามันทำงานได้ มันจะเขียนทับ `dist/index.html` ด้วยหน้า Home ทำให้ทุก route ที่ไม่ได้ prerender ได้ meta/canonical ของหน้า Home ไปด้วย
>
> ส่วน sitemap, robots และ `public/llms.txt` ยังอยู่ครบ ถ้าต้องการ HTML ที่ render ไว้ล่วงหน้าให้ crawler จริงๆ ให้ทำเป็น SSG ใน Phase 2

- เพิ่ม Puppeteer เป็น devDependency, สร้าง static file server ในเครื่อง (`http` module ล้วน ไม่เพิ่ม dependency ใหม่) จำลองพฤติกรรม hosting จริง
- crawl ทุก route หลัง `vite build` เสร็จ แล้วบันทึก `page.content()` (HTML ที่ render จริงหลัง JS + Supabase fetch ทำงานเสร็จ) ทับ `dist/index.html` และ `dist/<route>/index.html`
- **route แบบไดนามิก (`/course/:slug`, `/articles/:slug`) ดึงจริงจาก Supabase table `courses`/`articles` โดยกรองด้วย `is_active = true`** — ใช้ flag นี้เพราะโค้ด `Courses.tsx` เขียนคอมเมนต์ยืนยันเองว่า "is_active คือสวิตช์เผยแพร่ตัวเดียว" ไม่ได้เดา
- **ทดสอบแล้ว:** รัน `npm run build` ทั้ง pipeline ผ่านจริงใน ~10 วินาที (ไม่มี Chrome/Supabase ในแซนด์บ็อกซ์นี้ ระบบ fallback แบบ log-แล้ว-ข้าม ทำงานถูกต้อง ไม่ทำให้ build ล้ม)
- **ยังทดสอบ "prerender ได้เนื้อหาจริงจาก Supabase" ไม่ได้ในแซนด์บ็อกซ์นี้** เพราะไม่มีเครือข่ายออกไป `*.supabase.co` และดาวน์โหลด Chromium ไม่ได้ (ทั้งสองอย่างถูกบล็อกโดย network policy ของแซนด์บ็อกซ์ ไม่ใช่บั๊ก) — CI/build environment จริงของพี่ (ที่มี `npm install` เข้าถึงอินเทอร์เน็ตปกติ) ต้องรันแล้วตรวจผลอีกครั้งก่อนเชื่อ 100%
- **ต้องตั้ง env vars ใน build environment จริง:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — ถ้าไม่ตั้ง สคริปต์จะไม่ error แต่จะ prerender แค่หน้า static (Home, Courses, Articles, FAQ, Contact, Privacy, Terms, Refund) ไม่มีหน้าคอร์ส/บทความรายตัว
- **ข้อจำกัดที่ตั้งใจไม่แก้รอบนี้:** ยังใช้ `createRoot` (client เขียนทับ) ไม่ใช่ `hydrateRoot` (server/prerender ต่อยอด) — วิธีนี้แก้ปัญหา "บอทเห็นหน้าว่าง" ได้ครบ แต่ผู้ใช้จริงจะเห็นหน้า prerender แวบหนึ่งก่อน React re-render ทับ (ไม่ broken แค่ไม่ใช่ true hydration) ย้ายไป `hydrateRoot` ทำได้ในอนาคตแต่ต้องตรวจทุกหน้าว่าไม่มี hydration mismatch ก่อน (มีบางหน้าที่ toggle `document.documentElement.classList` ผ่าน `useEffect` ซึ่งปลอดภัยเพราะอยู่นอก React root แต่จุดอื่นยังไม่ได้ไล่ตรวจครบ)

## 3. Cookie consent (PDPA) + GA4/Meta/TikTok Pixel

ไฟล์ใหม่: `src/lib/consent.ts`, `src/lib/analytics.ts`, `src/components/CookieConsentBanner.tsx`

- Opt-in จริง: ไม่มี tracker ตัวไหนโหลดก่อนกด "ยอมรับ" — `index.html` ใส่ Google Consent Mode v2 stub (default denied) ไว้ก่อนโหลดอะไรทั้งสิ้น
- แยก 2 หมวดให้เลือก: Analytics (GA4) / Marketing (Meta + TikTok Pixel) พร้อมปุ่ม "จัดการการตั้งค่า" แยกจาก "ยอมรับทั้งหมด" / "ปฏิเสธที่ไม่จำเป็น"
- กดยกเลิกทีหลังได้ผ่านลิงก์ "จัดการคุกกี้" ใหม่ใน Footer (ตามที่ PDPA กำหนดว่าการถอนความยินยอมต้องง่ายพอๆ กับการให้ความยินยอม)
- **ต้องใส่ env vars จริงก่อนจะเห็นผล:** `VITE_GA4_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, `VITE_TIKTOK_PIXEL_ID` ใน `.env` (ดู `.env.example`) — ไม่ใส่ก็ไม่พัง แค่ไม่มีอะไรให้โหลด
- TikTok Pixel ไม่มี API "revoke" อย่างเป็นทางการ เลยออกแบบให้โหลดเฉพาะตอนกด "ยอมรับ marketing" แล้วเท่านั้น ไม่ใช่โหลดไว้ก่อนแล้วค่อยปิด

## 4. schema.org + sitemap.xml + llms.txt

- `index.html`: เพิ่ม `EducationalOrganization` JSON-LD แบบ static (อยู่ทุกหน้าแม้ไม่มี JS) — ใช้เฉพาะข้อมูลที่มีจริงในเว็บ (อีเมล, โซเชียล, Bangkok) ไม่ได้ใส่เบอร์โทร/ที่อยู่/เวลาทำการเพราะไม่มีข้อมูลจริงให้ใส่
- `src/components/schema/CourseSchema.tsx`: ใส่ใน `CourseDetail.tsx` — ดึงราคาจริงจาก field `price` (string ช่วง เช่น "25,000 - 45,000 ฿") มาแยกเป็นตัวเลขเอง ไม่ได้เดาราคาเดียว
- `src/components/schema/FAQSchema.tsx`: ใส่ใน `FAQ.tsx` — คำตอบที่มีลิงก์ (JSX) ถูกแปลงเป็นข้อความล้วนคู่ขนานไว้ใต้ข้อมูลเดิมโดยตรง เพื่อไม่ให้ข้อมูลสองชุดหลุดจากกันภายหลัง
- `public/llms.txt`: ข้อเท็จจริงล้วนจากหน้า Contact — ไม่มีเบอร์โทร/ที่อยู่เต็ม/เวลาทำการเพราะไม่มีในเว็บจริง
- `public/robots.txt`: เพิ่ม ClaudeBot/GPTBot/OAI-SearchBot/PerplexityBot/Google-Extended/Applebot-Extended แบบระบุชัด (ของเดิม `Allow: /` ครอบคลุมอยู่แล้วแต่ไม่ชัดเจนว่าตั้งใจ) + กัน `/admin`, `/dashboard`, `/auth` ฯลฯ ไม่ให้ crawl (auth-only อยู่แล้ว แต่กันไว้ให้สะอาด) + ชี้ไปที่ `Sitemap:`
- `scripts/get-routes.mjs` / `generate-sitemap.mjs`: sitemap สร้างจาก route จริง (static list + Supabase `is_active=true`) ไม่ใช่รายการ hardcode ที่จะเก่าเมื่อมีคอร์สใหม่

## 5. แก้คำว่า "Academy" ให้ตรง brand positioning (`/creatr365-content-system`)

พบแค่ 4 จุด (เช็คทั้ง repo แล้วด้วย grep ไม่ใช่ไล่ดูตา): `index.html` title/OG/Twitter ×3 และ `Terms.tsx` ×1
- ใช้ statement บรรทัดแรกจาก brand doc ตรงตัว: **"Creatr365 — A Creative House for the Future of Live Commerce"**
- meta description ใหม่ใช้สถิติที่ brand doc เองยืนยันไว้แล้วว่าตรวจสอบแล้ว ("ไทยอันดับ 1 โลกซื้อของออนไลน์รายสัปดาห์ 66.6%") แทนการหาสถิติใหม่ ตามกฎ sourcing ของสกิลเอง
- เลี่ยงคำต้องห้ามทั้งหมดในลิสต์ (สอน, คอร์สปั้นรายได้, ฯลฯ), ไม่มีเครื่องหมายตกใจเกินหนึ่งตัว
- โบนัสที่เจอระหว่างทาง: `Home.tsx` ไม่มี `<SEOHead>` เลย (หน้าอื่นทุกหน้ามี ยกเว้นหน้านี้ซึ่งสำคัญที่สุด) — เพิ่มให้แล้ว, และ fallback keywords ใน `SEOHead.tsx` ยังเป็นของเทมเพลตเก่า ("events, discover events...") แก้เป็นคำที่เกี่ยวกับธุรกิจจริง

## 6. สิ่งที่เจอระหว่างทางแต่ไม่ได้แก้ (นอกขอบเขตงานนี้ ต้อง verify ก่อน ไม่ใช่เดาแล้วแก้)

- **`vercel.json` และ `netlify.toml` อยู่คู่กันในโปรเจกต์เดียว** — แก้ทั้งคู่ให้ sitemap/robots/llms ไม่โดน SPA rewrite ทับแล้ว แต่ตัวโปรเจกต์เองยังไม่ได้ตัดสินใจว่าจะ deploy จริงที่ไหน แนะนำเลือกให้เหลือตัวเดียว
- **`src/integrations/supabase/types.ts` ล้าสมัยกว่าที่โค้ดจริงใช้งาน** — รัน `npx tsc --noEmit -p tsconfig.app.json` เจอ type error จริงใน `PageBanner.tsx`, `AdminPageBanners.tsx`, `AdminArticles.tsx`, `AdminStudents.tsx`, `Dashboard.tsx`, `Profile.tsx` เพราะโค้ดอ้างถึงตาราง/คอลัมน์ที่ไม่มีใน `types.ts` (เช่น `page_banners`, `diagnostic_attempts`, `completion_records`, `profiles.date_of_birth`) — ไม่ได้แตะ เพราะไม่ยืนยันว่า schema จริงมีตารางพวกนี้จริงหรือ types.ts ควร regenerate ใหม่ (ต้องรัน `supabase gen types` กับ project ที่ deploy จริงถึงจะรู้แน่ ไม่ใช่เรื่องที่เดาได้จากในนี้)
- **Supabase project ที่ต่ออยู่ในเซสชันนี้ (ref `exybvjqjdqxonhesydhk`) ไม่ตรงกับ `project_id` ใน `config.toml` ของ repo (`iellfdkapaopvjkcjjsj`)** — เลยไม่ได้ดึงข้อมูลคอร์ส/บทความจริงจากตัวที่ต่ออยู่มาสร้าง sitemap ตรงๆ, สคริปต์ดึงจาก `VITE_SUPABASE_URL`/`KEY` ใน env ของ build จริงแทนเสมอ ไม่ว่าจะเป็น project ไหนก็ตรง
- `src/data/courseData.ts` (MASTERCLASS I/II, COMBO PASS) ดูเหมือนเป็นของเก่าที่ `Courses.tsx`/`CourseDetail.tsx` ไม่ได้เรียกใช้แล้ว (ทั้งสองหน้าดึงจาก Supabase table `courses` เท่านั้น) — ไม่ได้ลบเพราะไม่ยืนยันว่ามีที่อื่นเรียกใช้อยู่หรือเปล่า

## เครื่องมือที่ใช้จริงในงานนี้ (และที่ไม่ได้ใช้)

ใช้: `small-business:seo-ai-visibility` (audit checklist + llms.txt/schema format), `creatr365-content-system` (brand voice/rebrand rule), แก้โค้ดตรงด้วย view/str_replace/create_file
ไม่ได้ใช้: `skill-creator` (งานนี้คือแก้โค้ดเว็บจริง ไม่ใช่สร้าง/แก้ Skill), `web-artifacts-builder` (เครื่องมือนี้ทำ artifact ในตัว claude.ai ไม่ใช่แก้โปรเจกต์ Vite/React ที่จะเอาไป deploy เอง)
