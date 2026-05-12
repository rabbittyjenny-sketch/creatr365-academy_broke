import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, RotateCcw, Check, X } from 'lucide-react';

const API_URL  = 'https://script.google.com/macros/s/AKfycbymoQ7VcpEmpRHfopPxWuALnP8p4xW-YvAIJbaPu8EMspf16_COyz9M6eYH0ulxTV5B/exec';
const API_GAP  = 'https://script.google.com/macros/s/AKfycbypfnQ5ff8lWaGaqe9N66KwuL-RCChwUnx0q33ixTvix8BX4wEy9uRxwvFrvpl8NEHk/exec';
const TAGS = ['#Hook', '#FOMO', '#Voice', '#Psychology', '#KPI', '#Brand', '#Business'] as const;
type Tag = (typeof TAGS)[number];

interface RawRow { [k: string]: string }
interface Question { skill: Tag; question: string; choices: { k: string; t: string }[]; answer: string; rationale: string }
interface Gap { weak: string; impact: string; course: string }
interface Profile { gender: string; age: string; province: string; province_other?: string; occupation: string; interest: string }

const PROVINCES = ['กรุงเทพมหานคร','เชียงใหม่','เชียงราย','ขอนแก่น','นครราชสีมา','ชลบุรี','ภูเก็ต','สงขลา','สุราษฎร์ธานี','อุดรธานี','นนทบุรี','ปทุมธานี','สมุทรปราการ','นครปฐม','พระนครศรีอยุธยา','ระยอง','อื่นๆ'];

const getVal = (o: RawRow, key: string) => {
  const t = key.toLowerCase().replace(/_/g, '');
  const k = Object.keys(o).find(k => k.toLowerCase().replace(/[\s_]/g, '') === t);
  return k ? String(o[k] ?? '') : '';
};

type Stage = 'intro' | 'survey' | 'quiz' | 'result';

