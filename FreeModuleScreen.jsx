/**
 * ============================================================
 * FreeModuleScreen — Creatr365 LMS
 * ============================================================
 * ไฟล์ใหม่: วางไว้ที่ src/screens/FreeModuleScreen.jsx
 *
 * หน้าแสดงโมดูลฟรี "รู้ก่อนไลฟ์" — ไม่ต้อง Login
 * ใช้ร่วมกับ:
 *   - src/data/freeModules.js
 *   - src/Creatr365_LMS_v2.jsx (เพิ่ม screen routing ใน main app)
 *
 * Props:
 *   freeModules     : FREE_MODULES array (state จาก main app)
 *   onBack          : fn() — กลับไปหน้าก่อน
 *   onLessonDone    : fn(moduleId, lessonId) — mark lesson done
 *   focusModuleId   : string|null — scroll ไปโมดูลที่เลือก
 * ============================================================
 */

import { useRef, useEffect } from "react";
import { calcModuleProgress } from "../data/freeModules";

// ── Shared style tokens (copy subset จาก main file เพื่อ standalone) ──
const S = {
  wrap:   { maxWidth: 820, margin: "0 auto", padding: "0 16px 60px" },
  card:   { background: "#fff", border: "1px solid #E0E0E0", borderRadius: 3, padding: "20px 24px", marginBottom: 10 },
  cardSm: { background: "#fff", border: "1px solid #E0E0E0", borderRadius: 3, padding: "14px 18px", marginBottom: 8 },
  h1:     { fontSize: 20, fontWeight: 700, margin: "0 0 4px" },
  h2:     { fontSize: 15, fontWeight: 700, margin: "0 0 6px" },
  muted:  { fontSize: 12, color: "#888" },
  btn:    { background: "#111", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 3, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  btnSm:  { background: "#111", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 3, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnOut: { background: "transparent", color: "#111", border: "1.5px solid #111", padding: "9px 18px", borderRadius: 3, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  badge:  { display: "inline-block", background: "#111", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 2, letterSpacing: 1 },
  barBg:  { background: "#E5E5E5", borderRadius: 99, height: 5, flex: 1 },
  barFill: (pct, color = "#0A5C8A") => ({ height: 5, borderRadius: 99, width: `${pct}%`, background: pct >= 100 ? "#1A6B3A" : color, transition: "width .4s" }),
};

// ── LessonRow ─────────────────────────────────────────────────
function LessonRow({ lesson, index, canStart, onMark }) {
  const isDone   = lesson.done;
  const isLocked = !canStart && !isDone;

  const numBg = isDone ? "#1A6B3A" : canStart ? "#0A5C8A" : "#E5E5E5";
  const numCl = isDone || canStart ? "#fff" : "#999";

  return (
    <div style={{
      ...S.cardSm,
      display: "flex", alignItems: "center", gap: 12,
      opacity: isLocked ? 0.45 : 1,
      borderLeft: canStart && !isDone ? `2px solid #0A5C8A` : undefined,
    }}>
      {/* หมายเลข */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: numBg, color: numCl,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {isDone ? "✓" : lesson.icon || index + 1}
      </div>

      {/* เนื้อหา */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{lesson.name}</div>
        {lesson.desc && (
          <div style={{ ...S.muted, fontSize: 11, lineHeight: 1.4 }}>{lesson.desc}</div>
        )}
        <div style={{ ...S.muted, marginTop: 2 }}>{lesson.dur}</div>
      </div>

      {/* ปุ่ม / สถานะ */}
      <div style={{ flexShrink: 0 }}>
        {isDone && (
          <span style={{ color: "#1A6B3A", fontWeight: 700, fontSize: 12 }}>✓ อ่านแล้ว</span>
        )}
        {canStart && !isDone && (
          <button
            style={{ ...S.btnSm, background: "#0A5C8A" }}
            onClick={() => onMark(lesson.id)}>
            อ่าน →
          </button>
        )}
        {isLocked && (
          <span style={{ ...S.muted, fontSize: 11 }}>🔒</span>
        )}
      </div>
    </div>
  );
}

// ── ModuleCard ────────────────────────────────────────────────
function ModuleCard({ module, moduleRef }) {
  // progress คำนวณจาก lesson.done
  const { done, total, pct } = calcModuleProgress(module);

  return (
    <div ref={moduleRef} style={{ ...S.card, borderLeft: `3px solid ${module.color || "#0A5C8A"}`, marginBottom: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
            <span style={{ ...S.badge, background: "#0A5C8A" }}>FREE</span>
            <span style={{ ...S.badge, background: "#2d6a1a" }}>MANDATORY</span>
            {module.noLogin && (
              <span style={{ fontSize: 10, color: "#0A5C8A", fontWeight: 700 }}>No Login Required</span>
            )}
          </div>
          <div style={{ ...S.h2 }}>{module.name}</div>
          <div style={{ ...S.muted, marginBottom: 6 }}>{module.dur} · {module.desc}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: pct >= 100 ? "#1A6B3A" : "#0A5C8A" }}>
            {pct}%
          </div>
          <div style={S.muted}>{done}/{total} บท</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={S.barBg}>
          <div style={S.barFill(pct, module.color || "#0A5C8A")} />
        </div>
      </div>

      {/* Topics preview */}
      {module.topics?.length > 0 && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "#F5FAFF", borderRadius: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0A5C8A", marginBottom: 6, letterSpacing: .5, textTransform: "uppercase" }}>
            เนื้อหาที่ครอบคลุม
          </div>
          {module.topics.map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: "#2A5A8A", display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
              <span style={{ color: "#0A5C8A", fontSize: 10 }}>●</span> {t}
            </div>
          ))}
        </div>
      )}

      {/* Lessons */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 8, letterSpacing: .5, textTransform: "uppercase" }}>
        บทเรียน {total} บท
      </div>
      {module.lessons.map((lesson, i) => {
        const prevDone = i === 0 || module.lessons[i - 1].done;
        return (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            index={i}
            canStart={prevDone}
            onMark={(lid) => {
              // ส่ง event ขึ้นไป parent ผ่าน custom event
              window.dispatchEvent(new CustomEvent("fm-lesson-done", {
                detail: { moduleId: module.id, lessonId: lid },
              }));
            }}
          />
        );
      })}
    </div>
  );
}

// ── FreeModuleScreen (default export) ─────────────────────────
export default function FreeModuleScreen({ freeModules, onBack, onLessonDone, focusModuleId }) {
  const moduleRefs = useRef({});

  // รับ custom event จาก LessonRow
  useEffect(() => {
    function handler(e) {
      const { moduleId, lessonId } = e.detail;
      onLessonDone(moduleId, lessonId);
    }
    window.addEventListener("fm-lesson-done", handler);
    return () => window.removeEventListener("fm-lesson-done", handler);
  }, [onLessonDone]);

  // Scroll ไปโมดูลที่เลือก (ถ้ามี focusModuleId)
  useEffect(() => {
    if (focusModuleId && moduleRefs.current[focusModuleId]) {
      moduleRefs.current[focusModuleId].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusModuleId]);

  const allDone = freeModules.every((m) => m.lessons.every((l) => l.done));

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={{ padding: "20px 0 8px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ ...S.btnOut, padding: "5px 12px", fontSize: 12 }}>
          ← กลับ
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={S.h1}>รู้ก่อนไลฟ์ — FREE MODULE</span>
            <span style={{ ...S.badge, background: "#0A5C8A" }}>FREE</span>
            <span style={{ ...S.badge, background: "#2d6a1a" }}>MANDATORY</span>
          </div>
          <div style={S.muted}>ไม่ต้องลงทะเบียน · เรียนได้ทันที · Always Free · No Login Required</div>
        </div>
      </div>

      {/* Mandatory notice */}
      <div style={{
        background: "#FFF8E1", border: "1px solid #F9C945", borderRadius: 4,
        padding: "10px 14px", fontSize: 13, color: "#7A5800", marginBottom: 18,
      }}>
        ⚠️ <strong>โมดูลนี้บังคับสำหรับทุกคน</strong> — โฮสต์ทุกคนต้องผ่านก่อนเริ่มคอร์สใดก็ตาม
        เนื้อหาครอบคลุมกฎหมาย กฎแพลตฟอร์ม และจรรยาบรรณที่โฮสต์มืออาชีพต้องรู้
      </div>

      {/* Completion banner */}
      {allDone && (
        <div style={{
          background: "#F0FAF4", border: "1px solid #1A6B3A", borderRadius: 4,
          padding: "14px 18px", marginBottom: 18,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1A6B3A" }}>🎉 ผ่านโมดูลฟรีครบแล้ว!</div>
            <div style={{ fontSize: 12, color: "#555" }}>พร้อมเริ่มคอร์สหลักได้เลย</div>
          </div>
          <button onClick={onBack} style={{ ...S.btn, background: "#1A6B3A" }}>
            ไปดูคอร์สหลัก →
          </button>
        </div>
      )}

      {/* Module cards */}
      {freeModules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          moduleRef={(el) => { moduleRefs.current[module.id] = el; }}
        />
      ))}

      {/* Footer note */}
      <div style={{ ...S.muted, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
        ข้อมูลนี้จัดทำโดย Creatr365 (iDEAS365 Live Commerce Host Academy)<br />
        hello@creatr365.space | อัปเดต 2025-2026<br />
        <em>ข้อมูลกฎหมายให้ไว้เพื่อความเข้าใจเบื้องต้น ไม่ใช่คำปรึกษาทางกฎหมาย</em>
      </div>
    </div>
  );
}
