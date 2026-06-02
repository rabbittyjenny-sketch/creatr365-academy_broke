/**
 * ============================================================
 * FREE MODULES DATA — Creatr365 LMS
 * ============================================================
 * ไฟล์ใหม่: วางไว้ที่ src/data/freeModules.js
 *
 * ข้อมูลอ้างอิงจาก:
 *   - Creatr365_รู้ก่อนไลฟ์_กฎหมาย_แพลตฟอร์ม_จรรยาบรรณ.docx
 *   - Creatr365_FreeModule_LiveWithStandards.docx
 *
 * ใช้งาน:
 *   import { FREE_MODULES, useFreeModules } from './data/freeModules';
 * ============================================================
 */

// ── Data ─────────────────────────────────────────────────────
export const FREE_MODULES_DEFAULT = [
  {
    id: "FM-01",
    name: "รู้ก่อนไลฟ์: กฎหมาย · กฎแพลตฟอร์ม · จรรยาบรรณ",
    desc: "กฎหมายไทย 5 ฉบับที่โฮสต์ต้องรู้ + กฎ 4 แพลตฟอร์ม + จรรยาบรรณ 6 ข้อ",
    dur: "25 นาที",
    noLogin: true,
    pinned: true,
    color: "#0A5C8A",
    topics: [
      "กฎหมาย อย. · พ.ร.บ.อาหาร 2522 และ พ.ร.บ.เครื่องสำอาง 2558",
      "พ.ร.บ.คุ้มครองผู้บริโภค 2522 — โฆษณาต้องพิสูจน์ได้",
      "PDPA พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล 2562",
      "พ.ร.บ.คอมพิวเตอร์ 2560 มาตรา 14 — ข้อมูลเท็จในออนไลน์",
      "กฎหมายลิขสิทธิ์ — เพลงในไลฟ์",
    ],
    lessons: [
      {
        id: "FM-01-L1",
        name: "กฎหมาย อย. — คำต้องห้ามในไลฟ์",
        desc: "พ.ร.บ.อาหาร 2522 มาตรา 40 · พ.ร.บ.เครื่องสำอาง 2558 · คำที่ห้ามพูด vs พูดแทนได้",
        dur: "5 นาที",
        done: false,
        icon: "⚖️",
      },
      {
        id: "FM-01-L2",
        name: "พ.ร.บ.คุ้มครองผู้บริโภค — โฆษณาต้องพิสูจน์ได้",
        desc: "พ.ร.บ.คุ้มครองผู้บริโภค 2522 มาตรา 22 และ 27 · สคบ. เตือนตุลาคม 2568",
        dur: "4 นาที",
        done: false,
        icon: "🛡️",
      },
      {
        id: "FM-01-L3",
        name: "PDPA — ห้ามเอาข้อมูลลูกค้าขึ้นจอในไลฟ์",
        desc: "ห้ามแสดงชื่อ เบอร์ ที่อยู่ · screenshot ออร์เดอร์ · โทษสูงสุด 5 ล้านบาท",
        dur: "5 นาที",
        done: false,
        icon: "🔒",
      },
      {
        id: "FM-01-L4",
        name: "กฎแพลตฟอร์ม: TikTok / Shopee / Facebook / Lazada",
        desc: "ข้อห้ามหลักที่มักโดนแบน + ลิงก์ทางการสำหรับตรวจสอบล่าสุด",
        dur: "7 นาที",
        done: false,
        icon: "📱",
      },
      {
        id: "FM-01-L5",
        name: "จรรยาบรรณ: สิ่งที่กฎหมายวัดไม่ได้แต่ผู้ชมรู้สึกได้",
        desc: "6 หลักการโฮสต์มืออาชีพ + กรณีจริง Viya, Li Jiaqi, สคบ. ไทย",
        dur: "4 นาที",
        done: false,
        icon: "🤝",
      },
    ],
  },
  {
    id: "FM-02",
    name: "รู้ก่อนไลฟ์: มาตรฐาน จริยธรรม และโลกที่เราอยู่",
    desc: "ตลาด Live Commerce $500B+ · Taobao Live · Amazon · โฮสต์ไทยกับเวทีโลก",
    dur: "20 นาที",
    noLogin: true,
    pinned: true,
    color: "#1A6B3A",
    topics: [
      "ตลาด Live Commerce โลก $500B+ และไทย $3B GMV 2024",
      "Taobao Live 2016-2022: บิดาแห่ง Live Commerce สมัยใหม่",
      "Amazon Live: มาตรฐานความปลอดภัยผู้บริโภคระดับโลก",
      "โฮสต์ไทยกับเวทีโลก: จุดแข็งและช่องว่างที่ต้องเติม",
    ],
    lessons: [
      {
        id: "FM-02-L1",
        name: "ตลาด Live Commerce โลก — ตัวเลขที่ต้องรู้",
        desc: "$500B+ โลก · $3B ไทย · +217% Q-on-Q · อันดับ 2 ASEAN",
        dur: "4 นาที",
        done: false,
        icon: "🌏",
      },
      {
        id: "FM-02-L2",
        name: "Taobao Live: บิดาแห่ง Live Commerce สมัยใหม่",
        desc: "2016-2022 · Li Jiaqi $1.9B/12 ชม · Host Credit System · ระเบียบโฮสต์ออนไลน์",
        dur: "6 นาที",
        done: false,
        icon: "📺",
      },
      {
        id: "FM-02-L3",
        name: "Amazon: ผู้นำด้านมาตรฐานและความปลอดภัยผู้บริโภค",
        desc: "Amazon Live 2019-2024 · Shoppable Video Guidelines · Recall System · Trust = ธุรกิจระยะยาว",
        dur: "5 นาที",
        done: false,
        icon: "📦",
      },
      {
        id: "FM-02-L4",
        name: "โฮสต์ไทยกับเวทีโลก: จุดแข็งและช่องว่างที่ต้องเติม",
        desc: "จุดแข็ง Storytelling · ช่องว่าง Analytics, กฎหมาย, Personal Brand · Creatr365 คือทางออก",
        dur: "5 นาที",
        done: false,
        icon: "🇹🇭",
      },
    ],
  },
];

// ── Admin Course Template ─────────────────────────────────────
export const EMPTY_FREE_MODULE = {
  id: "",
  name: "",
  desc: "",
  dur: "",
  noLogin: true,
  pinned: true,
  color: "#0A5C8A",
  topics: [],
  lessons: [],
};

// ── Lesson completion helpers ─────────────────────────────────
export function calcModuleProgress(module) {
  const done = module.lessons.filter((l) => l.done).length;
  return {
    done,
    total: module.lessons.length,
    pct: module.lessons.length
      ? Math.round((done / module.lessons.length) * 100)
      : 0,
  };
}

export function markLessonDone(modules, moduleId, lessonId) {
  return modules.map((m) =>
    m.id !== moduleId
      ? m
      : {
          ...m,
          lessons: m.lessons.map((l) =>
            l.id !== lessonId ? l : { ...l, done: true }
          ),
        }
  );
}
