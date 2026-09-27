import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fullSignOut } from '@/lib/fullSignOut';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { RUBRICS } from '@/lib/rubrics';

interface Row {
  id: string; user_id: string; course_id: string; module_id: string | null;
  video_url: string | null; note: string | null; status: string;
  score: number | null; created_at: string;
  rubric_id: string | null; dimension_scores: Record<string, number> | null;
  review_note: string | null;
  courses?: { title: string } | null;
  course_modules?: { code: string; name: string } | null;
}

interface Who { name: string | null; studentId: string | null; email: string | null }

const STATUS_TH: Record<string, string> = { pending: 'รอตรวจ', approved: 'อนุมัติแล้ว', rejected: 'ส่งกลับแก้ไข' };

// user_id → the human the reviewer actually needs to see. Web accounts are
// linked in user_accounts as "web:<uuid>"; LINE accounts via profiles.
async function resolveWho(userIds: string[]): Promise<Record<string, Who>> {
  const out: Record<string, Who> = {};
  if (!userIds.length) return out;
  const { data: profs } = await supabase.from('profiles').select('user_id,display_name,line_user_id').in('user_id', userIds);
  const lineByUser: Record<string, string> = {};
  (profs || []).forEach(p => {
    out[p.user_id] = { name: p.display_name, studentId: null, email: null };
    if (p.line_user_id) lineByUser[p.user_id] = p.line_user_id;
  });
  const keys = [...userIds.map(u => `web:${u}`), ...Object.values(lineByUser)];
  const { data: accts } = await supabase.from('user_accounts').select('line_user_id,student_id,email').in('line_user_id', keys);
  (accts || []).forEach(a => {
    const uid = a.line_user_id.startsWith('web:')
      ? a.line_user_id.slice(4)
      : Object.keys(lineByUser).find(u => lineByUser[u] === a.line_user_id);
    if (!uid) return;
    out[uid] = { name: out[uid]?.name ?? null, studentId: a.student_id, email: a.email };
  });
  return out;
}

const AdminAssignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<'pending'|'approved'|'rejected'|'all'>('pending');
  const [loading, setLoading] = useState(true);
  // Map of assignment id → score input value (for pending items)
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  // Map of assignment id → { dimension name → score } — a scoring aid, kept
  // separate from the 0-100 `score` field the approve/unlock flow actually
  // uses (see comment on the Rubric_Header data: it doesn't define a
  // rubric-points-to-0-100 conversion, so this stays advisory, not binding).
  const [dimInputs, setDimInputs] = useState<Record<string, Record<string, string>>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [who, setWho] = useState<Record<string, Who>>({});

  const load = async () => {
    // Auth + admin role are enforced centrally by <RequireAdmin> in App.tsx.
    let q = supabase.from('assignments').select('*, courses(title), course_modules(code,name)').order('created_at',{ascending:false});
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    if (error) toast({ title: 'โหลดรายการไม่สำเร็จ', description: error.message, variant: 'destructive' });
    const list = (data as unknown as Row[]) || [];
    setRows(list);
    setWho(await resolveWho([...new Set(list.map(r => r.user_id))]));
    setLoading(false);
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const review = async (r: Row, status: 'approved'|'rejected') => {
    const { data: { session } } = await supabase.auth.getSession();
    const rawScore = scoreInputs[r.id];
    const score = rawScore !== undefined && rawScore !== '' ? Number(rawScore) : null;

    if (status === 'approved' && (score === null || isNaN(score) || score < 0 || score > 100)) {
      toast({ title: 'กรุณากรอกคะแนน 0–100', variant: 'destructive' }); return;
    }
    const review_note = (noteInputs[r.id] || '').trim() || null;
    // A returned submission with no reason leaves the learner guessing —
    // this note is what their Dashboard shows under the submission.
    if (status === 'rejected' && !review_note) {
      toast({ title: 'กรุณาเขียนเหตุผลที่ส่งกลับ ให้ผู้เรียนรู้ว่าต้องแก้อะไร', variant: 'destructive' }); return;
    }

    const rawDims = dimInputs[r.id];
    const dimension_scores = rawDims && Object.keys(rawDims).length
      ? Object.fromEntries(Object.entries(rawDims).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)]))
      : null;

    const { error } = await supabase.from('assignments').update({
      status, score: status === 'approved' ? score : null,
      dimension_scores: status === 'approved' ? dimension_scores : null,
      review_note,
      reviewer_id: session!.user.id, reviewed_at: new Date().toISOString(),
    }).eq('id', r.id);
    if (error) { toast({ title:'บันทึกผลตรวจไม่สำเร็จ', description:error.message, variant:'destructive' }); return; }
    if (status === 'approved' && r.module_id) {
      const { error: unlockErr } = await supabase.rpc('unlock_next_module', { _user_id: r.user_id, _module_id: r.module_id });
      if (unlockErr) {
        // The grade is saved; only the unlock failed. Say so, don't claim success.
        toast({ title: 'อนุมัติแล้ว แต่ปลดล็อคบทถัดไปไม่สำเร็จ', description: unlockErr.message, variant: 'destructive' });
      } else {
        toast({ title: 'อนุมัติแล้ว ปลดล็อคบทถัดไป' });
      }
    } else {
      toast({ title: status === 'approved' ? 'อนุมัติแล้ว' : 'ส่งกลับให้ผู้เรียนแก้ไขแล้ว' });
    }
    setScoreInputs(prev => { const n = {...prev}; delete n[r.id]; return n; });
    setDimInputs(prev => { const n = {...prev}; delete n[r.id]; return n; });
    setNoteInputs(prev => { const n = {...prev}; delete n[r.id]; return n; });
    load();
  };

  if (loading) return <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">Loading...</div>;

  return (
    <AdminLayout title="รายการงานส่ง" onSignOut={() => fullSignOut().then(() => navigate('/auth'))}>
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['pending','approved','rejected','all'] as const).map(f=>(
            <Button key={f} size="sm" variant={filter===f?'default':'outline'} onClick={()=>setFilter(f)}>
              {f === 'all' ? 'ทั้งหมด' : STATUS_TH[f]}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {rows.map(r=>(
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold">{r.courses?.title} · {r.course_modules?.code} {r.course_modules?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {who[r.user_id]?.name || 'ไม่มีชื่อ'}
                    {who[r.user_id]?.studentId && <> · <span className="font-mono">{who[r.user_id]!.studentId}</span></>}
                    {who[r.user_id]?.email && <> · {who[r.user_id]!.email}</>}
                    {' · '}{new Date(r.created_at).toLocaleString('th-TH')}
                  </p>
                  {r.note && <p className="text-xs mt-1 text-foreground">หมายเหตุ: {r.note}</p>}
                  {r.score !== null && <p className="text-xs mt-0.5 font-medium">คะแนน: {r.score}/100</p>}
                  {r.status !== 'pending' && r.review_note && (
                    <p className="text-xs mt-1 text-muted-foreground whitespace-pre-line">ความเห็นที่ส่งถึงผู้เรียน: {r.review_note}</p>
                  )}
                </div>
                <span className={`text-[10px] tracking-wider px-2 py-1 border whitespace-nowrap ${
                  r.status === 'approved' ? 'bg-[#34A853]/15 border-[#34A853]/30 text-[#34A853]' :
                  r.status === 'rejected' ? 'bg-[#CC0033]/15 border-[#CC0033]/30 text-[#FF6B7F]' :
                  'bg-muted border-border'
                }`}>{STATUS_TH[r.status] || r.status}</span>
              </div>

              {r.video_url && (
                <video src={r.video_url} controls className="w-full max-h-72 rounded-lg bg-foreground mb-3" />
              )}

              {r.rubric_id && RUBRICS[r.rubric_id] && (() => {
                const rubric = RUBRICS[r.rubric_id];
                const dims = dimInputs[r.id] || {};
                const setDim = (name: string, v: string) =>
                  setDimInputs(prev => ({ ...prev, [r.id]: { ...prev[r.id], [name]: v } }));
                const total = Object.values(dims).reduce((s, v) => s + (Number(v) || 0), 0);
                return (
                  <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-semibold mb-1">
                      Rubric: {r.rubric_id} — {rubric.name} <span className="text-muted-foreground font-normal">({rubric.sessionRef})</span>
                    </p>
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
                          {r.status === 'pending' && (
                            rubric.kind === 'checklist' ? (
                              <label className="flex items-center gap-1.5 shrink-0 text-xs">
                                <input type="checkbox" className="h-4 w-4"
                                  checked={dims[d.name] === '1'}
                                  onChange={e => setDim(d.name, e.target.checked ? '1' : '0')} />
                                ผ่าน
                              </label>
                            ) : (
                              <Input
                                type="number" min={0} max={rubric.maxPerDimension}
                                className="w-14 h-7 text-xs shrink-0"
                                placeholder="-"
                                value={dims[d.name] ?? ''}
                                onChange={e => setDim(d.name, e.target.value)}
                              />
                            )
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
                    {r.status === 'pending' ? (
                      <p className="text-[11px] mt-2 text-muted-foreground">
                        รวมตาม Rubric: {total}/{rubric.maxScore} — ใช้เป็นตัวช่วยกะคะแนน 0-100 ด้านล่าง (ไม่ได้แปลงให้อัตโนมัติ เพราะ rubric_master ไม่ได้กำหนดสูตรแปลงไว้)
                      </p>
                    ) : r.dimension_scores ? (
                      <p className="text-[11px] mt-2 text-muted-foreground">
                        บันทึกไว้: {Object.entries(r.dimension_scores).map(([k, v]) => `${k}=${v}`).join(', ')}
                      </p>
                    ) : null}
                  </div>
                );
              })()}

              {r.status === 'pending' && (
                <div className="space-y-2">
                <textarea
                  className="w-full bg-background border border-input px-3 py-2 text-sm min-h-[64px]"
                  placeholder="ความเห็นถึงผู้เรียน (แสดงใน Dashboard ของผู้เรียน) — จำเป็นเมื่อส่งกลับแก้ไข"
                  value={noteInputs[r.id] ?? ''}
                  onChange={e => setNoteInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">คะแนน (0–100):</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20 h-8 text-sm"
                      placeholder="80"
                      value={scoreInputs[r.id] ?? ''}
                      onChange={e => setScoreInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                    />
                  </div>
                  <Button size="sm" onClick={() => review(r, 'approved')}>
                    ✓ อนุมัติ + ปลดล็อคบทถัดไป
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => review(r, 'rejected')}>
                    ✗ ส่งกลับแก้ไข
                  </Button>
                </div>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ไม่มีรายการ</p>}
        </div>
    </AdminLayout>
  );
};

export default AdminAssignments;