const DiagnosticQuiz: React.FC = () => {
  const [stage, setStage] = useState<Stage>('intro');
  const [bank, setBank] = useState<Question[]>([]);
  const [gap, setGap] = useState<Record<string, Gap>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile>({ gender:'', age:'', province:'', occupation:'', interest:'' });
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(string|null)[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(14 * 60);

  // Load bank + gap once
  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.allSettled([
          fetch(API_URL).then(r => r.json()),
          fetch(API_GAP).then(r => r.json()),
        ]);
        if (r1.status === 'fulfilled') {
          const rows: RawRow[] = Array.isArray(r1.value) ? r1.value : (r1.value.data || []);
          const qs = rows.filter(r => getVal(r,'Is_Diagnostic').toUpperCase() === 'TRUE').map(r => ({
            skill: getVal(r,'Skill_Tag') as Tag,
            question: getVal(r,'Question'),
            choices: ([
              {k:'A', t:getVal(r,'Choice_A')},{k:'B', t:getVal(r,'Choice_B')},
              {k:'C', t:getVal(r,'Choice_C')},{k:'D', t:getVal(r,'Choice_D')},
            ]).filter(c => c.t),
            answer: getVal(r,'Answer'),
            rationale: getVal(r,'Answer_Explain') || getVal(r,'Rationale'),
          }));
          setBank(qs);
        }
        if (r2.status === 'fulfilled') {
          const rows: RawRow[] = Array.isArray(r2.value) ? r2.value : (r2.value.data || []);
          const map: Record<string, Gap> = {};
          rows.forEach(r => {
            const tag = getVal(r,'Skill_Tag');
            if (tag) map[tag] = { weak: getVal(r,'Weak_Text'), impact: getVal(r,'Impact_Statement'), course: getVal(r,'Recommended_Course') };
          });
          setGap(map);
        }
      } catch (e: any) { setError(String(e?.message||e)); }
      setLoading(false);
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (stage !== 'quiz') return;
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); finish(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const startQuiz = () => {
    const groups: Record<string, Question[]> = {};
    bank.forEach(q => { (groups[q.skill] ||= []).push(q); });
    let q: Question[] = [];
    TAGS.forEach(tag => { q = q.concat((groups[tag] || []).sort(() => Math.random() - 0.5).slice(0, 2)); });
    if (q.length < 14) q = bank.slice().sort(() => Math.random() - 0.5).slice(0, 14);
    setQuiz(q); setAnswers(new Array(q.length).fill(null)); setCurrent(0); setPicked(null); setTimeLeft(14*60); setStage('quiz');
  };

  const choose = (k: string) => {
    if (picked) return;
    setPicked(k);
    setAnswers(a => { const n = a.slice(); n[current] = k; return n; });
  };

  const next = () => {
    if (current < quiz.length - 1) { setCurrent(c => c + 1); setPicked(null); }
    else finish();
  };

  const score = useMemo(() => answers.reduce((s,a,i) => s + (a && quiz[i] && a === quiz[i].answer ? 1 : 0), 0), [answers, quiz]);
  const stats = useMemo(() => {
    const map: Record<string, { total: number; right: number }> = {};
    quiz.forEach((q, i) => {
      map[q.skill] ||= { total: 0, right: 0 };
      map[q.skill].total++;
      if (answers[i] === q.answer) map[q.skill].right++;
    });
    return map;
  }, [answers, quiz]);

  const finish = async () => {
    setStage('result');
    try {
      const per: Record<string, number> = {};
      const strengths: string[] = [];
      const gaps: string[] = [];
      const recs: string[] = [];
      TAGS.forEach(tag => {
        const s = stats[tag] || { total: 2, right: 0 };
        const p = Math.round((s.right / Math.max(s.total,1)) * 100);
        per[tag] = p;
        if (p >= 80) strengths.push(tag);
        else if (gap[tag]) {
          if (gap[tag].weak) gaps.push(`${tag}: ${gap[tag].weak}`);
          if (gap[tag].course) recs.push(gap[tag].course);
        }
      });
      const province = profile.province === 'อื่นๆ' ? (profile.province_other || 'อื่นๆ') : profile.province;
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('diagnostic_quiz_results').insert({
        user_id: user?.id || null,
        gender: profile.gender, age_band: profile.age, province,
        occupation: profile.occupation, interest: profile.interest,
        total_score: score, per_qg_scores: per,
        strengths, gaps, recommended_courses: recs,
        user_agent: navigator.userAgent, referrer: document.referrer,
      });
    } catch (e) { console.error(e); }
  };

  const reset = () => { setStage('intro'); setQuiz([]); setAnswers([]); setCurrent(0); setPicked(null); setTimeLeft(14*60); };

  const mm = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const ss = String(timeLeft%60).padStart(2,'0');

  return (
    <>
      <SEOHead title="Diagnostic Quiz - Creatr365" description="แบบทดสอบ 14 ข้อ ประเมินทักษะ Live Commerce ของคุณ" />
      <CourseNavbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        {loading && <p className="text-center text-muted-foreground py-20">กำลังเตรียมข้อมูล...</p>}
        {!loading && error && <p className="text-center text-destructive py-20">{error}</p>}

        {!loading && !error && stage === 'intro' && (
          <section className="space-y-8">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase" data-accent="green">Diagnostic</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight" data-accent="green">รู้ก่อนว่าคุณ<br/>ควรเริ่มจากตรงไหน</h1>
            <p className="text-lg text-muted-foreground max-w-xl" data-accent="green">14 คำถามสั้นๆ วิเคราะห์ว่าทักษะไหนของคุณแข็งแล้ว และโฟกัสพัฒนาอะไรก่อนจะได้ผลเร็วที่สุด</p>
            <button onClick={() => setStage('survey')} data-accent="green" className="btn-brand px-8 py-4 rounded-lg font-semibold">
              <span>เริ่มต้นทำแบบทดสอบ</span><ArrowRight className="w-4 h-4"/>
            </button>
            {bank.length === 0 && <p className="text-xs text-muted-foreground">⚠️ ยังไม่สามารถโหลดข้อสอบจากแหล่งภายนอกได้ — กรุณาลองใหม่อีกครั้ง</p>}
          </section>
        )}

        {!loading && stage === 'survey' && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold" data-accent="green">ระบุข้อมูลส่วนตัว</h2>
            <form onSubmit={(e)=>{e.preventDefault(); startQuiz();}} className="space-y-4 max-w-md">
              {[
                { name:'gender', label:'เพศ', opts:['ชาย','หญิง','ไม่ระบุ'] },
                { name:'age',    label:'อายุ', opts:['<20','20-30','31-40','>40'] },
                { name:'interest', label:'เป้าหมายของคุณ', opts:['เริ่มอาชีพ','เพิ่มยอดขาย','ศึกษาความรู้'] },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs font-bold mb-1.5">{f.label}</label>
                  <select required value={(profile as any)[f.name]} onChange={(e)=>setProfile(p=>({...p,[f.name]:e.target.value}))}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm">
                    <option value="">เลือก{f.label}</option>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold mb-1.5">จังหวัด</label>
                <select required value={profile.province} onChange={(e)=>setProfile(p=>({...p,province:e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm">
                  <option value="">เลือกจังหวัด</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {profile.province === 'อื่นๆ' && (
                <input required placeholder="ระบุจังหวัด" value={profile.province_other||''}
                  onChange={(e)=>setProfile(p=>({...p,province_other:e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"/>
              )}
              <div>
                <label className="block text-xs font-bold mb-1.5">อาชีพปัจจุบัน</label>
                <input required value={profile.occupation} onChange={(e)=>setProfile(p=>({...p,occupation:e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"/>
              </div>
              <button type="submit" data-accent="green" className="btn-brand px-6 py-3 rounded-lg font-semibold">
                ไปที่ข้อสอบ <ArrowRight className="w-4 h-4"/>
              </button>
            </form>
          </section>
        )}

        {stage === 'quiz' && quiz[current] && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-muted-foreground">No. {String(current+1).padStart(2,'0')} / {quiz.length}</span>
              <span className="text-lg font-bold tabular-nums">{mm}:{ss}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground transition-all duration-500" style={{width:`${((current+1)/quiz.length)*100}%`}}/>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-snug">{quiz[current].question}</h2>
            <div className="space-y-3">
              {quiz[current].choices.map(c => {
                const correct = quiz[current].answer === c.k;
                const wrong = picked === c.k && !correct;
                const show = !!picked;
                return (
                  <button key={c.k} onClick={()=>choose(c.k)} data-accent="green"
                    className={`w-full text-left flex items-start gap-4 p-5 rounded-2xl border-2 transition-all
                      ${show && correct ? 'border-success bg-success/5' :
                        show && wrong ? 'border-destructive bg-destructive/5' :
                        show ? 'border-border opacity-50' :
                        'border-border hover:border-[var(--hover-accent)]'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${show && correct ? 'bg-success border-success text-success-foreground' :
                        show && wrong ? 'bg-destructive border-destructive text-destructive-foreground' :
                        'border-border'}`}>
                      {show && correct ? <Check className="w-4 h-4"/> : show && wrong ? <X className="w-4 h-4"/> : c.k}
                    </div>
                    <span className="text-sm md:text-base">{c.t}</span>
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className="space-y-4">
                <div className="rounded-2xl border-l-4 border-foreground bg-muted p-5">
                  <p className="font-bold mb-1">{picked === quiz[current].answer ? 'ถูกต้อง!' : 'ยังไม่ถูก'}</p>
                  <p className="text-sm text-muted-foreground">{quiz[current].rationale || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>
                </div>
                <button onClick={next} data-accent="green" className="btn-brand px-6 py-3 rounded-lg font-semibold">
                  {current === quiz.length-1 ? 'ดูผลลัพธ์' : 'ถัดไป'} <ArrowRight className="w-4 h-4"/>
                </button>
              </div>
            )}
          </section>
        )}

        {stage === 'result' && (
          <section className="space-y-10">
            <h1 className="text-3xl md:text-5xl font-bold">You did it! Quiz complete.</h1>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-bold mb-4">📊 Skill Profile</h3>
                <div className="space-y-3">
                  {TAGS.map(tag => {
                    const s = stats[tag] || { total: 2, right: 0 };
                    const p = Math.round((s.right / Math.max(s.total,1)) * 100);
                    return (
                      <div key={tag}>
                        <div className="flex justify-between text-xs font-bold mb-1"><span>{tag}</span><span>{p}%</span></div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-foreground transition-all duration-700" style={{width:`${p}%`}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 pt-6 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">คะแนนรวมของคุณ</p>
                  <p className="text-5xl font-black mt-1">{score}/{quiz.length}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6">
                  <h3 className="font-bold mb-4">🚀 Growth Areas</h3>
                  <div className="space-y-4">
                    {TAGS.map(tag => {
                      const s = stats[tag] || { total: 2, right: 0 };
                      const p = Math.round((s.right / Math.max(s.total,1)) * 100);
                      if (p >= 80 || !gap[tag]?.weak) return null;
                      return (
                        <div key={tag} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{tag} GAP</span>
                          <p className="font-bold mt-1">{gap[tag].weak}</p>
                          {gap[tag].impact && <p className="text-xs text-muted-foreground italic mt-1 pl-3 border-l-2 border-foreground">"{gap[tag].impact}"</p>}
                          {gap[tag].course && (
                            <Link to="/courses" className="mt-3 inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full border border-foreground hover:bg-foreground hover:text-background transition">
                              {gap[tag].course} <ArrowRight className="w-3 h-3"/>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                    {TAGS.every(tag => {
                      const s = stats[tag] || { total: 2, right: 0 };
                      return Math.round((s.right / Math.max(s.total,1)) * 100) >= 80 || !gap[tag]?.weak;
                    }) && <p className="text-sm text-muted-foreground">เก่งมาก! ไม่พบจุดที่ต้องพัฒนาอย่างชัดเจน</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={reset} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-foreground font-semibold">
                    <RotateCcw className="w-4 h-4"/> เริ่มใหม่
                  </button>
                  <Link to="/courses" className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-semibold">
                    ดูคอร์ส <ArrowRight className="w-4 h-4"/>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default DiagnosticQuiz;
