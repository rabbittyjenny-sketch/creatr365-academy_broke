import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { AuthSheet } from '@/components/AuthSheet';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Check, ArrowRight, Play } from 'lucide-react';

interface KpiNote { label: string; value: string; note?: string }

interface CourseRow {
  id: string;
  slug: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  price: string;
  features: string[];
  color: string;
  learning_type: string;
  max_slots: number | null;
  level: string | null;
  target_audience: string | null;
  format_label: string | null;
  outcome_goal: string | null;
  bloom_level: string | null;
  intro_video_url: string | null;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  kpi_notes: KpiNote[];
  deliverables: string[];
}

interface ModuleRow {
  id: string;
  code: string;
  name: string;
  summary: string;
  duration_label: string;
  sort_order: number;
}

const LEARNING_LABELS: Record<string, string> = {
  offline: 'Offline', online: 'Online', hybrid: 'Hybrid',
};

const ACCENT_CYCLE = ['blue', 'green', 'yellow', 'red'] as const;

const youTubeEmbed = (url: string): string | null => {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

const CourseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('courses').select('*').eq('slug', id).maybeSingle();
      setCourse(c as unknown as CourseRow | null);
      if (c) {
        const { data: mods } = await supabase
          .from('course_modules').select('id,code,name,summary,duration_label,sort_order')
          .eq('course_id', (c as any).id).order('sort_order');
        setModules((mods as unknown as ModuleRow[]) || []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <>
        <CourseNavbar />
        <div className="pt-28 px-4 text-center"><p>กำลังโหลด...</p></div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <CourseNavbar />
        <div className="pt-28 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">ไม่พบหลักสูตร</h1>
          <Link to="/courses" className="text-foreground underline">กลับไปดูหลักสูตรทั้งหมด</Link>
        </div>
      </>
    );
  }

  const accent = ACCENT_CYCLE[Math.abs(course.title.length) % 4];

  const handleEnroll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setIsAuthOpen(true); return; }
    navigate(`/enroll/${course.slug}`);
  };

  const ytEmbed = course.intro_video_url ? youTubeEmbed(course.intro_video_url) : null;
  const hasMedia = !!(course.cover_image_url || course.intro_video_url);

  return (
    <>
      <SEOHead title={`${course.title} - Creatr365`} description={course.description} />
      <CourseNavbar />

      <section className="pt-28 pb-12 px-4 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto">
          <Link to="/courses" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors hover-shift" data-accent={accent}>
            <ArrowLeft className="w-4 h-4" /> หลักสูตรทั้งหมด
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{course.tag}</span>
            {course.level && (
              <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border border-border text-foreground/80">
                LEVEL · {course.level}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {LEARNING_LABELS[course.learning_type] || course.learning_type}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 hover-shift" data-accent={accent}>{course.title}</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-4">{course.subtitle}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-sm text-muted-foreground">
            <span>{course.format_label || course.duration}</span>
            {course.price?.trim() && <span className="text-foreground font-bold text-lg">{course.price}</span>}
          </div>
        </div>
      </section>

      {hasMedia && (
        <section className="py-10 px-4 bg-muted/40">
          <div className="max-w-4xl mx-auto">
            {ytEmbed ? (
              <div className="aspect-video overflow-hidden border border-border">
                <iframe src={ytEmbed} title={course.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : course.intro_video_url ? (
              <video src={course.intro_video_url} controls className="w-full border border-border bg-foreground" />
            ) : course.cover_image_url ? (
              <img src={course.cover_image_url} alt={course.title} className="w-full border border-border" />
            ) : null}
          </div>
        </section>
      )}

      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-3">รายละเอียดหลักสูตร</h2>
              {course.outcome_goal && <p className="text-foreground font-medium mb-3">เป้าหมาย: {course.outcome_goal}</p>}
              <p className="text-muted-foreground leading-relaxed">{course.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">สิ่งที่จะได้เรียนรู้</h3>
              <ul className="space-y-3">
                {course.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-foreground" />
                    </div>
                    <span className="text-foreground hover-shift" data-accent={accent}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {modules.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">โครงสร้างบทเรียน</h3>
                <ol className="space-y-2">
                  {modules.map((m) => (
                    <li key={m.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground mt-0.5 w-12 flex-shrink-0">{m.code}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold hover-shift" data-accent={accent}>{m.name}</p>
                        {m.summary && <p className="text-xs text-muted-foreground mt-0.5">{m.summary}</p>}
                      </div>
                      {m.duration_label && <span className="text-[10px] text-muted-foreground flex-shrink-0">{m.duration_label}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {course.gallery_image_urls?.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">รูปจากคอร์ส</h3>
                <div className="grid grid-cols-2 gap-3">
                  {course.gallery_image_urls.map((src, i) => (
                    <img key={i} src={src} alt={`gallery-${i}`} className="rounded-xl border border-border w-full aspect-video object-cover" />
                  ))}
                </div>
              </div>
            )}

            {course.deliverables?.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">สิ่งที่ผู้เรียนจะได้รับ</h3>
                <ul className="space-y-2">
                  {course.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="hover-shift" data-accent={accent}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="card-water border border-border p-6 bg-card" data-accent={accent}>
                {course.price?.trim() && <p className="text-3xl font-bold mb-2">{course.price}</p>}
                <p className="text-sm text-muted-foreground mb-6">{course.format_label || course.duration}</p>
                <button
                  onClick={handleEnroll}
                  data-accent={accent}
                  className="btn-brand w-full py-3 rounded-lg font-medium"
                >
                  <span>สมัครเรียน</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {course.target_audience && (
                <div className="card-water border border-border p-5 bg-card" data-accent={accent}>
                  <h4 className="font-bold mb-2 text-sm">เหมาะสำหรับใคร</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{course.target_audience}</p>
                </div>
              )}

              {course.bloom_level && (
                <div className="card-water border border-border p-5 bg-card" data-accent={accent}>
                  <h4 className="font-bold mb-1 text-sm">ระดับการเรียนรู้</h4>
                  <p className="text-xs text-muted-foreground">{course.bloom_level}</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {course.kpi_notes?.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-border">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">ตัวชี้วัด & เกณฑ์ผ่าน</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {course.kpi_notes.map((k, i) => (
                <div key={i} className="rounded-lg border border-border p-3 bg-card">
                  <p className="text-xs font-semibold text-foreground hover-shift" data-accent={ACCENT_CYCLE[i % 4]}>{k.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
                  {k.note && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{k.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default CourseDetail;
