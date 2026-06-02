/**
 * ============================================================
 * AdminScreen — Creatr365 LMS Backend Admin Panel
 * ============================================================
 * ไฟล์ใหม่: วางไว้ที่ src/screens/AdminScreen.jsx
 *
 * เปิดใช้งานเมื่อ student.id.startsWith("ADMIN-") หรือกำหนดใน CFG
 * Import ใน src/Creatr365_LMS_v2.jsx แล้วเพิ่ม screen routing
 *
 * Props:
 *   freeModules     : FREE_MODULES array (state จาก main app)
 *   paidCourses     : COURSES object (จาก main app, convert เป็น array)
 *   students        : array ของนักเรียนทั้งหมด (จาก API หรือ mock)
 *   onAddFreeModule : fn(moduleData) — เพิ่มโมดูลฟรีใหม่
 *   onEditFreeModule: fn(moduleId, data) — แก้ไขโมดูลฟรี
 *   onAddCourse     : fn(courseData) — เพิ่มคอร์สหลักใหม่
 *   onBack          : fn() — กลับ Dashboard
 * ============================================================
 */

import { useState } from "react";
import { EMPTY_FREE_MODULE } from "../data/freeModules";

// ── Style tokens ──────────────────────────────────────────────
const S = {
  wrap:      { maxWidth: 860, margin: "0 auto", padding: "0 16px 60px" },
  card:      { background: "#fff", border: "1px solid #E0E0E0", borderRadius: 3, padding: "18px 22px", marginBottom: 10 },
  cardSm:    { background: "#fff", border: "1px solid #E0E0E0", borderRadius: 3, padding: "12px 16px", marginBottom: 8 },
  h1:        { fontSize: 20, fontWeight: 700, margin: "0 0 4px" },
  h2:        { fontSize: 15, fontWeight: 700, margin: "0 0 8px" },
  muted:     { fontSize: 12, color: "#888" },
  btn:       { background: "#111", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 3, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnSm:     { background: "#111", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnOut:    { background: "transparent", color: "#111", border: "1.5px solid #111", padding: "8px 16px", borderRadius: 3, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnFree:   { background: "#0A5C8A", color: "#fff", border: "none", padding: "7px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnDanger: { background: "#C0392B", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 3, cursor: "pointer", fontSize: 12 },
  badge:     { display: "inline-block", background: "#111", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 2, letterSpacing: 1 },
  badgeFree: { display: "inline-block", background: "#0A5C8A", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 2, letterSpacing: 1 },
  input:     { width: "100%", border: "1.5px solid #CCC", borderRadius: 3, padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Sarabun', Arial, sans-serif" },
  select:    { width: "100%", border: "1.5px solid #CCC", borderRadius: 3, padding: "9px 12px", fontSize: 13, background: "#fff", fontFamily: "'Sarabun', Arial, sans-serif" },
  label:     { fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5, display: "block" },
  barBg:     { background: "#E5E5E5", borderRadius: 99, height: 5, flex: 1 },
  barFill:   (pct, color = "#0A5C8A") => ({ height: 5, borderRadius: 99, width: `${pct}%`, background: color }),
  divider:   { border: "none", borderTop: "1px solid #E5E5E5", margin: "14px 0" },
};

// ── Chip toggle ───────────────────────────────────────────────
function Chip({ label, on, onClick }) {
  return (
    <span onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      cursor: "pointer", border: "1.5px solid", userSelect: "none",
      borderColor: on ? "#111" : "#ddd",
      background: on ? "#111" : "#fff",
      color: on ? "#fff" : "#888",
    }}>
      {label}
    </span>
  );
}

// ── AddCourseModal ────────────────────────────────────────────
function AddCourseModal({ onClose, onSave }) {
  const [type, setType]     = useState("free");         // free | online | onsite
  const [form, setForm]     = useState({ ...EMPTY_FREE_MODULE });
  const [lessonsRaw, setLR] = useState("");             // lesson names ทีละบรรทัด
  const [error, setError]   = useState("");

  const BADGE_OPTIONS = ["MANDATORY", "STARTER", "DEVELOPING", "COMPETENT", "PROFICIENT", "MASTER"];
  const COLOR_OPTIONS = [
    { label: "น้ำเงิน", value: "#0A5C8A" },
    { label: "เขียว",  value: "#1A6B3A" },
    { label: "ดำ",     value: "#111" },
    { label: "น้ำตาล", value: "#6B3A1A" },
  ];

  function handleSave() {
    if (!form.name.trim()) { setError("กรุณากรอกชื่อ"); return; }
    const lessons = lessonsRaw.split("\n").filter(Boolean).map((l, i) => ({
      id: `${Date.now()}-L${i + 1}`,
      name: l.trim(),
      desc: "",
      dur: "",
      done: false,
      icon: "📖",
    }));
    onSave({ ...form, id: `${type.toUpperCase()}-${Date.now()}`, type, lessons });
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 6, padding: 24,
        width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={S.h2}>เพิ่มคอร์ส / โมดูลฟรี</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        {/* Type */}
        <div style={{ marginBottom: 14 }}>
          <span style={S.label}>ประเภท</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip label="🎁 FREE MODULE" on={type === "free"}   onClick={() => setType("free")} />
            <Chip label="🎥 ONLINE"      on={type === "online"} onClick={() => setType("online")} />
            <Chip label="🏫 ONSITE"      on={type === "onsite"} onClick={() => setType("onsite")} />
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 12 }}>
          <span style={S.label}>ชื่อคอร์ส / โมดูล *</span>
          <input style={S.input} placeholder="เช่น รู้ก่อนไลฟ์: จรรยาบรรณ หรือ SIGNAL"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        {/* Desc */}
        <div style={{ marginBottom: 12 }}>
          <span style={S.label}>คำอธิบายสั้น</span>
          <input style={S.input} placeholder="เช่น กฎหมาย · กฎแพลตฟอร์ม · จรรยาบรรณ"
            value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
        </div>

        {/* Badge + Duration */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={S.label}>ระดับ (Badge)</span>
            <select style={S.select} value={form.badge || "MANDATORY"}
              onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
              {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={S.label}>ระยะเวลา</span>
            <input style={S.input} placeholder="เช่น 45 นาที หรือ 6 ชั่วโมง"
              value={form.dur} onChange={e => setForm(f => ({ ...f, dur: e.target.value }))} />
          </div>
        </div>

        {/* Color (free only) */}
        {type === "free" && (
          <div style={{ marginBottom: 12 }}>
            <span style={S.label}>สีประจำโมดูล</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map(c => (
                <Chip key={c.value} label={c.label} on={form.color === c.value}
                  onClick={() => setForm(f => ({ ...f, color: c.value }))} />
              ))}
            </div>
          </div>
        )}

        {/* Lessons textarea */}
        <div style={{ marginBottom: 12 }}>
          <span style={S.label}>บทเรียน (แยกด้วย Enter — 1 บทต่อบรรทัด)</span>
          <textarea style={{ ...S.input, resize: "vertical" }} rows={5}
            placeholder={"รู้ก่อนไลฟ์: กฎหมาย อย.\nPDPA — ห้ามเอาข้อมูลลูกค้าขึ้นจอ\nกฎแพลตฟอร์ม TikTok/Shopee\nจรรยาบรรณ & มาตรฐานสากล"}
            value={lessonsRaw} onChange={e => setLR(e.target.value)} />
        </div>

        {/* Free-only options */}
        {type === "free" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div>
                <span style={S.label}>No Login Required</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Chip label="✓ ใช่" on={form.noLogin}  onClick={() => setForm(f => ({ ...f, noLogin: true }))} />
                  <Chip label="ต้อง Login" on={!form.noLogin} onClick={() => setForm(f => ({ ...f, noLogin: false }))} />
                </div>
              </div>
              <div>
                <span style={S.label}>แสดง Pinned Banner</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Chip label="📌 แสดง" on={form.pinned}  onClick={() => setForm(f => ({ ...f, pinned: true }))} />
                  <Chip label="ซ่อน"   on={!form.pinned} onClick={() => setForm(f => ({ ...f, pinned: false }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <div style={{ color: "#C0392B", fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.btnOut, flex: 1 }} onClick={onClose}>ยกเลิก</button>
          <button style={{ ...S.btn, flex: 1 }} onClick={handleSave}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab component ─────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2, background: "#f0f0ee", padding: 3, borderRadius: 4, marginBottom: 18 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "8px 10px", border: "none", borderRadius: 3,
          fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center",
          background: active === t.id ? "#fff" : "transparent",
          color: active === t.id ? "#111" : "#666",
          boxShadow: active === t.id ? "0 1px 3px rgba(0,0,0,.1)" : "none",
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── AdminScreen (default export) ──────────────────────────────
export default function AdminScreen({
  freeModules = [],
  paidCourses = [],
  students = [],
  onAddFreeModule,
  onEditFreeModule,
  onAddCourse,
  onBack,
}) {
  const [tab, setTab]       = useState("free");
  const [showModal, setModal] = useState(false);
  const [search, setSearch] = useState("");

  const TABS = [
    { id: "free",     label: "📖 โมดูลฟรี" },
    { id: "paid",     label: "🎓 คอร์สหลัก" },
    { id: "students", label: "👥 นักเรียน" },
    { id: "stats",    label: "📊 สถิติ" },
  ];

  function handleSaveNew(data) {
    if (data.type === "free") onAddFreeModule?.(data);
    else onAddCourse?.(data);
  }

  // ── Mock students (แทนที่ด้วย API จริงใน production) ──
  const mockStudents = students.length ? students : [
    { id: "STU-001", name: "ธนพล สมิทธ์",    courses: ["MICRO_EXPRESS", "SIGNAL"], freeOk: true,  level: "DEVELOPING" },
    { id: "STU-002", name: "นภสร วงศ์ดี",     courses: ["MICRO_EXPRESS"],          freeOk: true,  level: "STARTER" },
    { id: "STU-003", name: "กิตติพงศ์ ชาตรี", courses: ["MICRO_EXPRESS", "SIGNAL", "STAGE"], freeOk: false, level: "DEVELOPING" },
  ];

  const filteredStudents = mockStudents.filter(s =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Stats ──
  const totalStudents = mockStudents.length;
  const freeOkCount   = mockStudents.filter(s => s.freeOk).length;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={{ padding: "20px 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ ...S.btnOut, padding: "5px 12px", fontSize: 12 }}>← กลับ</button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={S.h1}>Admin Panel</span>
              <span style={{ ...S.badge, background: "#6B3A1A" }}>ADMIN</span>
            </div>
            <div style={S.muted}>จัดการคอร์สและโมดูลฟรีของ Creatr365</div>
          </div>
        </div>
        <button style={S.btn} onClick={() => setModal(true)}>
          + เพิ่มคอร์ส / โมดูลฟรี
        </button>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── TAB: FREE MODULES ─────────────────────────── */}
      {tab === "free" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              โมดูลฟรีทั้งหมด ({freeModules.length} โมดูล)
            </span>
            <button style={S.btnFree} onClick={() => setModal(true)}>+ เพิ่มโมดูลฟรี</button>
          </div>

          {freeModules.map(m => {
            const done = m.lessons.filter(l => l.done).length;
            const pct  = m.lessons.length ? Math.round(done / m.lessons.length * 100) : 0;
            return (
              <div key={m.id} style={{ ...S.cardSm, borderLeft: `3px solid ${m.color || "#0A5C8A"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
                      <span style={S.badgeFree}>FREE</span>
                      <span style={{ ...S.badge, background: "#2d6a1a" }}>MANDATORY</span>
                      {m.noLogin && <span style={{ fontSize: 10, color: "#0A5C8A", fontWeight: 700 }}>No Login</span>}
                      {m.pinned  && <span style={{ fontSize: 10, color: "#555",    fontWeight: 700 }}>📌 Pinned</span>}
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</span>
                    </div>
                    <div style={{ ...S.muted, marginBottom: 6 }}>{m.dur} · {m.lessons.length} บทเรียน</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <div style={S.barBg}><div style={S.barFill(pct)} /></div>
                      <span style={S.muted}>{done}/{m.lessons.length}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {m.lessons.map(l => (
                        <span key={l.id} style={{ fontSize: 11, background: "#f0f0f0", padding: "2px 8px", borderRadius: 3 }}>
                          {l.name.slice(0, 32)}{l.name.length > 32 ? "…" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btnSm, background: "transparent", color: "#111", border: "1px solid #ccc", padding: "4px 10px" }}
                      onClick={() => onEditFreeModule?.(m.id, m)}>✏️ แก้ไข</button>
                    <button style={S.btnDanger}
                      onClick={() => { if (window.confirm(`ลบโมดูล "${m.name}" ใช่หรือไม่?`)) alert("ลบแล้ว (เชื่อม API จริง)"); }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── TAB: PAID COURSES ─────────────────────────── */}
      {tab === "paid" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              คอร์สหลัก ({paidCourses.length} คอร์ส)
            </span>
            <button style={S.btn} onClick={() => setModal(true)}>+ เพิ่มคอร์ส</button>
          </div>

          {paidCourses.map(c => (
            <div key={c.id} style={S.cardSm}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={S.badge}>{c.badge}</span>
                    <span style={{ ...S.badge, background: c.type === "onsite" ? "#555" : "#222" }}>
                      {c.type === "onsite" ? "ONSITE" : "ONLINE"}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                  </div>
                  <div style={S.muted}>{c.duration} · {c.lessons?.length || 0} บท · {c.desc}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btnSm, background: "transparent", color: "#111", border: "1px solid #ccc", padding: "4px 10px" }}
                    onClick={() => alert(`แก้ไข: ${c.name}`)}>✏️</button>
                  <button style={{ ...S.btnSm, background: "transparent", color: "#0A5C8A", border: "1px solid #0A5C8A", padding: "4px 10px" }}
                    onClick={() => alert(`จัดการนักเรียน: ${c.name}`)}>👥</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── TAB: STUDENTS ─────────────────────────────── */}
      {tab === "students" && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <input style={{ ...S.input, maxWidth: 240, padding: "8px 12px", fontSize: 13 }}
              placeholder="ค้นหา STU-ID หรือชื่อ"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...S.select, maxWidth: 160, padding: "8px 12px", fontSize: 13 }}>
              <option>ทุกระดับ</option>
              <option>STARTER</option>
              <option>DEVELOPING</option>
              <option>COMPETENT</option>
            </select>
          </div>

          {filteredStudents.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", color: "#888", padding: "30px 20px" }}>
              ไม่พบนักเรียนที่ตรงกับการค้นหา
            </div>
          )}

          {filteredStudents.map(s => (
            <div key={s.id} style={S.cardSm}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, background: "#f0f0ee", padding: "2px 7px", borderRadius: 3, fontWeight: 700, color: "#555" }}>{s.id}</span>
                    <span style={{ fontWeight: 700 }}>{s.name}</span>
                    <span style={S.badge}>{s.level}</span>
                    {s.freeOk
                      ? <span style={{ fontSize: 11, color: "#0A5C8A", fontWeight: 700 }}>✓ Free Module</span>
                      : <span style={{ fontSize: 11, color: "#C0392B", fontWeight: 700 }}>⚠ ยังไม่ผ่าน Free Module</span>
                    }
                  </div>
                  <div style={S.muted}>คอร์ส: {s.courses?.join(", ") || "ยังไม่มี"}</div>
                </div>
                <button style={{ ...S.btnSm, background: "transparent", color: "#111", border: "1px solid #ccc", padding: "4px 12px", fontSize: 12 }}
                  onClick={() => alert(`รายละเอียดนักเรียน: ${s.name}`)}>
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── TAB: STATS ────────────────────────────────── */}
      {tab === "stats" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
            {[
              { num: totalStudents, lbl: "นักเรียนทั้งหมด" },
              { num: `${freeOkCount}/${totalStudents}`, lbl: "ผ่าน Free Module", color: "#0A5C8A" },
              { num: `${freeModules.length}`, lbl: "Free Modules" },
              { num: `${paidCourses.length}`, lbl: "คอร์สหลัก" },
            ].map(({ num, lbl, color = "#111" }) => (
              <div key={lbl} style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 3, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color }}>{num}</div>
                <div style={{ ...S.muted, marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Enrollment per Course</div>
            {paidCourses.map((c, i) => {
              const pct = Math.round(Math.random() * 100); // ← แทนด้วย real data จาก API
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 130, fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <div style={S.barBg}>
                    <div style={S.barFill(pct, pct > 0 ? "#0A5C8A" : "#ddd")} />
                  </div>
                  <div style={{ ...S.muted, width: 50, textAlign: "right" }}>{i + 1} คน</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showModal && (
        <AddCourseModal
          onClose={() => setModal(false)}
          onSave={handleSaveNew}
        />
      )}
    </div>
  );
}
