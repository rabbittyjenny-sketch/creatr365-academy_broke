import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { RUBRICS, MODULE_RUBRIC_HINTS } from '@/lib/rubrics';

/**
 * Trainer live-scoring for onsite (offline) lessons — STAGE / BRAND HOST
 * ARCHITECT. These lessons unlock via a 4-digit session code (redeem-session-
 * code) and already gate on a Knowledge Check quiz right after; this page
 * adds the missing piece, per Jennie's explicit direction (2026-09-18): a
 * *separate, add-on* rubric score for the trainer's in-person judgment of
 * the actual practical skill (Vocal Engine, Camera Presence, Hook delivery,
 * Crisis Roleplay, Test Live) — recorded, shown, but NOT a gate on
 * progression (unlock_next_module is deliberately never called here; that
 * stays driven by the session code + quiz as it already is).
 *
 * The lesson→rubric suggestions themselves now live in ONE place —
 * MODULE_RUBRIC_HINTS in src/lib/rubrics.ts — instead of being duplicated
 * here as a second, hand-maintained map. That file's comment documents the
 * confirmed pairs (including ST4 → RUB-05, added after ST4 turned out to
 * score the same three observable behaviours as Hook Factory Speak). Any
 * lesson without a confirmed match is simply absent from that map, and the
 * trainer can still pick any rubric manually for any offline lesson.
 */

interface AccountMatch { student_id: string; email: string | null }
interface CourseOpt { id: string; slug: string; title: string }
interface ModuleOpt { id: string; code: string; name: string }
interface HistoryRow {
  id: string; created_at: string; score: number | null; rubric_id: string | null;
  course_modules: { code: string; name: string } | null;
}

// Characters that change the meaning of a PostgREST .or() filter string.
const orSafe = (q: string) => q.replace(/[,()*\\]/g, ' ').trim();
const dateTh = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

async function resolveUserIds(studentId: string): Promise<string[]> {
  const { data: accounts } = await supabase
    .from('user_accounts').select('line_user_id').eq('student_id', studentId).eq('is_active', true);
  const userIds = new Set<string>();
  const lineUserIds: string[] = [];
  (accounts || []).forEach((a: { line_user_id: string }) => {
    if (a.line_user_id.startsWith('web:')) userIds.add(a.line_user_id.replace('web:', ''));
    else lineUserIds.push(a.line_user_id);
  });
  if (lineUserIds.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('user_id').in('line_user_id', lineUserIds);
    (profs || []).forEach((p: { user_id: string }) => userIds.add(p.user_id));
  }
  return [...userIds];
}

const AdminOnsiteScoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<AccountMatch[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [userIds, setUserIds] = useState<string[]>([]);

  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState<string>('');
  const [modules, setModules] = useState<ModuleOpt[]>([]);
  const [moduleId, setModuleId] = useState<string>('');
  const [rubricId, setRubricId] = useState<string>('');
  const [dims, setDims] = useState<Record<string, string>>({});
  const [scoreInput, setScoreInput] = useState('');
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    supabase.from('courses').select('id,slug,title').eq('learning_type', 'offline').order('sort_order')
      .then(({ data }) => setCourses((data as CourseOpt[]) || []));
  }, []);

  useEffect(() => {
    setModuleId(''); setRubricId(''); setDims({});
    if (!courseId) { setModules([]); return; }
    supabase.from('course_modules').select('id,code,name').eq('course_id', courseId).order('sort_order')
      .then(({ data }) => setModules((data as ModuleOpt[]) || []));
  }, [courseId]);

  useEffect(() => {
    setDims({}); setScoreInput('');
    const mod = modules.find(m => m.id === moduleId);
    setRubricId(mod && MODULE_RUBRIC_HINTS[mod.code] ? MODULE_RUBRIC_HINTS[mod.code] : '');
  }, [moduleId, modules]);

  const loadHistory = async (ids: string[]) => {
    if (!ids.length) { setHistory([]); return; }
    const { data } = await supabase
      .from('assignments')
      .select('id,created_at,score,rubric_id,course_modules(code,name)')
      .in('user_id', ids)
      .not('rubric_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory((data as any) || []);
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setStudentId(null); setUserIds([]); setHistory([]);
    const { data, error } = await supabase
      .from('user_accounts').select('student_id,email')
      .or(`student_id.ilike.%${orSafe(q)}%,email.ilike.%${orSafe(q)}%`)
      .order('registered_at', { ascending: false }).limit(25);
    setSearching(false);
    if (error) { toast({ title: 'ค้นหาไม่สำเร็จ', description: error.message, variant: 'destructive' }); return; }
    const rows = (data as AccountMatch[]) || [];
    setMatches(rows);
    const distinct = new Set(rows.map(r => r.student_id));
    if (rows.length > 0 && distinct.size === 1) selectStudent(rows[0].student_id);
  };

  const selectStudent = async (sid: string) => {
    setStudentId(sid);
    const ids = await resolveUserIds(sid);
    setUserIds(ids);
    loadHistory(ids);
  };

  const rubric = rubricId ? RUBRICS[rubricId] : null;
  const dimTotal = Object.values(dims).reduce((s, v) => s + (Number(v) || 0), 0);

  const save = async () => {
    if (!studentId || userIds.length === 0) { toast({ title: 'เลือกนักเรียนก่อน', variant: 'destructive' }); return; }
    if (!moduleId) { toast({ title: 'เลือกบทเรียนก่อน', variant: 'destructive' }); return; }
    const score = scoreInput !== '' ? Number(scoreInput) : null;
    if (score === null || isNaN(score) || score < 0 || score > 100) {
      toast({ title: 'กรุณากรอกคะแนน 0–100', variant: 'destructive' }); return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const mod = modules.find(m => m.id === moduleId);
    const dimension_scores = Object.keys(dims).length
      ? Object.fromEntries(Object.entries(dims).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]))
      : null;

    const rows = userIds.map(uid => ({
      user_id: uid,
      course_id: courseId,
      module_id: moduleId,
      status: 'approved',
      score,
      rubric_id: rubricId || null,
      dimension_scores,
      note: `Onsite live scoring — ${mod?.code || ''}`,
      reviewer_id: session!.user.id,
      reviewed_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('assignments').insert(rows);
    setSaving(false);
    if (error) { toast({ title: 'บันทึกไม่สำเร็จ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'บันทึกคะแนนแล้ว — เป็นคะแนนเสริม ไม่กระทบการปลดล็อคบทถัดไป' });
    setScoreInput(''); setDims({});
    loadHistory(userIds);
  };

  return (
    <AdminLayout title="ให้คะแนน Onsite (Trainer)" onSignOut={() => fullSignOut().then(() => navigate('/auth'))}>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-2">1. ค้นหานักเรียน (Master Key หรืออีเมล)</p>
          <div className="flex gap-2">
            <Input placeholder="STU-xxxxxx หรือ อีเมล" value={query}
              onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
            <Button onClick={search} disabled={searching}>ค้นหา</Button>
          </div>
          {matches.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {matches.map(m => (
                <Button key={m.student_id} size="sm" variant={studentId === m.student_id ? 'default' : 'outline'}
                  onClick={() => selectStudent(m.student_id)}>
                  {m.student_id} {m.email ? `· ${m.email}` : ''}
                </Button>
              ))}
            </div>
          )}
          {studentId && <p className="text-xs text-muted-foreground mt-2">เลือกแล้ว: {studentId}</p>}
        </div>

        {studentId && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">2. เลือกคอร์ส (เฉพาะ Onsite) และบทเรียน</p>
            <div className="flex gap-2 flex-wrap">
              <select className="bg-background border border-border rounded-md px-3 py-2 text-sm"
                value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">-- เลือกคอร์ส --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <select className="bg-background border border-border rounded-md px-3 py-2 text-sm" disabled={!courseId}
                value={moduleId} onChange={e => setModuleId(e.target.value)}>
                <option value="">-- เลือกบทเรียน --</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
              </select>
              <select className="bg-background border border-border rounded-md px-3 py-2 text-sm" disabled={!moduleId}
                value={rubricId} onChange={e => setRubricId(e.target.value)}>
                <option value="">-- ไม่ใช้ Rubric --</option>
                {Object.entries(RUBRICS).map(([id, r]) => <option key={id} value={id}>{id} — {r.name}</option>)}
              </select>
            </div>

            {rubric && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold mb-1">{rubricId} — {rubric.name} <span className="text-muted-foreground font-normal">({rubric.sessionRef})</span></p>
                <p className="text-[11px] text-muted-foreground mb-2">เกณฑ์ผ่าน: {rubric.passRule}</p>
                <div className="space-y-2">
                  {rubric.dimensions.map(d => (
                    <div key={d.name} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{d.name}</p>
                        {rubric.kind === 'scale' && d.levels && (
                          <p className="text-[10px] text-muted-foreground leading-snug">
                            4: {d.levels[4]} · 3: {d.levels[3]} · 2: {d.levels[2]} · 1: {d.levels[1]}
                          </p>
                        )}
                        {rubric.kind === 'checklist' && d.criterion && (
                          <p className="text-[10px] text-muted-foreground leading-snug">{d.criterion}</p>
                        )}
                      </div>
                      {rubric.kind === 'checklist' ? (
                        <label className="flex items-center gap-1.5 shrink-0 text-xs">
                          <input type="checkbox" className="h-4 w-4"
                            checked={dims[d.name] === '1'}
                            onChange={e => setDims(prev => ({ ...prev, [d.name]: e.target.checked ? '1' : '0' }))} />
                          ผ่าน
                        </label>
                      ) : (
                        <Input type="number" min={0} max={rubric.maxPerDimension} className="w-14 h-7 text-xs shrink-0"
                          value={dims[d.name] ?? ''} onChange={e => setDims(prev => ({ ...prev, [d.name]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                </div>
                {rubric.additionalGates && rubric.additionalGates.length > 0 && (
                  <div className="mt-2 rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2">
                    <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 mb-0.5">เงื่อนไขเพิ่มเติมนอกเหนือจากคะแนน Rubric:</p>
                    {rubric.additionalGates.map((g, i) => (
                      <p key={i} className="text-[10px] text-amber-700 dark:text-amber-400">• {g}</p>
                    ))}
                  </div>
                )}
                <p className="text-[11px] mt-2 text-muted-foreground">รวมตาม Rubric: {dimTotal}/{rubric.maxScore}</p>
              </div>
            )}

            {moduleId && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">คะแนนรวม (0–100):</label>
                <Input type="number" min={0} max={100} className="w-20 h-8 text-sm" placeholder="80"
                  value={scoreInput} onChange={e => setScoreInput(e.target.value)} />
                <Button size="sm" onClick={save} disabled={saving}>บันทึกคะแนน (ไม่ปลดล็อคบทถัดไป)</Button>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-semibold mb-2">คะแนน Onsite ล่าสุดของนักเรียนนี้</p>
            <div className="space-y-1.5">
              {history.map(h => (
                <div key={h.id} className="text-xs flex justify-between border-b border-border/50 py-1.5">
                  <span>{h.course_modules?.code} {h.course_modules?.name} — {h.rubric_id}</span>
                  <span className="text-muted-foreground">{h.score}/100 · {dateTh(h.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOnsiteScoring;
