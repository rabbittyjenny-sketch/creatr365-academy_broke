
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  features TEXT[] NOT NULL DEFAULT '{}',
  color TEXT NOT NULL DEFAULT 'blue' CHECK (color IN ('blue', 'red', 'yellow', 'green', 'black')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are viewable by everyone"
ON public.courses FOR SELECT USING (true);

CREATE POLICY "Admins can insert courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
ON public.courses FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
ON public.courses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with existing course data
INSERT INTO public.courses (slug, tag, title, subtitle, description, duration, price, features, color, sort_order) VALUES
('masterclass-1', 'SIGNATURE', 'MASTERCLASS I', 'Psychology × Sales Mastery', 'เรียนรู้ S-O-R Framework, PAD Theory, FOMO Ladder +247% และ Vocal Dynamics เพื่อเพิ่ม Conversion Rate +150-400%', '2 วัน (16 ชม.)', '25,000 - 45,000 ฿', ARRAY['S-O-R Framework', 'PAD Theory', 'FOMO Ladder +247%', 'Vocal Dynamics'], 'blue', 1),
('masterclass-2', 'SIGNATURE', 'MASTERCLASS II', 'Business × Global Expansion', 'เจาะลึก Platform Algorithm, Analytics Mastery, P&L Calculation และ Global Strategy สำหรับการขยายธุรกิจระดับโลก', '2 วัน (16 ชม.)', '25,000 - 45,000 ฿', ARRAY['Platform Algorithm', 'Analytics Mastery', 'P&L Calculation', 'Global Strategy'], 'red', 2),
('combo-pass', 'COMBO', 'COMBO PASS', 'Masterclass I + II', 'ครบทุกทักษะ ส่วนลด 15-20% พร้อม Priority Support และ Certification', '4 วัน (32 ชม.)', '40,000 - 75,000 ฿', ARRAY['ครบทุกทักษะ', 'ส่วนลด 15-20%', 'Priority Support', 'Certification'], 'green', 3),
('short-course-a', 'SHORT COURSE', 'SHORT COURSE A', 'Hook, Voice & Camera Presence', 'ฝึก 30-Second Hook, Vocal Training และ Camera Framing เพื่อเริ่มต้นอย่างมืออาชีพ', '1 วัน (6 ชม.)', '3,900 - 6,900 ฿', ARRAY['30-Second Hook', 'Vocal Training', 'Camera Framing'], 'yellow', 4),
('short-course-b', 'SHORT COURSE', 'SHORT COURSE B', 'Platform Mastery & Analytics', 'เรียนรู้ TikTok Algorithm, KPI Dashboard และ AI Tools เพื่อเป็นโฮสต์ที่ขับเคลื่อนด้วยข้อมูล', '1 วัน (6 ชม.)', '3,900 - 6,900 ฿', ARRAY['TikTok Algorithm', 'KPI Dashboard', 'AI Tools'], 'blue', 5),
('micro-express', 'MICRO', 'MICRO EXPRESS', '30-Second Hook Formula', 'คอร์สออนไลน์ 3 ชั่วโมง เรียนรู้สูตร Hook ที่ดึงคนดูให้อยู่ภายใน 30 วินาที', '3 ชั่วโมง (ออนไลน์)', '1,500 - 1,900 ฿', ARRAY['30-Second Hook Formula', 'Lead Magnet', 'ออนไลน์'], 'black', 6);
