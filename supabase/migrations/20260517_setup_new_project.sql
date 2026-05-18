-- =============================================================================
-- CREATR365 ACADEMY — Full Database Setup (New Supabase Project)
-- รัน SQL นี้ใน Supabase Dashboard > SQL Editor ครั้งเดียว
-- ทุก statement ใช้ IF NOT EXISTS (idempotent — รันซ้ำได้ปลอดภัย)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) Utility function: auto-update updated_at column
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1) Enum: app_role
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2) courses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text        UNIQUE NOT NULL,
  tag               text        NOT NULL DEFAULT '',
  title             text        NOT NULL,
  subtitle          text        NOT NULL DEFAULT '',
  description       text        NOT NULL DEFAULT '',
  duration          text        NOT NULL DEFAULT '',
  price             text        NOT NULL DEFAULT '',
  features          text[]      NOT NULL DEFAULT '{}',
  color             text        NOT NULL DEFAULT 'blue',
  sort_order        integer     NOT NULL DEFAULT 0,
  is_active         boolean     NOT NULL DEFAULT true,
  learning_type     text        NOT NULL DEFAULT 'online',
  max_slots         integer,
  stripe_price_id   text,
  status            text        NOT NULL DEFAULT 'coming_soon',
  level             text,
  target_audience   text,
  format_label      text,
  intro_video_url   text,
  cover_image_url   text,
  gallery_image_urls text[]     NOT NULL DEFAULT '{}',
  kpi_notes         jsonb       NOT NULL DEFAULT '[]',
  deliverables      text[]      NOT NULL DEFAULT '{}',
  outcome_goal      text,
  bloom_level       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Courses are public" ON public.courses;
CREATE POLICY "Courses are public" ON public.courses FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 3) course_modules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_modules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code            text        NOT NULL,
  name            text        NOT NULL,
  sort_order      integer     NOT NULL DEFAULT 0,
  phase           text        NOT NULL DEFAULT 'main',
  is_test         boolean     NOT NULL DEFAULT false,
  has_quiz        boolean     NOT NULL DEFAULT false,
  has_assignment  boolean     NOT NULL DEFAULT false,
  summary         text,
  vod_url         text,
  duration_label  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules (course_id);

DROP TRIGGER IF EXISTS update_course_modules_updated_at ON public.course_modules;
CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Modules are public" ON public.course_modules;
CREATE POLICY "Modules are public" ON public.course_modules FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 4) course_quizzes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_quizzes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid        REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id       uuid        REFERENCES public.course_modules(id) ON DELETE SET NULL,
  title           text        NOT NULL,
  phase           text        NOT NULL DEFAULT 'pre',
  pass_threshold  integer     NOT NULL DEFAULT 70,
  qg_code         text,
  source_ref      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quizzes are public" ON public.course_quizzes;
CREATE POLICY "Quizzes are public" ON public.course_quizzes FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 5) quiz_questions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     uuid        NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  q_no        integer     NOT NULL,
  type        text        NOT NULL DEFAULT 'mcq',
  prompt      text        NOT NULL,
  options     jsonb       NOT NULL DEFAULT '[]',
  answer      text,
  explanation text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Questions are public" ON public.quiz_questions;
CREATE POLICY "Questions are public" ON public.quiz_questions FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 6) promo_codes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text        UNIQUE NOT NULL,
  course_id      uuid        REFERENCES public.courses(id) ON DELETE SET NULL,
  discount_type  text        NOT NULL DEFAULT 'percent',
  discount_value numeric     NOT NULL DEFAULT 0,
  max_uses       integer     NOT NULL DEFAULT 1,
  used_count     integer     NOT NULL DEFAULT 0,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promo codes public read" ON public.promo_codes;
