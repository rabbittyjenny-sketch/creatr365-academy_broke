import React, { useState } from 'react';
import { CourseNavbar } from '@/components/CourseNavbar';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Loader2 } from 'lucide-react';

const DIAGNOSTIC_URL = 'https://test-diagnostic-creatr365.vercel.app';

interface Profile { gender: string; age: string; province: string; province_other?: string; occupation: string; interest: string }

const PROVINCES = ['กรุงเทพมหานคร','เชียงใหม่','เชียงราย','ขอนแก่น','นครราชสีมา','ชลบุรี','ภูเก็ต','สงขลา','สุราษฎร์ธานี','อุดรธานี','นนทบุรี','ปทุมธานี','สมุทรปราการ','นครปฐม','พระนครศรีอยุธยา','ระยอง','อื่นๆ'];

type Stage = 'intro' | 'survey' | 'redirecting';

const DiagnosticQuiz: React.FC = () => {
  const [stage, setStage] = useState<Stage>('intro');
  const [profile, setProfile] = useState<Profile>({ gender:'', age:'', province:'', occupation:'', interest:'' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStage('redirecting');

    const province = profile.province === 'อื่นๆ' ? (profile.province_other || 'อื่นๆ') : profile.province;

    // Save demographic data to Supabase (quiz results will be saved by the external diagnostic app)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('diagnostic_quiz_results').insert({
        user_id: user?.id || null,
        gender: profile.gender, age_band: profile.age, province,
        occupation: profile.occupation, interest: profile.interest,
        total_score: 0, per_qg_scores: {}, strengths: [], gaps: [], recommended_courses: [],
        user_agent: navigator.userAgent, referrer: 'webapp_form',
      });
    } catch (_) { /* non-blocking */ }

    // Generate session ID and redirect to external diagnostic test
    const sid = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    const params = new URLSearchParams({
      autostart: 'true',
      sid,
      gender: profile.gender,
      age: profile.age,
      province,
      occupation: profile.occupation,
      interest: profile.interest,
    });
    window.location.href = `${DIAGNOSTIC_URL}/?${params.toString()}`;
  };

  return (
    <>
      <SEOHead title="Diagnostic Quiz - Creatr365" description="แบบทดสอบวัดทักษะ Live Commerce 10 ข้อ รู้ว่าคุณควรเริ่มจากตรงไหน" />
      <CourseNavbar />
      <main className="max-w-3xl mx-auto px-4 pt-28 pb-20">

        {stage === 'intro' && (
          <section className="space-y-8">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase" data-accent="green">Diagnostic</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight" data-accent="green">รู้ก่อนว่าคุณ<br/>ควรเริ่มจากตรงไหน</h1>
            <p className="text-lg text-muted-foreground max-w-xl" data-accent="green">
              10 สถานการณ์จริง วัดทักษะ 5 มิติ — ไม่มีถูกหรือผิดตายตัว มีแค่ผลสรุปที่บอกว่าคุณอยู่จุดไหน
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-none">
              <li>⏱ ใช้เวลาประมาณ 8 นาที</li>
              <li>📊 วัด 5 มิติ: AC · TB · EI · DO · ST</li>
              <li>🎯 แนะนำคอร์สที่เหมาะกับระดับของคุณ</li>
            </ul>
            <button onClick={() => setStage('survey')} data-accent="green" className="btn-brand px-8 py-4 rounded-lg font-semibold">
              <span>เริ่มต้นทำแบบทดสอบ</span><ArrowRight className="w-4 h-4"/>
            </button>
          </section>
        )}

        {stage === 'survey' && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold" data-accent="green">ระบุข้อมูลส่วนตัว</h2>
            <p className="text-sm text-muted-foreground">ข้อมูลนี้ใช้เพื่อวิเคราะห์ผลให้ตรงกับบริบทของคุณมากที่สุด ไม่ได้นำไปเปิดเผยสู่สาธารณะ</p>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              {[
                { name:'gender',   label:'เพศ',              opts:['ชาย','หญิง','ไม่ระบุ'] },
                { name:'age',      label:'อายุ',             opts:['<20','20-30','31-40','>40'] },
                { name:'interest', label:'เป้าหมายของคุณ',  opts:['เริ่มอาชีพ','เพิ่มยอดขาย','ศึกษาความรู้'] },
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
                เริ่มทำแบบทดสอบ <ArrowRight className="w-4 h-4"/>
              </button>
            </form>
          </section>
        )}

        {stage === 'redirecting' && (
          <section className="flex flex-col items-center justify-center py-32 space-y-6">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground"/>
            <p className="text-lg font-semibold">กำลังเข้าสู่ระบบแบบทดสอบ...</p>
            <p className="text-sm text-muted-foreground">รอสักครู่ กำลัง redirect ไปยังหน้าทดสอบ</p>
          </section>
        )}

      </main>
    </>
  );
};

export default DiagnosticQuiz;