CREATE POLICY "Promo codes public read" ON public.promo_codes FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.increment_promo_used(promo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = promo_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7) profiles  (linked to auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  avatar_url    text,
  line_user_id  text        UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id      ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id ON public.profiles (line_user_id) WHERE line_user_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, line_user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'line_user_id'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name  = EXCLUDED.display_name,
    avatar_url    = EXCLUDED.avatar_url,
    line_user_id  = COALESCE(EXCLUDED.line_user_id, profiles.line_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles" ON public.profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 8) user_roles  +  has_role() function
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz     DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages roles" ON public.user_roles;
CREATE POLICY "Service role manages roles" ON public.user_roles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Now add admin policies that depend on has_role()
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage modules" ON public.course_modules;
CREATE POLICY "Admins manage modules" ON public.course_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage quizzes" ON public.course_quizzes;
CREATE POLICY "Admins manage quizzes" ON public.course_quizzes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage questions" ON public.quiz_questions;
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 9) course_enrollments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id         uuid        NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  status            text        NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  amount_paid       numeric,
  promo_code_id     uuid        REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  full_name         text,
  phone             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON public.course_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.course_enrollments (course_id);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own enrollments" ON public.course_enrollments;
CREATE POLICY "Users view own enrollments" ON public.course_enrollments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create own enrollment" ON public.course_enrollments;
CREATE POLICY "Users create own enrollment" ON public.course_enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage enrollments" ON public.course_enrollments;
CREATE POLICY "Admins manage enrollments" ON public.course_enrollments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Service role manages enrollments" ON public.course_enrollments;
CREATE POLICY "Service role manages enrollments" ON public.course_enrollments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 10) assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id    uuid        REFERENCES public.course_modules(id) ON DELETE SET NULL,
  status       text        NOT NULL DEFAULT 'submitted',
  video_url    text,
  note         text,
  score        integer,
  reviewer_id  uuid,
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own assignments" ON public.assignments;
CREATE POLICY "Users view own assignments" ON public.assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create assignments" ON public.assignments;
CREATE POLICY "Users create assignments" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;
CREATE POLICY "Admins manage assignments" ON public.assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 11) enrollment_notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollment_notes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid        NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  author_id     uuid        NOT NULL,
  note          text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enrollment_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage enrollment notes" ON public.enrollment_notes;
CREATE POLICY "Admins manage enrollment notes" ON public.enrollment_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 12) module_progress
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.module_progress (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    uuid        NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own progress" ON public.module_progress;
CREATE POLICY "Users manage own progress" ON public.module_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.unlock_next_module(_module_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id  uuid;
  v_sort_order integer;
  v_next_id    uuid;
BEGIN
  SELECT course_id, sort_order INTO v_course_id, v_sort_order
  FROM public.course_modules WHERE id = _module_id;

  SELECT id INTO v_next_id
  FROM public.course_modules
  WHERE course_id = v_course_id AND sort_order > v_sort_order
  ORDER BY sort_order LIMIT 1;

  IF v_next_id IS NOT NULL THEN
    INSERT INTO public.module_progress (user_id, module_id, status)
    VALUES (_user_id, v_next_id, 'unlocked')
    ON CONFLICT (user_id, module_id) DO NOTHING;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 13) diagnostic_quiz_results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostic_quiz_results (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  total_score         integer     NOT NULL DEFAULT 0,
  per_qg_scores       jsonb       NOT NULL DEFAULT '{}',
  strengths           text[]      NOT NULL DEFAULT '{}',
  gaps                text[]      NOT NULL DEFAULT '{}',
  recommended_courses text[]      NOT NULL DEFAULT '{}',
  gender              text,
  age_band            text,
  occupation          text,
  interest            text,
  province            text,
  referrer            text,
  user_agent          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_quiz_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert quiz results" ON public.diagnostic_quiz_results;
CREATE POLICY "Anyone can insert quiz results" ON public.diagnostic_quiz_results FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "Users view own quiz results" ON public.diagnostic_quiz_results;
CREATE POLICY "Users view own quiz results" ON public.diagnostic_quiz_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Service role manages quiz results" ON public.diagnostic_quiz_results;
CREATE POLICY "Service role manages quiz results" ON public.diagnostic_quiz_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 14) events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text        NOT NULL,
  description          text        NOT NULL DEFAULT '',
  date                 text        NOT NULL,
  time                 text        NOT NULL DEFAULT '',
  target_date          text        NOT NULL DEFAULT '',
  address              text        NOT NULL DEFAULT '',
  creator              text        NOT NULL DEFAULT '',
  created_by           uuid        NOT NULL DEFAULT auth.uid(),
  background_image_url text        NOT NULL DEFAULT ''
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events are public" ON public.events;
CREATE POLICY "Events are public" ON public.events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users create events" ON public.events;
CREATE POLICY "Authenticated users create events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can update events" ON public.events;
CREATE POLICY "Creators can update events" ON public.events FOR UPDATE TO authenticated
  USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can delete events" ON public.events;
CREATE POLICY "Creators can delete events" ON public.events FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- 15) event_registrations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Event registrations public read" ON public.event_registrations;
CREATE POLICY "Event registrations public read" ON public.event_registrations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own event registrations" ON public.event_registrations;
CREATE POLICY "Users manage own event registrations" ON public.event_registrations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 16) articles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.articles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        UNIQUE NOT NULL,
  kind            text        NOT NULL DEFAULT 'article',
  title           text        NOT NULL,
  summary         text        NOT NULL DEFAULT '',
  target_url      text        NOT NULL DEFAULT '',
  cover_image_url text,
  sort_order      integer     NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Articles are public" ON public.articles;
CREATE POLICY "Articles are public" ON public.articles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage articles" ON public.articles;
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 17) user_accounts  (password hash — สำหรับ LINE login flow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id   text        UNIQUE NOT NULL,
  email          text        UNIQUE,
  student_id     text,
  password_hash  text,
  hash_algorithm text        NOT NULL DEFAULT 'sha256_client',
  is_active      boolean     NOT NULL DEFAULT true,
  registered_at  timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_line_user_id ON public.user_accounts (line_user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email        ON public.user_accounts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_accounts_student_id   ON public.user_accounts (student_id) WHERE student_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON public.user_accounts;
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON public.user_accounts;
CREATE POLICY "Service role only" ON public.user_accounts FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view user_accounts" ON public.user_accounts;
CREATE POLICY "Admins can view user_accounts" ON public.user_accounts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 18) Seed: course data (6 courses จาก CSV export)
-- ---------------------------------------------------------------------------
INSERT INTO public.courses (
  id, slug, tag, title, subtitle, description, duration, price,
  features, color, sort_order, is_active, learning_type, status,
  level, target_audience, format_label, kpi_notes, deliverables,
  outcome_goal, bloom_level, created_at, updated_at
) VALUES
(
  '00729d54-fd3e-4ebb-afaf-c01261f000ee','micro-express','LEAD MAGNET','MICRO EXPRESS','30-Sec Hook Formula',
  'สร้าง Hook ที่หยุดนิ้วได้ภายใน 3 ชั่วโมง — จุดเริ่มต้นที่ใช่สำหรับมือใหม่ทุกคน',
  '3 ชั่วโมง (VOD Self-paced)','',
  ARRAY['ทำไม Hook คือทุกอย่าง — สถิติ 2.3 วิ + Attention Economy','30-Sec Formula 3 ขั้น + 5 Templates','Host 5 ประเภท + ASBC ย่อ','Live Commerce 101 — Glossary 15 คำ + KPI พื้นฐาน','Hook Submission + Digital Badge "Hook Starter"'],
  'black',1,true,'online','now_open','STARTER',
  'Aspiring Host มือใหม่, SMB owners ที่อยากทดลองไลฟ์, Content Creator ที่ยังไม่เคย Live',
  'VOD Self-paced 100%',
  '[{"label":"Knowledge Check","note":"Quiz 5 ข้อ","value":"≥ 80%"},{"label":"Hook Submission","note":"เขียน Hook 1 ขั้น","value":"Feedback ≤ 24 ชม."}]'::jsonb,
  ARRAY['Digital Badge: Hook Starter – Creatr365','Live Commerce 101 Guide (PDF)','Pre-Live Checklist','Early Bird Coupon คอร์ส SIGNAL หรือ MATRIX'],
  'จำ Hook Formula ได้ เข้าใจความสำคัญของ 3 วินาทีแรก และเขียน Hook ของตัวเองได้',
  'Remember → Apply/Analyze','2026-05-05 15:28:31+00','2026-05-06 22:48:11+00'
),
(
  '0ed8369b-79cb-4a20-bd9d-1e8c3e40d5cf','signal','ENTRY LEVEL A','SIGNAL','Hook · Voice · Camera Presence',
  '3 ชั่วโมงที่เปลี่ยนการพูดของคุณตลอดชีพ — วิทยาศาสตร์แห่งการครองใจผู้ชม',
  '6 ชั่วโมง (Online + Live Session)','',
  ARRAY['Hook Architecture — 30-Sec Formula + Hook Loop','S-O-R + PAD Theory — รหัสซ่อนในสมองผู้ซื้อ','Vocal Dynamics — Tone Weight, Pacing, Whisper Trick','Camera Mastery — Eye-line Discipline + Champion Stance','Trust Architecture — Source Credibility','Selling the Why + Objection Handling','Live Session — Host Wellness + Peer Critique + Portfolio'],
  'blue',2,true,'hybrid','now_open','DEVELOPING',
  'โฮสต์ที่ไลฟ์แล้วแต่คนดูน้อย ต้องการแก้ Pain Point เสียง/กล้อง/Hook',
  'Online + Live Q&A (Hybrid)',
  '[{"label":"Pre/Post Quiz","note":"15 ข้อ ก่อน-หลังเรียน","value":"Post ≥ Pre + 20 pts"},{"label":"Hook Video Submission","note":"คลิป 30-45 วินาที","value":"ผ่าน Rubric 4 ด้าน"}]'::jsonb,
  ARRAY['Certificate: Signal Host – Creatr365','Hook Workbook + Voice Drill Pack','Trust Architecture Checklist','Personal Critique Report จาก Trainer'],
  'ใช้ Hook Loop, S-O-R, PAD Theory, Strategic Pause และรักษา Eye-line ได้จริงในไลฟ์',
  'Understand → Apply/Evaluate','2026-05-05 15:28:31+00','2026-05-06 22:48:11+00'
),
(
  'd08531a4-8c2d-4e26-8013-53c025482ed5','matrix','ENTRY LEVEL B','MATRIX','Platform · Analytics · AI Tools',
  'ข้อมูลที่ถูกต้องทำให้คุณขายได้โดยไม่ต้องพูดเยอะ — ระบบข้อมูลและ AI สำหรับโฮสต์ยุคใหม่',
  '6 ชั่วโมง (Online + Workshop)','',
  ARRAY['Algorithm Intelligence — TikTok 2026 + Peak Timing','FOMO Ladder 4 ขั้น +247% Conversion','Analytics Dashboard — TikTok / Shopee / Lazada · KPI 8 ตัว','Post-Live Report Template + GMV Formula','AI Clipping & Automation — Flowjin / Framedrop','Compliance — PDPA, DPS/ETDA','Live Session — Trust Checklist + Workshop Portfolio'],
  'green',3,true,'hybrid','now_open','DEVELOPING',
  'โฮสต์/ทีมงานที่อ่าน Analytics ไม่เป็น ต้องการเข้าใจ Algorithm และ KPI',
  'Online + Live Workshop',
  '[{"label":"GMV Quiz","note":"Scenario-based Calculation","value":"≥ 10/14"},{"label":"Live Score Analysis","note":"อ่าน Mock Dashboard","value":"≥ 80%"}]'::jsonb,
  ARRAY['Certificate: Matrix Analyst – Creatr365','KPI Dashboard Template (8 ตัว)','Post-Live Report Template','AI Clipping Toolkit'],
  'อ่าน Dashboard, คำนวณ GMV/CR/AOV/Return Rate, ใช้ FOMO Ladder และ AI Clipping ได้',
  'Understand → Apply/Evaluate','2026-05-05 15:28:31+00','2026-05-06 22:48:11+00'
),
(
  '99aec3b5-9e51-432c-981e-9f774711738e','stage','INTERMEDIATE','STAGE','Communication Mastery Lab',
  'เปลี่ยนทฤษฎีการสื่อสารเป็นกล้ามเนื้อ — ศาสตร์การสื่อสารและการครองเวทีสด Onsite Intensive 1 วัน',
  '8 ชั่วโมง (Onsite 1 วัน)','',
  ARRAY['VOCAL ENGINE LAB — Diaphragmatic Breathing, Tone, Pacing','CAMERA PRESENCE — Eye-line Discipline, 15-5-3 Rule','HOOK FACTORY — 30-Sec Formula + 5 Hook Types','NARRATIVE PERFORMANCE — Selling the Why, ASBC, Demo 3 Angles','CRISIS IMPROV LAB — Yes-and + Recovery Scripts','KPI TEST & DEBRIEF — Test Live 5 นาทีบน TikTok'],
  'yellow',4,true,'offline','now_open','COMPETENT',
  'โฮสต์ที่ต้องการพัฒนาบุคลิกภาพ-หน้ากล้อง และฝึกแก้สถานการณ์ฉุกเฉิน',
  'Onsite 1 วัน (8 ชม.)',
  '[{"label":"Live Test 5 นาที","note":"Hook · Voice · Eye-line · CTA","value":"Rubric ≥ 3/4 ทุกหมวด"},{"label":"Crisis Roleplay","note":"Dead Air, Recovery","value":"Pass 4 ข้อ"}]'::jsonb,
  ARRAY['Certificate: Certified Communication Master – Creatr365 STAGE','Personal Feedback Report','Crisis Response Card (5 สถานการณ์)'],
  'แสดงสด 5 นาทีบน TikTok ผ่านเกณฑ์ Rubric 4 ด้าน + รับมือ Crisis 5 สถานการณ์',
  'Apply → Evaluate','2026-05-05 15:28:31+00','2026-05-06 22:48:11+00'
),
(
  '24562e32-bfa8-4951-8830-efb18d9d3d9d','blueprint','ADVANCED','BLUEPRINT','Identity & Production Architecture',
  'สร้างโฮสต์ที่แบรนด์ "จำได้" และ "เลือกซ้ำ" — สถาปัตยกรรมตัวตนและระบบการผลิตมืออาชีพ',
  '16 ชั่วโมง (Onsite 2 วัน)','',
  ARRAY['5 Hidden Souls — นักแสดง / วาทยากร / นักจิตวิทยา / ผู้เชี่ยวชาญ / สถาปนิก','Brand CI Architecture — Design + Communication + Behavior + Culture','Personal Branding — Impact Formula + 7Ps + EPK + Contract','Multi-Camera Production — Hardware + Audio + OBS + Live Graphics','Team Production System — Host / Producer / Chat Mod','Live Simulation — ฝึกจริงในสภาวะกดดัน + EPK Building'],
  'red',5,true,'offline','coming_soon','PROFICIENT',
  'โฮสต์มืออาชีพ/แบรนด์ ที่ต้องการสร้างเอกลักษณ์ + ระบบการผลิต Multi-Camera',
  'Onsite 2 วัน (16 ชม.)',
  '[{"label":"Soul Identification","note":"5 Hidden Souls","value":"≥ 4/5 Souls แม่น"},{"label":"Multi-Camera Setup","note":"OBS + Hardware","value":"Setup ใช้งานได้จริง"}]'::jsonb,
  ARRAY['Certificate: Brand Architect – Creatr365 BLUEPRINT','Soul Blueprint (10+ หน้า)','Electronic Press Kit (EPK)','Brand CI Checklist + Host Contract Template'],
  'สร้าง Brand CI + Soul Blueprint + EPK ที่พร้อมส่งแบรนด์ใหญ่',
  'Analyze → Synthesize','2026-05-05 15:28:31+00','2026-05-06 22:48:11+00'
),
(
  '49c26d79-a040-4f85-8cf4-4305d51e4423','frontier','MASTER / ELITE','FRONTIER','Business & Global Strategy',
  'แยก "โฮสต์อาชีพ" ออกจาก "โฮสต์ทั่วไป" — กลยุทธ์ธุรกิจและการพิชิตตลาดสากล',
  '16 ชั่วโมง (Onsite 2 วัน)','',
  ARRAY['P&L Mastery — คำนวณกำไรจริง + Platform Fees + ROAS + Break-even','Advanced Analytics — GMV Breakdown + Retention Curve + Golden Minute','Smart Lazy Strategy — Content Pillar + LINE OA Closing','Global Market Intelligence — US / EU / China / ASEAN + กฎศุลกากร','IMC & Digital Marketing — SEO + LINE OA + Thought Leadership','Global Pitch + EPK Final — นำเสนอต่อ Expert Panel'],
  'black',6,true,'offline','coming_soon','MASTER',
  'เจ้าของแบรนด์/Agency ที่ต้องการขยายสู่ตลาดสากล (US/EU/China/ASEAN)',
  'Onsite 2 วัน (16 ชม.) + Alumni Network',
  '[{"label":"P&L Calculation","note":"GMV/Fees/Net Profit","value":"แม่นยำ ≥ 80%"},{"label":"Global Pitch","note":"30 วินาที EN","value":"Panel ≥ 4/5"}]'::jsonb,
  ARRAY['Certificate: Global Strategy Master – Creatr365 FRONTIER','P&L Template (Excel)','Global Market Guide 4 ตลาด','EPK Final Version','Agency Starter Kit','Alumni Network Access'],
  'อ่าน P&L, คำนวณ Break-even, นำเสนอ Global Pitch ภาษาอังกฤษต่อ Expert Panel',
  'Evaluate → Create','2026-05-05 15:28:31+00','2026-05-06 22:48:11+00'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 19) ตรวจสอบสถานะตารางหลังรัน
-- ---------------------------------------------------------------------------
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
