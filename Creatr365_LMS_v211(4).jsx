/**
 * ============================================================
 * CREATR365 LMS — v3.0 | May 2026
 * ============================================================
 * FLOW ที่ถูกต้อง (ตามที่ตกลงกัน):
 *   Login → Dashboard (คอร์สที่ซื้อ) → Pre-test (baseline)
 *   → ดูคลิปบทที่ 1 → KC Quiz ≥70% → unlock บทที่ 2
 *   → ดูคลิปบทที่ N → KC Quiz → จบคอร์ส
 *   → Results: Radar 5 มิติ + Host Level + แนะนำคอร์ส (max 3)
 *
 * สิ่งที่ตัดออก: Standalone Diagnostic Screen, Peer Review,
 *   Live Section, Short Answer, Post-test Delta logic
 * ============================================================
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";

// ============================================================
// ⚙️  CONFIG
// ============================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYnuFfq6E3GsU0fYznj9jrdM6hl3736ET1i3k4iZGCK5-2fyRTjF9ANHaAYdtIgV6XJQ/exec";

// Supabase enrollment endpoint (primary source — Google Apps Script is fallback)
const SUPABASE_ENROLL_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-enrollment`
  : null;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const IMG = {
  favicon: "https://ik.imagekit.io/ideas365logo/creatr365_favicon.png?updatedAt=1778430978942",
  center: "https://ik.imagekit.io/ideas365logo/creatr365_center.png?updatedAt=1778430978987",
  concept: "https://ik.imagekit.io/ideas365logo/creatr365_concept_center.png?updatedAt=1778430978985",
};
// ↑ ใส่ URL จาก Apps Script v2 ที่ Deploy แล้ว

const CFG = {
  passThreshold:   70,   // % เกณฑ์ผ่าน KC Quiz ทุกคอร์ส
  upsellGuard:     80,   // % ถ้าสูงกว่านี้ ไม่แนะนำคอร์สซ้ำ
  retakeDays:      30,   // วันที่ retake ได้โดยไม่ต้องดูคลิปใหม่
  maxWatchCount:   5,    // ดูซ้ำได้สูงสุดกี่ครั้งก่อนแจ้ง
  useApi:          true,
};

// ============================================================
// 📚  COURSE CONFIG — 6 คอร์ส
// ============================================================
const COURSES = {
  MICRO_EXPRESS: {
    id: "MICRO_EXPRESS", name: "MICRO EXPRESS", badge: "STARTER", type: "online",
    duration: "3 ชั่วโมง",
    desc: "30-Sec Hook Formula — หยุดนิ้วผู้ชมได้ใน 3 วินาที",
    pretestQGs: ["QG-01"], pretestCount: 5,
    lessons: [
      { id:"M01", name:"Why Hook คือทุกอย่าง",          dur:"8 นาที",  url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-01" },
      { id:"M02", name:"30-Sec Hook Formula ชั้นที่ 1", dur:"10 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-01" },
      { id:"M03", name:"Formula ชั้นที่ 2-3",            dur:"12 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-01" },
      { id:"M04", name:"Host คือใคร? 5 ประเภท",         dur:"8 นาที",  url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-05" },
      { id:"M05", name:"Live Commerce 101",               dur:"10 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-05" },
    ],
    // Submission optional (Hook เขียน)
    submission: { enabled: true, rubric:"RUB-07", label:"ส่ง Hook เขียน 1 ชิ้น" },
  },

  SIGNAL: {
    id: "SIGNAL", name: "SIGNAL", badge: "ENTRY A", type: "online",
    duration: "6 ชั่วโมง",
    desc: "Hook · Voice · Camera Presence — เพิ่ม Watch Time ≥30%",
    pretestQGs: ["QG-01","QG-03","QG-04"], pretestCount: 15,
    lessons: [
      { id:"S01", name:"Hook Architecture",   dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-01" },
      { id:"S02", name:"S-O-R + PAD Theory",  dur:"90 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-04" },
      { id:"S03", name:"Vocal Dynamics",       dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-03" },
      { id:"S04", name:"Camera Mastery",       dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-03" },
      { id:"S05", name:"Trust Architecture",   dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-03" },
      { id:"S06", name:"Narrative Selling",    dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-01" },
    ],
    submission: { enabled: true, rubric:"RUB-01", label:"ส่ง Hook Video 30-45 วินาที" },
  },

  MATRIX: {
    id: "MATRIX", name: "MATRIX", badge: "ENTRY B", type: "online",
    duration: "6 ชั่วโมง",
    desc: "Platform Analytics · AI Tools — Live Score >75",
    pretestQGs: ["QG-05"], pretestCount: 10,
    lessons: [
      { id:"MT01", name:"Algorithm Intel",       dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-01" },
      { id:"MT02", name:"FOMO System",            dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-02" },
      { id:"MT03", name:"Dashboard Analytics",    dur:"90 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-05" },
      { id:"MT04", name:"Reporting & GMV",        dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-05" },
      { id:"MT05", name:"AI Tools",               dur:"60 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-05" },
      { id:"MT06", name:"Compliance (PDPA/ETDA)", dur:"30 นาที", url:"https://www.youtube.com/embed/QbuyU8EGMjU?si=npNmAGbOt4I0Almb", qg:"QG-07" },
    ],
    submission: { enabled: true, rubric:null, label:"ส่ง Data Analysis Report (3 จุด + Solution)" },
  },

  STAGE: {
    id: "STAGE", name: "STAGE", badge: "INTERMEDIATE", type: "onsite",
    duration: "8 ชั่วโมง (1 วัน)",
    desc: "Communication Mastery Lab — ฝึก Vocal/Camera/Crisis Onsite",
    pretestQGs: [], pretestCount: 0, // Trainer ประเมิน
    lessons: [
      { id:"S1", name:"Vocal Engine Lab",       dur:"09:00-10:30", url:null, qg:"QG-03", sessionCode:true },
      { id:"S2", name:"Camera Presence",        dur:"10:30-11:30", url:null, qg:"QG-03", sessionCode:true },
      { id:"S3", name:"Hook Factory",           dur:"11:30-12:00", url:null, qg:"QG-01", sessionCode:true },
      { id:"S4", name:"Narrative Performance",  dur:"13:00-14:30", url:null, qg:"QG-04", sessionCode:true },
      { id:"S5", name:"Crisis Improv Lab",      dur:"14:30-16:30", url:null, qg:"QG-03", sessionCode:true },
      { id:"S6", name:"Test Live + Debrief",    dur:"16:30-17:00", url:null, qg:"QG-01", sessionCode:true },
    ],
    submission: { enabled: false, rubric:null, label:"" },
  },

  BLUEPRINT: {
    id: "BLUEPRINT", name: "BLUEPRINT", badge: "ADVANCED", type: "onsite",
    duration: "16 ชั่วโมง (2 วัน)",
    desc: "Identity & Production Architecture — สร้าง Brand CI + EPK",
    pretestQGs: [], pretestCount: 0,
    lessons: [
      { id:"B1", name:"5 Hidden Souls",             dur:"วัน 1 · 09:00-11:30", url:null, qg:"QG-06", sessionCode:true, day:1 },
      { id:"B2", name:"Brand CI Architecture",       dur:"วัน 1 · 12:30-14:30", url:null, qg:"QG-06", sessionCode:true, day:1 },
      { id:"B3", name:"Personal Branding + EPK",     dur:"วัน 1 · 14:30-16:30", url:null, qg:"QG-06", sessionCode:true, day:1 },
      { id:"B5", name:"Multi-Camera Production",     dur:"วัน 2 · 09:00-11:00", url:null, qg:"QG-06", sessionCode:true, day:2 },
      { id:"B6", name:"Team Production System",      dur:"วัน 2 · 11:00-12:30", url:null, qg:"QG-06", sessionCode:true, day:2 },
      { id:"B7", name:"Live Simulation + EPK Build", dur:"วัน 2 · 13:30-16:00", url:null, qg:"QG-06", sessionCode:true, day:2 },
    ],
    submission: { enabled: true, rubric:"RUB-11", label:"ส่ง EPK Draft (Checklist 10 ข้อ)" },
  },

  FRONTIER: {
    id: "FRONTIER", name: "FRONTIER", badge: "MASTER", type: "onsite",
    duration: "16 ชั่วโมง (2 วัน)",
    desc: "Business & Global Strategy — P&L Mastery + Global Pitch",
    pretestQGs: ["QG-05","QG-07"], pretestCount: 10,
    lessons: [
      { id:"F1", name:"P&L Mastery",               dur:"วัน 1 · 09:00-11:30", url:null, qg:"QG-07", sessionCode:true, day:1 },
      { id:"F2", name:"Advanced Analytics",         dur:"วัน 1 · 12:30-14:00", url:null, qg:"QG-05", sessionCode:true, day:1 },
      { id:"F3", name:"Smart Lazy Strategy",        dur:"วัน 1 · 14:00-15:30", url:null, qg:"QG-07", sessionCode:true, day:1 },
      { id:"F5", name:"Global Market Intelligence", dur:"วัน 2 · 09:00-11:00", url:null, qg:"QG-07", sessionCode:true, day:2 },
      { id:"F6", name:"IMC & Digital Marketing",    dur:"วัน 2 · 11:00-12:30", url:null, qg:"QG-06", sessionCode:true, day:2 },
      { id:"F7", name:"Global Pitch Simulation",    dur:"วัน 2 · 13:30-16:00", url:null, qg:"QG-07", sessionCode:true, day:2 },
    ],
    submission: { enabled: true, rubric:"RUB-04", label:"ส่ง Global Pitch (ภาษาอังกฤษ)" },
  },
};

// ลำดับระดับคอร์ส (ใช้สำหรับ unlock + แนะนำคอร์สถัดไปที่ซื้อแล้ว)
const COURSE_ORDER = ["MICRO_EXPRESS", "SIGNAL", "MATRIX", "STAGE", "BLUEPRINT", "FRONTIER"];

// Radar 5 มิติ
const RADAR_DIMS = [
  { key:"hook",   label:"Hook & FOMO",   qgs:["QG-01","QG-02"] },
  { key:"voice",  label:"เสียง/กล้อง",  qgs:["QG-03"] },
  { key:"psych",  label:"จิตวิทยา",     qgs:["QG-04"] },
  { key:"data",   label:"Data & KPI",   qgs:["QG-05"] },
  { key:"brand",  label:"Brand/ธุรกิจ", qgs:["QG-06","QG-07"] },
];

const HOST_LEVELS = [
  { min:0,  max:40,  label:"เริ่มต้น",          badge:"STARTER" },
  { min:40, max:60,  label:"กำลังพัฒนา",        badge:"DEVELOPING" },
  { min:60, max:75,  label:"มั่นใจหน้ากล้อง",   badge:"COMPETENT" },
  { min:75, max:90,  label:"มาตรฐานมืออาชีพ",  badge:"PROFICIENT" },
  { min:90, max:101, label:"Thought Leader",     badge:"MASTER" },
];

// ============================================================
// 📝  QUIZ BANK — 90 ข้อ MCQ + True/False (auto-grade)
// ============================================================
const QUIZ_BANK = [{"id":"QG01-PRE-A-001","qg":"QG-01","phase":"Pre","type":"MCQ","q":"คนดู TikTok ใช้เวลาเฉลี่ยกี่วินาทีก่อนตัดสินใจเลื่อนผ่าน?","a":"8 วินาที","b":"2.3 วินาที","c":"15 วินาที","d":"30 วินาที","ans":"B","exp":"สถิติ Attention Economy 2025-2026 ระบุว่าใช้เวลาเพียง 2.3 วินาที","rec":"MICRO EXPRESS,SIGNAL","lvl":"STARTER"},{"id":"QG01-PRE-A-002","qg":"QG-01","phase":"Pre","type":"MCQ","q":"\"Attention Economy\" ในบริบท Live Commerce หมายถึงอะไร?","a":"การใช้เงินซื้อโฆษณา","b":"การแย่งชิงความสนใจของผู้ชมในเวลาไม่กี่วินาที","c":"การวิเคราะห์ตลาด","d":"การสร้าง Content ยาว","ans":"B","exp":"Live Commerce ต้องแย่งชิงความสนใจจากแพลตฟอร์มอื่น ในเวลาสั้นมาก","rec":"SIGNAL","lvl":"STARTER"},{"id":"QG01-PRE-A-003","qg":"QG-01","phase":"Pre","type":"MCQ","q":"เหตุผลหลักที่ Live Conversion Rate สูงกว่า Website คือ?","a":"สินค้าราคาถูกกว่า","b":"การโต้ตอบ Real-time + FOMO","c":"โฆษณาเยอะกว่า","d":"ผู้ชมเยอะกว่า","ans":"B","exp":"การโต้ตอบสดและความรู้สึกเร่งด่วน (FOMO) ทำให้คนตัดสินใจซื้อเร็วกว่า","rec":"MICRO EXPRESS","lvl":"STARTER"},{"id":"QG01-PRE-A-004","qg":"QG-01","phase":"Pre","type":"MCQ","q":"ถ้า Live CR = 18% และ Website CR = 1.5% — Live สูงกว่ากี่เท่า?","a":"6 เท่า","b":"8 เท่า","c":"12 เท่า","d":"18 เท่า","ans":"C","exp":"18 ÷ 1.5 = 12 เท่า","rec":"MICRO EXPRESS","lvl":"STARTER"},{"id":"QG01-PRE-A-005","qg":"QG-01","phase":"Pre","type":"MCQ","q":"\"Hook Loop\" คืออะไร?","a":"การเปิดเพลงระหว่างไลฟ์","b":"การปล่อย Mini Hook ทุก 15-20 นาที","c":"การหยุดพักระหว่างไลฟ์","d":"การโฆษณาสินค้าซ้ำๆ","ans":"B","exp":"Hook Loop คือการปล่อย Mini Hook ทุก 15-20 นาที เพื่อดึงผู้ชมที่เริ่มเบื่อกลับมา","rec":"MICRO EXPRESS,SIGNAL","lvl":"STARTER"},{"id":"QG01-PRE-B-001","qg":"QG-01","phase":"Pre","type":"MCQ","q":"ถ้า Live CR = 12% และ Website CR = 1.2% — อัตราส่วน Live:Website คือ?","a":"5:1","b":"8:1","c":"10:1","d":"12:1","ans":"C","exp":"12 ÷ 1.2 = 10 เท่า","rec":"MICRO EXPRESS","lvl":"STARTER"},{"id":"QG01-PRE-B-002","qg":"QG-01","phase":"Pre","type":"MCQ","q":"ข้อใดเป็นตัวอย่าง Curiosity Hook ที่ดีสำหรับครีมกันแดด?","a":"\"ครีมกันแดดดีที่สุดของปี\"","b":"\"ทำไมครีม 590 บ. ถึงขายดีกว่าตัว 2,000 บ.?\"","c":"\"สวัสดีค่ะ มาดูครีมนี้กัน\"","d":"\"ลด 50% วันนี้วันเดียว\"","ans":"B","exp":"Curiosity Hook ต้องทำให้คนสงสัยและอยากรู้คำตอบทันที","rec":"SIGNAL","lvl":"STARTER"},{"id":"QG01-PRE-B-003","qg":"QG-01","phase":"Pre","type":"MCQ","q":"ข้อใดไม่ใช่ลักษณะของ Grabber ที่ดี?","a":"ชี้ปัญหาที่ผู้ชมกำลังเผชิญ","b":"ใช้ตัวเลขสถิติ","c":"ยาวเกิน 10 วินาที","d":"สร้างความอยากรู้","ans":"C","exp":"Grabber ต้องสั้น กระชับ ไม่เกิน 3-5 วินาที","rec":"SIGNAL","lvl":"STARTER"},{"id":"QG01-PRE-B-004","qg":"QG-01","phase":"Pre","type":"True_False","q":"True/False: คนดู TikTok ตัดสินใจเลื่อนผ่านภายใน 8 วินาที","a":"TRUE","b":"FALSE","c":"","d":"","ans":"B","exp":"False — ใช้เวลาเพียง 2.3 วินาทีเท่านั้น (Attention Economy 2025-2026)","rec":"MICRO EXPRESS","lvl":"STARTER"},{"id":"QG01-DUR-A-001","qg":"QG-01","phase":"During","type":"MCQ","q":"ใน 3 วินาทีแรก โฮสต์ต้องทำอะไรเป็นอันดับแรก?","a":"บอกชื่อสินค้า","b":"ขอบคุณที่เข้ามาดู","c":"หยุดนิ้วผู้ชมด้วยประโยค Grabber","d":"แนะนำตัวเอง","ans":"C","exp":"3 วินาทีแรกต้องสร้างเหตุผลให้ผู้ชมอยู่ดูต่อ ไม่ใช่แนะนำตัว","rec":"","lvl":"STARTER"},{"id":"QG01-DUR-A-002","qg":"QG-01","phase":"During","type":"MCQ","q":"\"ภูมิแพ้กำลังทำลายชีวิตคุณ มาดูทางออก\" — คือ Hook ประเภทใด?","a":"Benefit Hook","b":"Urgency Hook","c":"Pain Hook","d":"Social Proof Hook","ans":"C","exp":"Pain Hook คือการชี้ปัญหาที่ผู้ชมกำลังเผชิญอยู่","rec":"","lvl":"STARTER"},{"id":"QG01-DUR-A-003","qg":"QG-01","phase":"During","type":"MCQ","q":"Hook Loop ควรปล่อยห่างทุกกี่นาที?","a":"5-10 นาที","b":"15-20 นาที","c":"25-30 นาที","d":"30-40 นาที","ans":"B","exp":"ทุก 15-20 นาที เพื่อดึงคนที่เริ่มเบื่อกลับมา","rec":"","lvl":"STARTER"},{"id":"QG01-POST-A-002","qg":"QG-01","phase":"Post","type":"MCQ","q":"[คำนวณ] ไลฟ์ 60 นาที Hook Loop ทุก 15 นาที — ต้องปล่อยกี่ครั้ง?","a":"3 ครั้ง","b":"4 ครั้ง","c":"5 ครั้ง","d":"6 ครั้ง","ans":"B","exp":"ที่นาทีที่ 0, 15, 30, 45 รวม 4 ครั้ง","rec":"","lvl":"STARTER"},{"id":"QG01-POST-A-004","qg":"QG-01","phase":"Post","type":"MCQ","q":"[คำนวณ] ไลฟ์ 90 นาที Hook Loop ทุก 18 นาที — จะปล่อยกี่ครั้ง?","a":"4 ครั้ง","b":"5 ครั้ง","c":"6 ครั้ง","d":"7 ครั้ง","ans":"B","exp":"ที่นาทีที่ 0, 18, 36, 54, 72 รวม 5 ครั้ง","rec":"","lvl":"STARTER"},{"id":"QG01-POST-A-006","qg":"QG-01","phase":"Post","type":"MCQ","q":"[จับคู่] 'ทำไมครีม 590 บ. ขายดีกว่าตัว 2,000 บ.?' — เป็น Hook ประเภทใด?","a":"Pain Hook","b":"Benefit Hook","c":"Curiosity Hook","d":"Urgency Hook","ans":"C","exp":"ตั้งคำถามให้อยากรู้คำตอบ = Curiosity Hook","rec":"","lvl":"STARTER"},{"id":"QG01-POST-A-007","qg":"QG-01","phase":"Post","type":"MCQ","q":"[ระบุ] ไลฟ์ 45 นาที Hook Loop ทุก 15 นาที — ควรปล่อยกี่ครั้ง?","a":"2 ครั้ง","b":"3 ครั้ง","c":"4 ครั้ง","d":"5 ครั้ง","ans":"B","exp":"ที่นาทีที่ 0, 15, 30 รวม 3 ครั้ง","rec":"","lvl":"STARTER"},{"id":"QG02-PRE-A-001","qg":"QG-02","phase":"Pre","type":"MCQ","q":"FOMO Ladder ขั้นที่ 1 ทำหน้าที่อะไร?","a":"Countdown Timer","b":"Price Anchor — แสดงราคาเต็มก่อนบอกราคาลด","c":"Scarcity","d":"Social Proof","ans":"B","exp":"ขั้นที่ 1 คือการสร้าง Price Anchor ให้ผู้ชมเห็นว่า 'ลดจากราคาเท่าไร'","rec":"SIGNAL,MATRIX","lvl":"DEVELOPING"},{"id":"QG02-PRE-A-002","qg":"QG-02","phase":"Pre","type":"MCQ","q":"สีที่จิตวิทยาแนะนำให้ใช้กับ Flash Sale Badge คือ?","a":"สีส้ม","b":"สีเหลือง","c":"สีแดง #FF0000","d":"สีน้ำเงิน","ans":"C","exp":"สีแดงกระตุ้น Arousal สูงสุด ทำให้ผู้ชมรู้สึกเร่งด่วน","rec":"","lvl":"DEVELOPING"},{"id":"QG02-PRE-A-003","qg":"QG-02","phase":"Pre","type":"MCQ","q":"FOMO Ladder ขั้นที่ 3 สร้างอะไร?","a":"Countdown Timer","b":"ราคาอ้างอิง","c":"Scarcity (ความขาดแคลน)","d":"Social Proof","ans":"C","exp":"เหลือแค่ 12 ชิ้น!' สร้างความรู้สึกว่าต้องรีบก่อนหมด","rec":"","lvl":"DEVELOPING"},{"id":"QG02-PRE-A-004","qg":"QG-02","phase":"Pre","type":"MCQ","q":"Voucher Stacking (Affiliate + Seller Voucher) ให้ผลอะไรต่อ Algorithm?","a":"+5% Boost","b":"+10% Boost","c":"+15% Algorithm Boost","d":"+20% Boost","ans":"C","exp":"Voucher Stacking ส่งสัญญาณให้ Algorithm ว่า live กำลัง active","rec":"MATRIX","lvl":"DEVELOPING"},{"id":"QG02-PRE-A-005","qg":"QG-02","phase":"Pre","type":"True_False","q":"True/False: Flash Sale Badge ที่กะพริบ 0.8 วินาที ช่วยเพิ่ม Conversion","a":"TRUE","b":"FALSE","c":"","d":"","ans":"A","exp":"True — การกะพริบสร้าง Arousal และดึงดูดสายตา","rec":"","lvl":"DEVELOPING"},{"id":"QG02-POST-A-002","qg":"QG-02","phase":"Post","type":"MCQ","q":"[คำนวณ] CR ปัจจุบัน 2% หลังใช้ FOMO ครบ 4 ขั้น (+247%) — CR ใหม่จะเป็นเท่าไร?","a":"4.94%","b":"5.47%","c":"6.94%","d":"8.47%","ans":"C","exp":"2% × (1+2.47) = 2% × 3.47 = 6.94%","rec":"","lvl":"DEVELOPING"},{"id":"QG02-POST-A-003","qg":"QG-02","phase":"Post","type":"MCQ","q":"[จับคู่] ขั้น FOMO กับหน้าที่ — ขั้น 2 คือ?","a":"Price Anchor","b":"Urgency (Countdown)","c":"Scarcity","d":"Social Proof","ans":"B","exp":"ขั้น 2 = Urgency — ใช้ Countdown Timer สร้างความเร่งด่วน","rec":"","lvl":"DEVELOPING"},{"id":"QG02-POST-A-004","qg":"QG-02","phase":"Post","type":"True_False","q":"True/False: ควรใช้ Countdown ที่เป็นเท็จเพื่อสร้าง Urgency","a":"TRUE","b":"FALSE","c":"","d":"","ans":"B","exp":"False — ทำลาย Trust ระยะยาว ผู้ชมจะรู้สึกถูกหลอก","rec":"","lvl":"DEVELOPING"},{"id":"QG03-PRE-A-001","qg":"QG-03","phase":"Pre","type":"MCQ","q":"Strategic Pause ใช้ตอนไหน?","a":"เมื่อลืมสคริปต์","b":"หยุด 1-2 วินาทีก่อนบอกราคา/ข้อเสนอสำคัญ","c":"เมื่อเสียงหาย","d":"หลังพูดครบ 5 นาที","ans":"B","exp":"Strategic Pause สร้าง Anticipation ทำให้ผู้ชมรอฟังด้วยความตั้งใจ","rec":"SIGNAL,STAGE","lvl":"COMPETENT"},{"id":"QG03-PRE-A-002","qg":"QG-03","phase":"Pre","type":"MCQ","q":"Source Credibility มี 3 มิติ — ข้อใดไม่ใช่?","a":"Expertise","b":"Trustworthiness","c":"Attractiveness","d":"Popularity","ans":"D","exp":"Source Credibility (Hovland 1953) = Expertise + Trustworthiness + Attractiveness","rec":"SIGNAL","lvl":"COMPETENT"},{"id":"QG03-PRE-A-003","qg":"QG-03","phase":"Pre","type":"MCQ","q":"Dead Air ที่ยอมรับได้ในการ Live คือไม่เกินกี่วินาที?","a":"1 วินาที","b":"2 วินาที","c":"3 วินาที","d":"5 วินาที","ans":"C","exp":"Dead Air เกิน 3 วินาที ผู้ชมจะรู้สึก awkward และออกจาก live","rec":"STAGE","lvl":"COMPETENT"},{"id":"QG03-PRE-A-004","qg":"QG-03","phase":"Pre","type":"MCQ","q":"Whisper Trick ใช้เพื่อ?","a":"พูดช้าลง","b":"ลด Dead Air และดึงความสนใจในช่วงสำคัญ","c":"ประหยัดเสียง","d":"แสดงว่ามีความลับ","ans":"B","exp":"Whisper Trick = พูดเบาลงในช่วงสำคัญ สร้าง Intimacy และดึงความสนใจ","rec":"SIGNAL,STAGE","lvl":"COMPETENT"},{"id":"QG03-PRE-A-005","qg":"QG-03","phase":"Pre","type":"MCQ","q":"Eye-line ที่ถูกต้องคือ?","a":"มองหน้าจอโทรศัพท์","b":"มองกล้อง (เลนส์) ตลอด","c":"มองรายชื่อผู้ชม","d":"มองบนเพดาน","ans":"B","exp":"มองกล้องโดยตรง = สร้าง Eye Contact กับผู้ชมทุกคนพร้อมกัน","rec":"SIGNAL,STAGE","lvl":"COMPETENT"},{"id":"QG03-PRE-A-006","qg":"QG-03","phase":"Pre","type":"True_False","q":"True/False: Vocal Dynamics หมายถึงการพูดเสียงดังตลอดเวลา","a":"TRUE","b":"FALSE","c":"","d":"","ans":"B","exp":"False — Vocal Dynamics = การเปลี่ยน Tone/Pace/Volume อย่างมีเป้าหมาย","rec":"SIGNAL","lvl":"COMPETENT"},{"id":"QG03-PRE-A-007","qg":"QG-03","phase":"Pre","type":"MCQ","q":"Diaphragmatic Breathing ช่วยอะไรในการ Live?","a":"ทำให้หน้าแดง","b":"ควบคุม Tone/Pace ได้นาน ไม่เหนื่อยเร็ว","c":"ลด Dead Air","d":"เพิ่ม CR","ans":"B","exp":"การหายใจด้วยกระบังลมช่วยให้เสียงมีพลัง และ Live ได้นานโดยไม่เสียงหาย","rec":"STAGE","lvl":"COMPETENT"},{"id":"QG03-POST-A-001","qg":"QG-03","phase":"Post","type":"MCQ","q":"Champion Stance คือท่าไหน?","a":"นั่งพิงหลัง","b":"ยืนตรง ไหล่ผาย มือผ่อนคลาย พร้อมโน้มตัวหาผู้ชม","c":"ยืนมือไขว้หลัง","d":"นั่งขาไขว้","ans":"B","exp":"Champion Stance สื่อความมั่นใจ เปิดรับ และพร้อม Engage ผู้ชม","rec":"STAGE","lvl":"COMPETENT"},{"id":"QG03-POST-A-002","qg":"QG-03","phase":"Post","type":"True_False","q":"True/False: 15-5-3 Rule หมายถึงระยะโน้มตัวเข้าหากล้อง 3 ระดับ","a":"TRUE","b":"FALSE","c":"","d":"","ans":"A","exp":"True — 15cm สำหรับปกติ, 5cm สำหรับข้อเสนอสำคัญ, 3cm สำหรับ Whisper","rec":"STAGE","lvl":"COMPETENT"},{"id":"QG04-PRE-A-001","qg":"QG-04","phase":"Pre","type":"MCQ","q":"PAD Theory ย่อมาจากอะไร?","a":"Price-Audience-Design","b":"Pleasure-Arousal-Dominance","c":"Push-Attract-Drive","d":"Product-Appeal-Delivery","ans":"B","exp":"PAD (Mehrabian 1974) = Pleasure (ความพอใจ) + Arousal (ความตื่นตัว) + Dominance (ความควบคุม)","rec":"SIGNAL,FRONTIER","lvl":"COMPETENT"},{"id":"QG04-PRE-A-002","qg":"QG-04","phase":"Pre","type":"MCQ","q":"S-O-R Framework ย่อมาจาก?","a":"Sales-Order-Result","b":"Stimulus-Organism-Response","c":"Show-Offer-Revenue","d":"Story-Objective-Return","ans":"B","exp":"S-O-R = Stimulus (สิ่งกระตุ้น) → Organism (กระบวนการในตัวผู้ซื้อ) → Response (การตอบสนอง)","rec":"SIGNAL","lvl":"COMPETENT"},{"id":"QG04-PRE-A-003","qg":"QG-04","phase":"Pre","type":"MCQ","q":"4 Color Styles ในการอ่านลูกค้า — ลูกค้าสีแดงมีพฤติกรรมอย่างไร?","a":"ต้องการข้อมูลครบก่อนตัดสินใจ","b":"ตัดสินใจเร็ว ชอบผลลัพธ์ชัดเจน","c":"ต้องการสังคมและความสนุก","d":"ชอบความสัมพันธ์และ Trust","ans":"B","exp":"สีแดง = Driver — ตัดใจเร็ว ต้องการผลลัพธ์ ไม่ชอบรายละเอียดยาว","rec":"STAGE,BLUEPRINT","lvl":"COMPETENT"},{"id":"QG04-PRE-A-004","qg":"QG-04","phase":"Pre","type":"True_False","q":"True/False: Flow State ในการ Live คือสภาวะที่ผู้ชม engage อย่างเต็มที่โดยไม่รู้สึกว่าเวลาผ่าน","a":"TRUE","b":"FALSE","c":"","d":"","ans":"A","exp":"True — Flow State (Csikszentmihalyi) = immersive engagement ที่ Host ต้องสร้างให้เกิด","rec":"SIGNAL,STAGE","lvl":"COMPETENT"},{"id":"QG04-PRE-A-005","qg":"QG-04","phase":"Pre","type":"MCQ","q":"ลูกค้าที่ถามมาก ต้องการข้อมูล ชอบข้อเท็จจริง — เป็นสีไหน?","a":"สีแดง","b":"สีเหลือง","c":"สีน้ำเงิน","d":"สีเขียว","ans":"C","exp":"สีน้ำเงิน = Analytical — ต้องการข้อมูลครบ ตัดสินใจช้าแต่มั่นใจ","rec":"STAGE","lvl":"COMPETENT"},{"id":"QG04-PRE-A-006","qg":"QG-04","phase":"Pre","type":"MCQ","q":"Arousal ใน PAD Model เกี่ยวข้องกับ Flash Sale อย่างไร?","a":"ลด Arousal ทำให้คนซื้อ","b":"เพิ่ม Arousal ด้วย FOMO → ตัดสินใจเร็วขึ้น","c":"Arousal ไม่มีผลต่อการซื้อ","d":"Arousal สูง ทำให้คนออกจาก live","ans":"B","exp":"Arousal สูง = ตื่นตัว ตัดสินใจเร็ว — Flash Sale + Countdown เพิ่ม Arousal โดยตรง","rec":"SIGNAL,MATRIX","lvl":"COMPETENT"},{"id":"QG04-POST-A-001","qg":"QG-04","phase":"Post","type":"MCQ","q":"Objection Handling — ลูกค้าพูดว่า 'แพงไป' ควรตอบอย่างไรก่อน?","a":"ลดราคาทันที","b":"ยืนยันคุณค่าก่อน จากนั้นเสนอ Option","c":"เถียงว่าราคานี้ถูกแล้ว","d":"เพิกเฉย","ans":"B","exp":"Acknowledge Value ก่อน = รับรู้ความรู้สึก → เชื่อม Value → เสนอทางออก","rec":"STAGE,BLUEPRINT","lvl":"COMPETENT"},{"id":"QG04-POST-A-002","qg":"QG-04","phase":"Post","type":"True_False","q":"True/False: ASBC Technique ย่อมาจาก Attention-Story-Benefit-CTA","a":"TRUE","b":"FALSE","c":"","d":"","ans":"A","exp":"True — ASBC = โครงสร้างการนำเสนอที่ครบวงจรใน Live Commerce","rec":"STAGE","lvl":"COMPETENT"},{"id":"QG04-POST-A-003","qg":"QG-04","phase":"Post","type":"MCQ","q":"Flow State จะเกิดเมื่อไหร่?","a":"เมื่อ Host พูดเร็วมาก","b":"เมื่อ Challenge และ Skill สมดุลกัน — ยากพอดี ไม่น่าเบื่อ ไม่เครียด","c":"เมื่อมีสินค้าให้ดูเยอะ","d":"เมื่อ Host แจกของรางวัล","ans":"B","exp":"Flow State เกิดเมื่อ Challenge ≈ Skill — ผู้ชมรู้สึก engaged โดยไม่รู้ตัว","rec":"STAGE,BLUEPRINT","lvl":"COMPETENT"},{"id":"QG05-PRE-A-001","qg":"QG-05","phase":"Pre","type":"MCQ","q":"GMV ย่อมาจากอะไร?","a":"General Market Value","b":"Gross Merchandise Value","c":"Global Media Volume","d":"Growth Metric Value","ans":"B","exp":"GMV = Gross Merchandise Value = ยอดขายรวมก่อนหักค่าใช้จ่าย","rec":"MICRO EXPRESS,MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-002","qg":"QG-05","phase":"Pre","type":"MCQ","q":"CR (Conversion Rate) คำนวณจากอะไร?","a":"(จำนวนออร์เดอร์ ÷ จำนวนผู้ชม) × 100","b":"(ยอดขาย ÷ ค่าโฆษณา) × 100","c":"จำนวนผู้ชมสูงสุด ÷ เวลา","d":"(GMV ÷ CCV) × 100","ans":"A","exp":"CR% = (Orders ÷ Viewers) × 100 — ตัววัดประสิทธิภาพการขายหลัก","rec":"MICRO EXPRESS,MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-003","qg":"QG-05","phase":"Pre","type":"MCQ","q":"AOV ย่อมาจากอะไร?","a":"Average Order Volume","b":"Average Online Viewers","c":"Average Order Value","d":"Algorithm Optimization Value","ans":"C","exp":"AOV = Average Order Value = มูลค่าเฉลี่ยต่อออร์เดอร์ = GMV ÷ จำนวนออร์เดอร์","rec":"MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-004","qg":"QG-05","phase":"Pre","type":"MCQ","q":"[คำนวณ] ไลฟ์ได้ GMV 50,000 บ. มี 40 ออร์เดอร์ — AOV คือ?","a":"1,000 บ.","b":"1,250 บ.","c":"1,500 บ.","d":"2,000 บ.","ans":"B","exp":"AOV = 50,000 ÷ 40 = 1,250 บ.","rec":"MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-005","qg":"QG-05","phase":"Pre","type":"MCQ","q":"Live Score 4 ปัจจัยของ TikTok คือ?","a":"CCV, Watch Time, GMV/CCV, Comment Rate","b":"Views, Likes, Shares, Comments","c":"Followers, Following, Posts, Lives","d":"Reach, Impression, CTR, CPM","ans":"A","exp":"TikTok Live Score = CCV + Watch Time% + GMV/CCV + Comment Rate — 4 ตัวนี้ขับ algorithm","rec":"MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-006","qg":"QG-05","phase":"Pre","type":"MCQ","q":"[คำนวณ] ผู้ชม 500 คน ออร์เดอร์ 25 ใบ — CR คือ?","a":"2%","b":"5%","c":"8%","d":"10%","ans":"B","exp":"CR = 25 ÷ 500 × 100 = 5%","rec":"MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-007","qg":"QG-05","phase":"Pre","type":"MCQ","q":"Retention Curve คือกราฟอะไร?","a":"กราฟแสดงยอดขายรายวัน","b":"กราฟแสดงสัดส่วนผู้ชมที่ยังอยู่ดูเมื่อเวลาผ่านไป","c":"กราฟแสดง Follower Growth","d":"กราฟเปรียบเทียบ Live กับ VOD","ans":"B","exp":"Retention Curve = วัดว่านาทีไหนผู้ชมออก → หาจุดที่ต้องปรับ Hook Loop","rec":"MATRIX,FRONTIER","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-008","qg":"QG-05","phase":"Pre","type":"MCQ","q":"Golden Minute คือ?","a":"นาทีที่ยอดขายสูงสุด","b":"ช่วงนาทีที่ Retention Curve ชันลงมากที่สุด — จุดที่ต้องวาง Hook Loop","c":"นาทีแรกของ live","d":"นาทีที่ผู้ชมเยอะสุด","ans":"B","exp":"Golden Minute = ช่วงที่ต้องใส่ Hook ก่อนผู้ชมออกจำนวนมาก — ดึงกลับได้มากที่สุด","rec":"MATRIX,FRONTIER","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-009","qg":"QG-05","phase":"Pre","type":"MCQ","q":"[คำนวณ] GMV 80,000 บ. CCV เฉลี่ย 200 คน — GMV/CCV คือ?","a":"200 บ.","b":"300 บ.","c":"400 บ.","d":"500 บ.","ans":"C","exp":"GMV/CCV = 80,000 ÷ 200 = 400 บ. — ตัววัดว่าผู้ชม 1 คน generate รายได้เท่าไร","rec":"MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-010","qg":"QG-05","phase":"Pre","type":"True_False","q":"True/False: Watch Time ≥30% หมายความว่าผู้ชมอยู่ดูนานกว่า 30 วินาที","a":"TRUE","b":"FALSE","c":"","d":"","ans":"A","exp":"True — SIGNAL กำหนด Watch Time ≥30% ของผู้ชมอยู่ดูนานกว่า 30 วินาที","rec":"SIGNAL,MATRIX","lvl":"PROFICIENT"},{"id":"QG05-PRE-A-011","qg":"QG-05","phase":"Pre","type":"MCQ","q":"[คำนวณ] Live Score = CCV(30)+WatchTime(25)+GMV/CCV(15)+Comment(5) = ?","a":"65","b":"70","c":"75","d":"80","ans":"C","exp":"30+25+15+5 = 75 (Live Score >75 คือเกณฑ์ผ่านของ MATRIX)","rec":"MATRIX","lvl":"PROFICIENT"},{"id":"QG05-POST-A-001","qg":"QG-05","phase":"Post","type":"MCQ","q":"[คำนวณ] ผู้ชม 1,200 คน ออร์เดอร์ 35 ใบ — CR คือ?","a":"2.4%","b":"2.9%","c":"3.2%","d":"3.8%","ans":"B","exp":"CR = 35 ÷ 1,200 × 100 = 2.92% ≈ 2.9%","rec":"MATRIX,FRONTIER","lvl":"PROFICIENT"},{"id":"QG05-POST-A-002","qg":"QG-05","phase":"Post","type":"MCQ","q":"[คำนวณ] GMV จากราคาเฉลี่ย 650 บ. ออร์เดอร์ 35 ใบ = ?","a":"19,250 บ.","b":"21,000 บ.","c":"22,750 บ.","d":"24,500 บ.","ans":"C","exp":"GMV = 35 × 650 = 22,750 บ.","rec":"MATRIX,FRONTIER","lvl":"PROFICIENT"},{"id":"QG05-POST-A-004","qg":"QG-05","phase":"Post","type":"MCQ","q":"[Live Score] CCV=120, WatchTime=40%, GMV/CCV=120 บ., Comment=4% — ระดับไหน?","a":"ต่ำกว่า 50","b":"50-65","c":"66-75","d":"สูงกว่า 75","ans":"D","exp":"Watch Time 40% + Comment 4% + GMV/CCV 120 บ. ดีทุกด้าน — Live Score >75","rec":"MATRIX","lvl":"PROFICIENT"},{"id":"QG05-POST-A-005","qg":"QG-05","phase":"Post","type":"MCQ","q":"Net Margin ที่เหมาะสมใน Live Commerce คือ?","a":"5-10%","b":"10-15%","c":"20-30%","d":"40-50%","ans":"C","exp":"Net Margin 20-30% คือ target ที่ FRONTIER สอน — ต่ำกว่า 20% ถือว่าควรปรับ model","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG05-POST-A-006","qg":"QG-05","phase":"Post","type":"MCQ","q":"ROAS ย่อมาจาก?","a":"Return on Ad Spend","b":"Reach of Average Sessions","c":"Revenue on All Sales","d":"Rate of Audience Satisfaction","ans":"A","exp":"ROAS = ทุก 1 บ. ที่จ่ายโฆษณา ได้รายได้กลับมากี่บ.","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG06-PRE-A-001","qg":"QG-06","phase":"Pre","type":"MCQ","q":"ใน Live Commerce ทีม Production มีกี่บทบาทหลัก?","a":"2 บทบาท","b":"3 บทบาท","c":"4 บทบาท","d":"5 บทบาท","ans":"C","exp":"Host / Producer / Chat Mod / Inventory — 4 บทบาทหลักในทีม Live Production","rec":"STAGE,BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG06-PRE-A-002","qg":"QG-06","phase":"Pre","type":"MCQ","q":"5 Hidden Souls คือ?","a":"5 ประเภทผู้ชม","b":"5 บุคลิกหลักที่โฮสต์ดึงมาใช้หน้ากล้อง","c":"5 ขั้นตอนการขาย","d":"5 Platform ที่ต้องไลฟ์","ans":"B","exp":"5 Hidden Souls = นักแสดง / วาทยากร / นักจิตวิทยา / ผู้เชี่ยวชาญ / สถาปนิก","rec":"BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG06-PRE-A-003","qg":"QG-06","phase":"Pre","type":"MCQ","q":"Brand CI ย่อมาจาก?","a":"Brand Content Index","b":"Brand Corporate Identity","c":"Brand Creative Intelligence","d":"Brand Customer Interface","ans":"B","exp":"Brand CI = Corporate Identity — ระบบที่ทำให้แบรนด์มีความสม่ำเสมอในทุกจุดสัมผัส","rec":"BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG06-PRE-A-004","qg":"QG-06","phase":"Pre","type":"MCQ","q":"EPK ย่อมาจาก?","a":"Electronic Press Kit","b":"Event Planning Kit","c":"Engagement Performance KPI","d":"Extended Product Knowledge","ans":"A","exp":"EPK = Electronic Press Kit — เอกสารแนะนำตัวโฮสต์สำหรับแบรนด์ใหญ่","rec":"BLUEPRINT,FRONTIER","lvl":"PROFICIENT"},{"id":"QG06-PRE-A-005","qg":"QG-06","phase":"Pre","type":"MCQ","q":"หน้าที่ Chat Mod ในทีม Live คือ?","a":"ควบคุมกล้อง","b":"ตอบ Comment + กรอง Spam + แจ้ง Host สิ่งสำคัญ","c":"จัดสต็อกสินค้า","d":"ดูแลไฟและแสง","ans":"B","exp":"Chat Mod ต้องตอบภายใน 30 วินาที + กรอง Negative + Pass Key Info ให้ Host","rec":"BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG06-PRE-A-006","qg":"QG-06","phase":"Pre","type":"MCQ","q":"OBS ใช้สำหรับ?","a":"วิเคราะห์ข้อมูล","b":"สร้าง Script","c":"Software สำหรับ Streaming หลายกล้อง/Overlay","d":"จัดการ LINE OA","ans":"C","exp":"OBS = Open Broadcaster Software — ใช้สำหรับ Multi-camera Live + Graphic Overlay","rec":"BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG06-PRE-A-007","qg":"QG-06","phase":"Pre","type":"True_False","q":"True/False: Host ที่ดีไม่จำเป็นต้องมี Brand Identity ชัดเจน","a":"TRUE","b":"FALSE","c":"","d":"","ans":"B","exp":"False — Brand Memory เกิดจาก Identity ที่สม่ำเสมอ แบรนด์ใหญ่จ้างโฮสต์ที่จำได้","rec":"BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG06-PRE-A-008","qg":"QG-06","phase":"Pre","type":"MCQ","q":"Marketing Mix 7Ps — P ตัวที่ 7 คือ?","a":"Positioning","b":"People, Process, Physical Evidence","c":"Performance","d":"Promotion","ans":"B","exp":"7Ps = Product/Price/Place/Promotion + People/Process/Physical Evidence","rec":"BLUEPRINT,FRONTIER","lvl":"PROFICIENT"},{"id":"QG06-POST-A-001","qg":"QG-06","phase":"Post","type":"MCQ","q":"Hand Signal ในทีม Live ใช้เมื่อ?","a":"เมื่อต้องการพักเบรก","b":"สื่อสารระหว่าง Host กับทีม โดยไม่รบกวนการ Live","c":"เมื่อสินค้าหมด","d":"เมื่อ CCV ตก","ans":"B","exp":"Hand Signal = ระบบสื่อสารเงียบ ทำให้การ Live ดูราบรื่น ผู้ชมไม่รู้ว่ามีการประสานงาน","rec":"BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG06-POST-A-002","qg":"QG-06","phase":"Post","type":"MCQ","q":"Soul หลักของโฮสต์ควรมีกี่ Soul?","a":"1 Soul (Soul เดียว)","b":"Soul หลัก 1 + Soul รอง 1-2","c":"ใช้ทั้ง 5 เท่าๆ กัน","d":"เลือกตาม Mood แต่ละวัน","ans":"B","exp":"Soul หลัก 1 = เอกลักษณ์ + Soul รอง 1-2 = ความยืดหยุ่น ไม่กระจัดกระจาย","rec":"BLUEPRINT","lvl":"PROFICIENT"},{"id":"QG07-PRE-A-001","qg":"QG-07","phase":"Pre","type":"MCQ","q":"Net Margin ที่เหมาะสมใน Live Commerce คือ?","a":"5-10%","b":"10-15%","c":"20-30%","d":"40-50%","ans":"C","exp":"Net Margin 20-30% — Platform fees 6-9% + Affiliate 10-20% + Ad Spend","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-PRE-A-002","qg":"QG-07","phase":"Pre","type":"MCQ","q":"Platform Fee ของ TikTok Shop โดยทั่วไปอยู่ที่?","a":"1-3%","b":"3-5%","c":"6-9%","d":"10-15%","ans":"C","exp":"TikTok Shop Platform Fee 6-9% ขึ้นกับ category + seller tier","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-PRE-A-003","qg":"QG-07","phase":"Pre","type":"MCQ","q":"Smart Lazy Strategy หมายถึง?","a":"ทำงานน้อยลง ขายน้อยลง","b":"ระบบที่ขยายรายได้โดยไม่เพิ่มชั่วโมงทำงาน","c":"การใช้ AI แทนทุกอย่าง","d":"การจ้าง Team ใหญ่","ans":"B","exp":"Smart Lazy = ไลฟ์สูงสุด 3 วัน/สัปดาห์ + ขยายด้วย Content Repurpose + AI Automation","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-PRE-A-004","qg":"QG-07","phase":"Pre","type":"MCQ","q":"Affiliate Commission ใน Live Commerce อยู่ที่เท่าไรโดยทั่วไป?","a":"1-5%","b":"5-8%","c":"10-20%","d":"25-30%","ans":"C","exp":"Affiliate Commission 10-20% ขึ้นกับแบรนด์และ category สินค้า","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-PRE-A-005","qg":"QG-07","phase":"Pre","type":"MCQ","q":"Break-even GMV คือ?","a":"GMV ที่สูงที่สุด","b":"GMV ขั้นต่ำที่ต้องทำเพื่อไม่ขาดทุน","c":"GMV เฉลี่ย 3 เดือน","d":"GMV target สำหรับ KOL","ans":"B","exp":"Break-even = Fixed Cost + Variable Cost ÷ Net Margin% — รู้แล้วตั้งเป้าได้ถูก","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-001","qg":"QG-07","phase":"Post","type":"MCQ","q":"Content Pillar คือ?","a":"เสาค้ำกล้อง","b":"หัวข้อหลักที่ใช้ผลิต Content ซ้ำได้อย่างสม่ำเสมอ","c":"ยอดผู้ชมสูงสุด","d":"จำนวน Live ต่อเดือน","ans":"B","exp":"Content Pillar = 3-5 หัวข้อหลักที่ตอบ Audience Pain Point → ผลิตได้ไม่รู้จบ","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-002","qg":"QG-07","phase":"Post","type":"MCQ","q":"LTV (Lifetime Value) ในบริบทโฮสต์คือ?","a":"อายุการทำงาน","b":"รายได้รวมที่ลูกค้า 1 คนสร้างให้ตลอดความสัมพันธ์","c":"จำนวน Live ทั้งหมด","d":"ยอด Follower รวม","ans":"B","exp":"LTV for Host = รายได้จากแบรนด์ที่จ้างซ้ำ × ระยะเวลาความสัมพันธ์","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-003","qg":"QG-07","phase":"Post","type":"MCQ","q":"ตลาด Global ที่มี Live Commerce เติบโตเร็วที่สุด (2025-2026) คือ?","a":"Europe","b":"US","c":"Southeast Asia + China","d":"Middle East","ans":"C","exp":"SEA + China = Live Commerce mainstream — US/EU ยังอยู่ช่วง Early Adopter","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-004","qg":"QG-07","phase":"Post","type":"MCQ","q":"Localization ≠ Translation หมายความว่า?","a":"ใช้ AI แปลภาษา","b":"ปรับเนื้อหาให้เหมาะกับวัฒนธรรมท้องถิ่น ไม่ใช่แค่แปลคำ","c":"ใช้ภาษาอังกฤษตลอด","d":"จ้าง Translator มืออาชีพ","ans":"B","exp":"Localization = เข้าใจ Culture/Pain Point ของแต่ละตลาด → ปรับ Script/Tone ให้ตรง","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-005","qg":"QG-07","phase":"Post","type":"MCQ","q":"IMC ย่อมาจาก?","a":"International Marketing Campaign","b":"Integrated Marketing Communications","c":"Internal Management Control","d":"Intelligent Media Content","ans":"B","exp":"IMC = ทุก Channel สื่อสาร Consistent Message — TikTok + LINE OA + IG + Threads","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-006","qg":"QG-07","phase":"Post","type":"True_False","q":"True/False: โฮสต์ที่ดีควรไลฟ์ทุกวันเพื่อสร้าง consistency","a":"TRUE","b":"FALSE","c":"","d":"","ans":"B","exp":"False — Smart Lazy Strategy แนะนำ ≤3 วัน/สัปดาห์ เน้น Quality ไม่ใช่ Quantity","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-007","qg":"QG-07","phase":"Post","type":"MCQ","q":"[คำนวณ] GMV 200,000 บ. Platform Fee 8% Affiliate 15% Ad 5% — Net Revenue คือ?","a":"114,000 บ.","b":"124,000 บ.","c":"144,000 บ.","d":"154,000 บ.","ans":"C","exp":"Net Revenue = 200,000 × (1-0.08-0.15-0.05) = 200,000 × 0.72 = 144,000 บ.","rec":"FRONTIER","lvl":"MASTER"},{"id":"QG07-POST-A-008","qg":"QG-07","phase":"Post","type":"MCQ","q":"Thought Leadership ในบริบทโฮสต์คือ?","a":"การเป็น KOL ที่มี Followers เยอะ","b":"การสร้างความน่าเชื่อถือในฐานะผู้รู้จริงด้านนั้น → แบรนด์หาแทนที่ไม่ได้","c":"การเขียนหนังสือ","d":"การพูด TED Talk","ans":"B","exp":"Thought Leader = ความรู้ + ประสบการณ์จริง + Content สม่ำเสมอ = Brand Authority","rec":"FRONTIER","lvl":"MASTER"}];

// ============================================================
// 🧮  SCORING ENGINE
// ============================================================

/**
 * Deterministic shuffle ด้วย Linear Congruential Generator
 * ให้แต่ละ lesson ได้ข้อสอบต่างกัน แม้จะอยู่ใน QG เดียวกัน
 */
function seededShuffle(arr, seed) {
  const result = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const j = h % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getQsByQG(qgs, phase, count) {
  let pool = QUIZ_BANK.filter(q => qgs.includes(q.qg) && q.phase === phase);
  return count ? pool.slice(0, count) : pool;
}

/**
 * ดึงข้อสอบ KC สำหรับแต่ละบท:
 * - ใช้ทุก phase (Pre + During + Post) เพื่อให้มีข้อเยอะพอ
 * - Shuffle ด้วย lesson.id เป็น seed → แต่ละบทได้ข้อต่างกัน
 *   แม้จะมี QG เดียวกัน (เช่น M01,M02,M03 ล้วนเป็น QG-01)
 */
function getLessonQuiz(lesson) {
  const pool = QUIZ_BANK.filter(q => q.qg === lesson.qg);
  if (!pool.length) return [];
  const shuffled = seededShuffle(pool, lesson.id);
  return shuffled.slice(0, Math.min(5, shuffled.length));
}

/**
 * ดึงข้อสอบวินิจฉัยรวม (บทสุดท้าย):
 * - ดึงจากทุก QG ของคอร์ส, ทุก phase
 * - Shuffle ด้วย courseId+"_diag" เป็น seed
 * - สูงสุด 15 ข้อ (ครอบคลุมทุกมิติ)
 */
function getDiagnosticQuiz(course) {
  const uniqueQGs = [...new Set(course.lessons.map(l => l.qg).filter(Boolean))];
  const pool = QUIZ_BANK.filter(q => uniqueQGs.includes(q.qg));
  const shuffled = seededShuffle(pool, course.id + "_diag");
  // กระจาย QG — เอาข้อแรกของแต่ละ QG ก่อน ให้ครอบคลุม
  const byQG = {};
  shuffled.forEach(q => { if (!byQG[q.qg]) byQG[q.qg] = []; byQG[q.qg].push(q); });
  const spread = [];
  const max = Math.ceil(15 / uniqueQGs.length);
  uniqueQGs.forEach(qg => spread.push(...(byQG[qg] || []).slice(0, max)));
  return spread.slice(0, 15);
}

function calcScore(answers, questions) {
  let correct = 0;
  questions.forEach(q => { if (answers[q.id] === q.ans) correct++; });
  const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return { correct, total: questions.length, pct };
}

function buildRadar(lessonScores) {
  // lessonScores: { [lessonId]: { qg, pct } }
  const qgScores = {};
  Object.values(lessonScores).forEach(({ qg, pct }) => {
    if (!qgScores[qg]) qgScores[qg] = [];
    qgScores[qg].push(pct);
  });
  return RADAR_DIMS.map(d => {
    const vals = d.qgs.flatMap(qg => qgScores[qg] || [0]);
    const avg = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    return { dim:d.key, label:d.label, value:avg };
  });
}

function getHostLevel(overall) {
  return HOST_LEVELS.find(l => overall >= l.min && overall < l.max) || HOST_LEVELS[HOST_LEVELS.length-1];
}

function getRecommendations(lessonScores, enrolledCourses = []) {
  const qgScores = {};
  Object.values(lessonScores).forEach(({ qg, pct }) => {
    if (!qgScores[qg] || pct < qgScores[qg]) qgScores[qg] = pct;
  });
  const recs = new Map();
  Object.entries(qgScores).forEach(([qg, pct]) => {
    if (pct >= CFG.upsellGuard) return;
    QUIZ_BANK.filter(q => q.qg === qg && q.rec).forEach(q => {
      q.rec.split(",").map(r=>r.trim()).filter(Boolean).forEach(c => {
        if (!enrolledCourses.includes(c)) {
          recs.set(c, Math.max(recs.get(c)||0, CFG.upsellGuard - pct));
        }
      });
    });
  });
  return [...recs.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c])=>c);
}

// ============================================================
// 🌐  API CLIENT
// ============================================================
async function api(params) {
  if (!CFG.useApi || APPS_SCRIPT_URL.startsWith("REPLACE")) return null;
  try {
    const url = new URL(APPS_SCRIPT_URL);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString(), { method:"GET", redirect:"follow" });
    return JSON.parse(await res.text());
  } catch(e) { console.error("[API]", e); return null; }
}

const apiGetStudent   = sid         => api({ action:"get_student", sid });
const apiGetEnroll    = sid         => api({ action:"get_enrollment", sid });
const apiSaveProgress = (sid,c,l,s) => api({ action:"save_progress", sid, course:c, lesson:l, status:s });
const apiSaveScore    = (sid,c,qt,qg,raw,total,pct,passed) =>
  api({ action:"save_score", sid, course:c, quiz_type:qt, qg:qg||"", raw, total, pct, passed });
const apiSaveWatch    = (sid,c,l,secs,count) =>
  api({ action:"save_progress", sid, course:c, lesson:l, status:"watching", watch_seconds:secs, watch_count:count });
const apiSaveSubmit   = (sid,c,rubric,sub_type,url) =>
  api({ action:"save_submission", sid, course:c, rubric_id:rubric||"", sub_type, url });
const apiUnlockSession= (sid,c,sr,code) =>
  api({ action:"unlock_session", sid, course:c, session_ref:sr, code });

// ============================================================
// 🎨  STYLES — Mono-tone
// ============================================================
const S = {
  page:    { minHeight:"100vh", background:"#F8F8F8", fontFamily:"'Sarabun', Arial, sans-serif", color:"#111",
             userSelect:"none", WebkitUserSelect:"none", MozUserSelect:"none" },
  wrap:    { maxWidth:820, margin:"0 auto", padding:"0 16px 60px" },
  card:    { background:"#fff", border:"1px solid #E0E0E0", borderRadius:3, padding:"20px 24px", marginBottom:10 },
  cardSm:  { background:"#fff", border:"1px solid #E0E0E0", borderRadius:3, padding:"14px 18px", marginBottom:8 },
  hdr:     { background:"#111", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  h1:      { fontSize:20, fontWeight:700, color:"#111", margin:"0 0 4px" },
  h2:      { fontSize:16, fontWeight:700, color:"#111", margin:"0 0 8px" },
  h3:      { fontSize:13, fontWeight:700, color:"#111", margin:"0 0 4px" },
  body:    { fontSize:14, color:"#333", lineHeight:1.6 },
  muted:   { fontSize:12, color:"#888" },
  btn:     { background:"#111", color:"#fff", border:"none", padding:"10px 20px", borderRadius:3, cursor:"pointer", fontSize:14, fontWeight:600 },
  btnSm:   { background:"#111", color:"#fff", border:"none", padding:"7px 14px", borderRadius:3, cursor:"pointer", fontSize:13, fontWeight:600 },
  btnOut:  { background:"transparent", color:"#111", border:"1.5px solid #111", padding:"9px 18px", borderRadius:3, cursor:"pointer", fontSize:14, fontWeight:600 },
  badge:   { display:"inline-block", background:"#111", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:2, letterSpacing:1 },
  badgeO:  { display:"inline-block", background:"transparent", color:"#777", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:2, border:"1px solid #CCC", letterSpacing:1 },
  pass:    { color:"#1A6B3A", fontWeight:700 },
  fail:    { color:"#C0392B", fontWeight:700 },
  barBg:   { background:"#E5E5E5", borderRadius:99, height:5, flex:1 },
  barFill: pct => ({ height:5, borderRadius:99, width:`${pct}%`, background: pct>=70?"#1A6B3A":"#111", transition:"width .4s" }),
  input:   { width:"100%", border:"1.5px solid #CCC", borderRadius:3, padding:"10px 14px", fontSize:16, outline:"none", boxSizing:"border-box" },
  divider: { border:"none", borderTop:"1px solid #E5E5E5", margin:"14px 0" },
  choiceBase: { borderRadius:3, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" },
};

function choiceStyle(sel, correct, show, letter) {
  if (!show) return { ...S.choiceBase, border: sel===letter?"2px solid #111":"1.5px solid #DDD", background:sel===letter?"#F0F0F0":"#fff" };
  if (letter===correct) return { ...S.choiceBase, border:"2px solid #1A6B3A", background:"#F0FAF4" };
  if (sel===letter) return { ...S.choiceBase, border:"2px solid #C0392B", background:"#FDF0F0" };
  return { ...S.choiceBase, border:"1.5px solid #DDD", background:"#fff", opacity:.6 };
}

// ============================================================
// 🧩  COMPONENTS
// ============================================================

function Header({ student, onLogout }) {
  return (
    <div style={S.hdr}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <img src={IMG.favicon} alt="Creatr365 Logo" style={{ width:32, height:32 }} />
        <span style={{ color:"#666", fontSize:11, fontWeight:700, letterSpacing:1 }}>LMS</span>
      </div>
      {student && (
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:13, color:"#CCC" }}>{student.name}</span>
          <span style={{ fontSize:11, color:"#888", background:"#222", padding:"2px 8px", borderRadius:2 }}>{student.id}</span>
          <button onClick={onLogout} style={{ ...S.btnSm, background:"transparent", border:"1px solid #444", padding:"4px 10px", fontSize:11 }}>ออก</button>
        </div>
      )}
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [kid, setKid] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handle() {
    const id = kid.trim().toUpperCase();
    if (!id.match(/^STU-\d{3,6}$/i)) {
      setErr("รูปแบบ Key ID ไม่ถูกต้อง — ตัวอย่าง: STU-001");
      return;
    }
    setLoading(true); setErr("");

    let displayName = "นักเรียน";
    let courses = [];

    // 1. ดึง enrollment จาก Supabase (primary)
    if (SUPABASE_ENROLL_URL) {
      try {
        const res = await fetch(SUPABASE_ENROLL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
          body: JSON.stringify({ student_id: id }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.courses?.length) courses = data.courses;
          if (data.display_name) displayName = data.display_name;
        }
      } catch(_) { /* fallback to Apps Script */ }
    }

    // 2. Fallback: Google Apps Script (ถ้า Supabase ไม่มีข้อมูล)
    if (!courses.length) {
      const gsData = await apiGetStudent(id);
      const gsEnroll = await apiGetEnroll(id);
      if (gsEnroll?.courses?.length) courses = gsEnroll.courses;
      if (gsData?.display_name) displayName = gsData.display_name;
    }

    // 3. ยังไม่มีคอร์ส → แจ้ง ไม่ให้เข้า
    if (!courses.length) {
      setErr("ยังไม่มีคอร์สที่ลงทะเบียน — กรุณาติดต่อทีมงาน Creatr365 ผ่าน LINE OA");
      setLoading(false);
      return;
    }

    onLogin({ id, name: displayName }, courses);
    setLoading(false);
  }

  return (
    <div style={{ ...S.wrap, maxWidth:440, paddingTop:60 }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <img src={IMG.center} alt="Creatr365" style={{ width:120, marginBottom:16 }} />
        <div style={{ color:"#888", fontSize:13 }}>Learning & Assessment System</div>
      </div>
      <div style={S.card}>
        <div style={S.h2}>เข้าสู่ระบบ</div>
        <div style={{ ...S.muted, marginBottom:14 }}>ใช้ Key ID ที่ได้รับทาง LINE OA</div>
        <input style={S.input} placeholder="STU-001"
          value={kid} onChange={e=>setKid(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==="Enter"&&handle()} />
        {err && <div style={{ color:"#C0392B", fontSize:13, marginTop:8 }}>{err}</div>}
        <button onClick={handle} disabled={loading} style={{ ...S.btn, width:"100%", marginTop:14 }}>
          {loading?"กำลังโหลด...":"เข้าสู่ระบบ"}
        </button>
      </div>
      <div style={{ ...S.muted, textAlign:"center", marginTop:14 }}>ยังไม่มี Key ID? ติดต่อทีม Creatr365 ผ่าน LINE OA</div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────
function Dashboard({ student, enrolledCourses, courseProgress, onSelect }) {
  // Show only purchased courses, sorted by level (COURSE_ORDER)
  const allCourses = COURSE_ORDER
    .filter(id => enrolledCourses.includes(id))
    .map(id => COURSES[id])
    .filter(Boolean);

  return (
    <div style={S.wrap}>
      <div style={{ padding:"22px 0 14px" }}>
        <div style={S.h1}>สวัสดี, {student.name}</div>
        <div style={S.muted}>คอร์สของฉัน · {allCourses.length} คอร์ส</div>
      </div>

      {allCourses.length === 0 && (
        <div style={{ ...S.card, textAlign:"center", color:"#888", padding:"36px 20px" }}>
          ยังไม่มีคอร์สที่ลงทะเบียน<br/>
          <span style={{ fontSize:12 }}>กรุณาติดต่อทีม Creatr365 ผ่าน LINE OA</span>
        </div>
      )}

      {allCourses.map(course => {
        const prog = courseProgress[course.id] || {};
        const done = prog.lessonsCompleted || 0;
        const total = course.lessons.length;
        const pct = total ? Math.round(done/total*100) : 0;

        return (
          <div key={course.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:15 }}>{course.name}</span>
                  <span style={S.badge}>{course.badge}</span>
                  <span style={S.badgeO}>{course.type==="onsite"?"ONSITE":"ONLINE"}</span>
                </div>
                <div style={{ ...S.muted, marginBottom:8 }}>{course.duration} · {course.desc}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={S.barBg}><div style={S.barFill(pct)} /></div>
                  <span style={{ ...S.muted, whiteSpace:"nowrap" }}>{done}/{total} บท</span>
                </div>
              </div>
              <div style={{ marginLeft:14 }}>
                <button onClick={()=>onSelect(course.id)} style={S.btnSm}>เข้าเรียน</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Course View ───────────────────────────────────────────────
function CourseView({ courseId, student, allLessonStatus, allLessonScores, onBack, onPretest, onLesson, onSessionUnlock, onViewResults, onWatch }) {
  const course = COURSES[courseId];
  const lessonStatus = allLessonStatus[courseId] || {};
  const lessonScores = allLessonScores[courseId] || {};
  const [playingVideo, setPlayingVideo] = useState(null);
  const isOnsite = course.type === "onsite";
  const pretestDone = lessonStatus["__pretest__"] === "done";
  const allDone = course.lessons.every(l => lessonStatus[l.id] === "done");

  return (
    <div style={S.wrap}>
      <div style={{ padding:"18px 0 4px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ ...S.btnOut, padding:"5px 12px", fontSize:12 }}>← กลับ</button>
        <div>
          <span style={{ fontWeight:700, fontSize:17 }}>{course.name}</span>
          <span style={{ ...S.muted, marginLeft:10 }}>{course.duration}</span>
        </div>
      </div>
      <div style={{ ...S.muted, marginBottom:18 }}>{course.desc}</div>

      {/* Pre-test */}
      {course.pretestCount > 0 && (
        <div style={{ ...S.cardSm, borderLeft:`3px solid ${pretestDone?"#1A6B3A":"#111"}`, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={S.h3}>Pre-test ({course.pretestCount} ข้อ)</div>
              <div style={S.muted}>วัด Baseline — ทำเสร็จ = ผ่าน ปลดล็อคบทแรก</div>
            </div>
            {pretestDone
              ? <span style={{ ...S.pass, fontSize:13 }}>✓ ทำแล้ว</span>
              : <button onClick={onPretest} style={S.btnSm}>เริ่ม Pre-test</button>
            }
          </div>
        </div>
      )}

      {isOnsite && (
        <div style={{ ...S.cardSm, background:"#F8F8F8", borderLeft:"3px solid #111", marginBottom:14 }}>
          <span style={{ fontSize:13, color:"#555" }}>
            🏫 Onsite — Knowledge Check ทำบนมือถือในห้อง ใช้รหัสที่ Trainer แจ้ง
          </span>
        </div>
      )}

      <div style={{ ...S.h2, marginBottom:10 }}>บทเรียน ({course.lessons.length} บท)</div>

      {course.lessons.map((lesson, i) => {
        const status = lessonStatus[lesson.id] || "locked";
        const isLast = i === course.lessons.length - 1; // บทสุดท้าย = แบบประเมินวินิจฉัย
        const prevDone = i === 0
          ? (pretestDone || course.pretestCount === 0)
          : lessonStatus[course.lessons[i-1].id] === "done";
        const canStart = prevDone && status !== "done";
        const isDone   = status === "done";
        const isLocked = !prevDone && !isDone;

        return (
          <div key={lesson.id} style={{
            ...S.cardSm,
            display:"flex", alignItems:"center", gap:12,
            opacity: isLocked ? 0.45 : 1,
            borderLeft: isLast && !isDone && prevDone ? "3px solid #1A6B3A" : undefined,
          }}>
            {/* หมายเลขบท / เครื่องหมายผ่าน */}
            <div style={{ width:28, height:28, borderRadius:99,
              background: isDone ? "#1A6B3A" : isLast && prevDone ? "#E8F5EE" : "#E5E5E5",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, fontSize:12, fontWeight:700,
              color: isDone ? "#fff" : isLast && prevDone ? "#1A6B3A" : "#999" }}>
              {isDone ? "✓" : isLast ? "★" : i+1}
            </div>

            {/* ชื่อบท */}
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14, color: isLast && !isDone ? "#1A6B3A" : "#111" }}>
                {lesson.name}
                {isLast && <span style={{ ...S.badge, marginLeft:8, background:"#1A6B3A", fontSize:9 }}>DIAGNOSTIC</span>}
              </div>
              <div style={S.muted}>{lesson.dur}{lesson.qg ? ` · ${lesson.qg}` : ""}</div>
            </div>

            {/* ปุ่มต่างๆ */}
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              {/* ปุ่มดูคลิป — เฉพาะ online ที่มี URL และ prevDone แล้ว */}
              {!isOnsite && lesson.url && !lesson.url.startsWith("REPLACE") && prevDone && (
                <button
                  onClick={() => { setPlayingVideo(lesson); onWatch(lesson.id, lesson.qg); }}
                  style={S.btnSm}>
                  ▶ คลิป
                </button>
              )}

              {/* ไอคอนล็อค — แสดงเฉพาะเมื่อบทยังล็อคอยู่จริงๆ */}
              {isLocked && (
                <span style={{ ...S.muted, fontSize:11 }}>🔒 ล็อค</span>
              )}

              {/* Onsite: กรอกรหัส */}
              {isOnsite && canStart && (
                <button onClick={()=>onSessionUnlock(lesson)} style={S.btnSm}>
                  กรอกรหัส
                </button>
              )}

              {/* Online: ปุ่มทำแบบทดสอบ / แบบประเมินวินิจฉัย */}
              {!isOnsite && canStart && (
                <button
                  onClick={()=>onLesson(lesson)}
                  style={{ ...S.btnSm, background: isLast ? "#1A6B3A" : "#111", color:"#fff" }}>
                  {isLast ? "ทำแบบประเมินวินิจฉัย" : "ทำแบบทดสอบ"}
                </button>
              )}

              {/* ผ่านแล้ว */}
              {isDone && (
                <span style={{ ...S.pass, fontSize:12, whiteSpace:"nowrap" }}>
                  {isLast ? "★ วินิจฉัยแล้ว" : "✓ ผ่าน"}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Submission (optional) */}
      {course.submission?.enabled && (
        <>
          <hr style={S.divider} />
          <SubmissionCard courseId={courseId} sub={course.submission} student={student} />
        </>
      )}

      {/* View Results button */}
      {allDone && (
        <>
          <hr style={S.divider} />
          <div style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={S.h3}>ดูผลลัพธ์คอร์ส</div>
              <div style={S.muted}>Radar 5 มิติ + Host Level + แนะนำคอร์สถัดไป</div>
            </div>
            <button onClick={onViewResults} style={S.btn}>ดูผลลัพธ์ →</button>
          </div>
        </>
      )}

      {/* Video Modal */}
      {playingVideo && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,.85)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, padding:20 }}>
          <div style={{ width:"100%", maxWidth:800, position:"relative" }}>
            <button onClick={() => setPlayingVideo(null)}
              style={{ position:"absolute", top:-40, right:0, background:"none", border:"none", color:"#fff", fontSize:30, cursor:"pointer" }}>
              ×
            </button>
            <div style={{ position:"relative", paddingBottom:"56.25%", height:0, overflow:"hidden", background:"#000" }}>
              <iframe
                src={playingVideo.url}
                style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div style={{ background:"#fff", padding:"16px 20px", borderRadius:"0 0 4px 4px" }}>
              <div style={S.h2}>{playingVideo.name}</div>
              <div style={S.muted}>{playingVideo.dur}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Submission Card ───────────────────────────────────────────
function SubmissionCard({ courseId, sub, student }) {
  const [url, setUrl] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!url.trim()) return;
    await apiSaveSubmit(student.id, courseId, sub.rubric, "submission", url.trim());
    setSent(true);
  }

  return (
    <div style={{ ...S.cardSm, borderLeft:"3px solid #888" }}>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{sub.label}</div>
      {sub.rubric && <div style={S.muted}>Rubric: {sub.rubric}</div>}
      {!sent ? (
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <input style={{ ...S.input, fontSize:13, padding:"7px 12px" }}
            placeholder="วาง URL ลิงก์งานที่นี่"
            value={url} onChange={e=>setUrl(e.target.value)} />
          <button onClick={submit} style={{ ...S.btnSm, whiteSpace:"nowrap" }}>ส่งงาน</button>
        </div>
      ) : <div style={{ ...S.pass, marginTop:8, fontSize:13 }}>✓ ส่งแล้ว รอทีมตรวจ</div>}
    </div>
  );
}

// ── Session Unlock (Onsite) ───────────────────────────────────
function SessionUnlock({ lesson, courseId, student, onUnlocked, onBack }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);



  async function handle() {
    if (code.length !== 4) { setErr("กรอกรหัส 4 หลัก"); return; }
    setLoading(true); setErr("");
    const res = await apiUnlockSession(student.id, courseId, lesson.id, code);
    if (res?.success || !CFG.useApi || APPS_SCRIPT_URL.startsWith("REPLACE")) {
      onUnlocked(lesson);
    } else {
      setErr("รหัสไม่ถูกต้อง — ถามอาจารย์อีกครั้ง");
    }
    setLoading(false);
  }

  return (
    <div style={{ ...S.wrap, maxWidth:440, paddingTop:60 }}>
      <button onClick={onBack} style={{ ...S.btnOut, padding:"5px 12px", fontSize:12, marginBottom:24 }}>← กลับ</button>
      <div style={S.card}>
        <div style={S.h2}>{lesson.name}</div>
        <div style={{ ...S.muted, marginBottom:18 }}>{lesson.dur}</div>
        <div style={{ ...S.body, marginBottom:14 }}>กรอกรหัส 4 หลักที่อาจารย์แจ้งในห้องเรียน</div>
        <input style={{ ...S.input, fontSize:22, textAlign:"center", letterSpacing:8, fontWeight:700 }}
          maxLength={4} placeholder="0000" value={code}
          onChange={e=>setCode(e.target.value.replace(/\D/g,""))}
          onKeyDown={e=>e.key==="Enter"&&handle()} />
        {err && <div style={{ color:"#C0392B", fontSize:13, marginTop:8 }}>{err}</div>}
        <button onClick={handle} disabled={loading} style={{ ...S.btn, width:"100%", marginTop:14 }}>
          {loading?"กำลังตรวจสอบ...":"ยืนยันรหัส"}
        </button>
      </div>
    </div>
  );
}

// ── Quiz Engine ───────────────────────────────────────────────
function QuizEngine({ questions, title, threshold, courseId, quizType, qg, student, onDone }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExp, setShowExp] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);

  const q = questions[idx];
  const letters = q ? ["A","B","C","D"].filter(l => q[l.toLowerCase()]) : [];
  const sel = answers[q?.id];
  const isLast = idx === questions.length - 1;
  const isFirst = idx === 0;

  function select(letter) {
    if (showExp) return;
    setAnswers(prev => ({ ...prev, [q.id]: letter }));
  }

  function prev() {
    if (isFirst) return;
    setShowExp(false);
    setIdx(i => i - 1);
  }

  function next() {
    setShowExp(false);
    if (isLast) {
      const sc = calcScore(answers, questions);
      setResult(sc);
      setDone(true);
      const passed = threshold === 0 || sc.pct >= threshold;
      if (courseId) apiSaveScore(student.id, courseId, quizType, qg||"", sc.correct, sc.total, sc.pct, passed);
    } else {
      setIdx(i => i+1);
    }
  }

  if (!q || !questions.length) {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.h2}>ไม่พบข้อสอบ</div>
          <button onClick={() => onDone(null)} style={{ ...S.btn, marginTop:14 }}>กลับ</button>
        </div>
      </div>
    );
  }

  if (done && result) {
    const passed = threshold === 0 || result.pct >= threshold;
    return (
      <div style={{ ...S.wrap, maxWidth:560, paddingTop:40 }}>
        <div style={S.card}>
          <div style={{ textAlign:"center", padding:"14px 0" }}>
            <div style={{ fontSize:40, marginBottom:8 }}>{passed?"✓":"✗"}</div>
            <div style={{ fontSize:28, fontWeight:700, color:passed?"#1A6B3A":"#C0392B" }}>{result.pct}%</div>
            {threshold > 0 && (
              <div style={{ color:passed?"#1A6B3A":"#C0392B", marginBottom:4, fontSize:14 }}>
                {passed?"ผ่าน":"ยังไม่ผ่าน"} — เกณฑ์ {threshold}%
              </div>
            )}
            <div style={S.muted}>{result.correct} จาก {result.total} ข้อ</div>
            {threshold === 0 && <div style={{ ...S.muted, marginTop:6 }}>บันทึก Baseline เรียบร้อย</div>}
          </div>
          <hr style={S.divider} />
          <div style={{ fontWeight:600, fontSize:13, marginBottom:8 }}>ทบทวนคำตอบ</div>
          {questions.map((qq, i) => {
            const isC = answers[qq.id] === qq.ans;
            return (
              <div key={qq.id} style={{ ...S.cardSm, borderLeft:`3px solid ${isC?"#1A6B3A":"#C0392B"}`, marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{i+1}. {qq.q}</div>
                <div style={{ fontSize:12, color:isC?"#1A6B3A":"#C0392B", marginTop:3 }}>
                  {isC ? "✓ ถูก" : `✗ คำตอบ: ${answers[qq.id]||"ไม่ได้ตอบ"} | เฉลย: ${qq.ans}`}
                </div>
                <div style={{ ...S.muted, marginTop:3, fontSize:12 }}>{qq.exp}</div>
              </div>
            );
          })}
          <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
            {!passed && threshold > 0 && (
              <>
                <button onClick={()=>{setIdx(0);setAnswers({});setDone(false);setResult(null);setShowExp(false);}}
                  style={{ ...S.btnOut, flex:1 }}>ทำใหม่ (Retake)</button>
                <button onClick={()=>onDone(result)} style={{ ...S.btn, flex:1, background:"#888" }}>
                  จบการทดสอบ (ไม่สอบซ่อม)
                </button>
              </>
            )}
            {(passed || threshold===0) && (
              <button onClick={()=>onDone(result)} style={{ ...S.btn, width:"100%" }}>
                ดำเนินการต่อ →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.wrap, maxWidth:620, paddingTop:28 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <div style={S.muted}>{idx+1}/{questions.length}</div>
        <div style={S.barBg}><div style={{ ...S.barFill(Math.round(idx/questions.length*100)), background:"#111" }} /></div>
        <div style={{ ...S.muted, whiteSpace:"nowrap" }}>{title}</div>
      </div>
      <div style={S.card}>
        <div style={{ ...S.muted, marginBottom:8 }}>{q.qg}</div>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:18, lineHeight:1.5 }}>{q.q}</div>
        {letters.map(letter => (
          <div key={letter} style={choiceStyle(sel, q.ans, showExp, letter)} onClick={()=>select(letter)}>
            <span style={{ width:22, height:22, borderRadius:99, border:"1.5px solid #CCC",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0,
              background: showExp&&letter===q.ans?"#1A6B3A": showExp&&sel===letter&&letter!==q.ans?"#C0392B":"transparent",
              color: showExp&&(letter===q.ans||sel===letter)?"#fff":"#555",
              borderColor: showExp&&letter===q.ans?"#1A6B3A": showExp&&sel===letter&&letter!==q.ans?"#C0392B":"#CCC",
            }}>{letter}</span>
            <span style={{ fontSize:14 }}>{q[letter.toLowerCase()]}</span>
          </div>
        ))}
        {showExp && (
          <div style={{ background:"#F8F8F8", border:"1px solid #E5E5E5", borderRadius:3, padding:"12px 14px", marginTop:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", marginBottom:3 }}>อธิบาย</div>
            <div style={{ fontSize:13, color:"#333", lineHeight:1.6 }}>{q.exp}</div>
          </div>
        )}
        <div style={{ display:"flex", gap:10, marginTop:18 }}>
          {/* ปุ่ม Back — ย้อนกลับข้อก่อน */}
          {!isFirst && (
            <button onClick={prev} style={{ ...S.btnOut, padding:"9px 16px" }}>
              ← ย้อนกลับ
            </button>
          )}

          {/* ปุ่มดูเฉลย — แสดงเมื่อมีการเลือกคำตอบแล้ว */}
          {sel && !showExp && (
            <button onClick={() => setShowExp(true)} style={S.btnOut}>
              ดูเฉลย
            </button>
          )}

          {(showExp || sel) && (
            <button onClick={next} disabled={!sel} style={{ ...S.btn, flex: 1 }}>
              {isLast ? "ดูผลลัพธ์ →" : "ข้อถัดไป →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Course Results (Radar + Host Level + Recommendations) ─────
function CourseResults({ courseId, student, lessonScores, enrolledCourses, onBack, onSelectCourse }) {
  const radar = useMemo(() => buildRadar(lessonScores), [lessonScores]);
  const overall = useMemo(() => Math.round(radar.reduce((a,b)=>a+b.value,0)/radar.length), [radar]);
  const level = getHostLevel(overall);

  // คอร์สถัดไปที่ซื้อแล้ว (ตาม COURSE_ORDER)
  const nextEnrolledCourse = useMemo(() => {
    const idx = COURSE_ORDER.indexOf(courseId);
    for (let i = idx + 1; i < COURSE_ORDER.length; i++) {
      if (enrolledCourses.includes(COURSE_ORDER[i])) return COURSE_ORDER[i];
    }
    return null;
  }, [courseId, enrolledCourses]);

  // คอร์สแนะนำที่ยังไม่ได้ซื้อ (upsell)
  const upsellRecs = useMemo(() => getRecommendations(lessonScores, enrolledCourses), [lessonScores, enrolledCourses]);

  return (
    <div style={{ ...S.wrap, maxWidth:640, paddingTop:28 }}>
      <button onClick={onBack} style={{ ...S.btnOut, padding:"5px 12px", fontSize:12, marginBottom:20 }}>← กลับ</button>
      <div style={S.card}>
        <div style={{ marginBottom:16 }}>
          <div style={S.h1}>ผลลัพธ์คอร์ส</div>
          <div style={S.muted}>{COURSES[courseId]?.name} · คะแนนรวม {overall}% · {level.label}</div>
        </div>

        <div style={{ ...S.cardSm, background:"#F8F8F8", marginBottom:16 }}>
          <div style={{ fontWeight:600, fontSize:14 }}>{level.label}</div>
          <div style={{ fontSize:13, color:"#555", marginTop:2 }}>{level.badge} Level</div>
        </div>

        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radar}>
            <PolarGrid stroke="#E5E5E5" />
            <PolarAngleAxis dataKey="label" tick={{ fontSize:12, fill:"#555" }} />
            <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#111" fill="#111" fillOpacity={0.12} strokeWidth={2} />
            <Tooltip formatter={v=>`${v}%`} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Score per dim */}
        <div style={{ marginBottom:18 }}>
          {radar.map(d => (
            <div key={d.dim} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7 }}>
              <div style={{ width:90, fontSize:12, color:"#555", flexShrink:0 }}>{d.label}</div>
              <div style={S.barBg}><div style={S.barFill(d.value)} /></div>
              <div style={{ width:34, fontSize:12, color:"#555", textAlign:"right" }}>{d.value}%</div>
            </div>
          ))}
        </div>

        {/* Lesson summary */}
        <hr style={S.divider} />
        <div style={{ fontWeight:600, fontSize:13, marginBottom:8 }}>Summary รายบท</div>
        {Object.entries(lessonScores).map(([lid, { pct, qg }]) => (
          <div key={lid} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:60, fontSize:12, color:"#555" }}>{lid}</div>
            <div style={{ width:40, fontSize:11, color:"#888" }}>{qg}</div>
            <div style={S.barBg}><div style={S.barFill(pct)} /></div>
            <div style={{ width:34, fontSize:12, color: pct>=70?"#1A6B3A":"#C0392B", textAlign:"right", fontWeight:600 }}>{pct}%</div>
          </div>
        ))}

        {/* ────── คอร์สถัดไปที่ซื้อแล้ว ────── */}
        {nextEnrolledCourse && (() => {
          const nc = COURSES[nextEnrolledCourse];
          return (
            <>
              <hr style={S.divider} />
              <div style={{ fontWeight:700, fontSize:14, marginBottom:10, color:"#1A6B3A" }}>
                🎉 พร้อมเรียนคอร์สถัดไปแล้ว!
              </div>
              <div style={{ ...S.card, borderLeft:"4px solid #1A6B3A", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>{nc.name}</span>
                    <span style={S.badge}>{nc.badge}</span>
                    <span style={S.badgeO}>{nc.type === "onsite" ? "ONSITE" : "ONLINE"}</span>
                  </div>
                  <div style={{ ...S.muted, marginBottom:4 }}>{nc.duration} · {nc.desc}</div>
                  <div style={{ fontSize:12, color:"#1A6B3A" }}>✓ คอร์สนี้คุณซื้อแล้ว — พร้อมเริ่มได้เลย</div>
                </div>
                <button
                  onClick={() => onSelectCourse(nextEnrolledCourse)}
                  style={{ ...S.btn, background:"#1A6B3A", whiteSpace:"nowrap", marginLeft:16 }}>
                  ไปเรียนเลย →
                </button>
              </div>
            </>
          );
        })()}

        {/* ────── คอร์สแนะนำที่ยังไม่ได้ซื้อ (upsell) ────── */}
        {upsellRecs.length > 0 && (
          <>
            <hr style={S.divider} />
            <div style={{ fontWeight:600, fontSize:13, marginBottom:8 }}>
              {nextEnrolledCourse ? "คอร์สอื่นที่แนะนำ" : "แนะนำคอร์สถัดไป (สูงสุด 3 คอร์ส)"}
            </div>
            {upsellRecs.map(cId => {
              const c = Object.values(COURSES).find(x => x.name === cId || x.id === cId.replace(/ /g,"_"));
              return (
                <div key={cId} style={{ ...S.cardSm, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <span style={{ fontWeight:700, fontSize:14 }}>{cId}</span>
                    {c && <span style={{ ...S.muted, marginLeft:8 }}>{c.duration}</span>}
                    {c && <div style={{ ...S.muted, fontSize:11, marginTop:2 }}>{c.desc}</div>}
                  </div>
                  <span style={S.badgeO}>{c?.badge || ""}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 🚀  MAIN APP
// ============================================================
export default function Creatr365LMS() {
  const [screen, setScreen] = useState("login");
  const [student, setStudent] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});     // { courseId: { lessonsCompleted } }
  const [activeCourse, setActiveCourse] = useState(null);
  const [lessonStatus, setLessonStatus] = useState({});         // { [courseId]: { [lessonId|__pretest__]: "done" } }
  const [lessonScores, setLessonScores] = useState({});         // { [courseId]: { [lessonId]: { qg, pct } } }
  const [watchData, setWatchData] = useState({});               // { lessonId: { count, seconds } }
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizCtx, setQuizCtx] = useState(null);
  const [alert, setAlert] = useState(null);                     // watch-count alert

  // Prevent right-click & copy globally
  useEffect(() => {
    // โหลด Sarabun font
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap";
    document.head.appendChild(link);

    const noCtx = e => e.preventDefault();
    document.addEventListener("contextmenu", noCtx);
    return () => {
      document.removeEventListener("contextmenu", noCtx);
    };
  }, []);

  function handleLogin(s, courses) {
    setStudent(s);
    setEnrolledCourses(courses);
    setScreen("dashboard");
  }

  function handleLogout() {
    setStudent(null); setEnrolledCourses([]); setCourseProgress({});
    setActiveCourse(null); setLessonStatus({}); setLessonScores({});
    setScreen("login");
  }

  function selectCourse(cId) {
    setActiveCourse(cId);
    setScreen("course");
  }


  // Pre-test
  function startPretest() {
    const course = COURSES[activeCourse];
    // สำคัญ: ต้องเซ็ต activeLesson ให้เป็น __pretest__ เพื่อให้ finishLessonQuiz รู้ว่าทำอะไรเสร็จ
    setActiveLesson({ id: "__pretest__", qg: "pretest" });
    const qs = getQsByQG(course.pretestQGs, "Pre", course.pretestCount);
    setQuizCtx({ questions:qs, title:"Pre-test", threshold:0, quizType:"pretest", qg:course.pretestQGs.join(",") });
    setScreen("quiz");
  }

  // KC quiz after lesson video
  function startLessonQuiz(lesson) {
    const course = COURSES[activeCourse];
    const isLast = course.lessons[course.lessons.length-1].id === lesson.id;
    
    let qs = [];
    if (isLast) {
      // Diagnostic: ดึงจากทุก QG ของคอร์ส, กระจายสมดุล, สูงสุด 15 ข้อ
      qs = getDiagnosticQuiz(course);
    } else {
      // KC Quiz: ใช้ seededShuffle ตาม lesson.id → ข้อต่างกันทุกบท
      qs = getLessonQuiz(lesson);
    }

    if (!qs.length) { markLessonDone(lesson, 100); setScreen("course"); return; }
    setActiveLesson(lesson);
    setQuizCtx({ 
      questions: qs, 
      title: isLast ? "แบบประเมินวินิจฉัย (Post-test)" : `KC: ${lesson.name}`, 
      threshold: CFG.passThreshold, 
      quizType: isLast ? "diagnostic" : "knowledge_check", 
      qg: lesson.qg,
    });
    setScreen("quiz");
  }

  function markLessonDone(lesson, pct) {
    setLessonStatus(prev => {
      const courseLidStatus = prev[activeCourse] || {};
      return { ...prev, [activeCourse]: { ...courseLidStatus, [lesson.id]: "done" } };
    });
    setLessonScores(prev => {
      const courseLidScores = prev[activeCourse] || {};
      return { ...prev, [activeCourse]: { ...courseLidScores, [lesson.id]: { qg: lesson.qg, pct } } };
    });

    // Update course progress count
    setCourseProgress(prev => {
      const course = COURSES[activeCourse];
      if (!course) return prev;
      // We calculate from current state plus the new done lesson
      const currentDone = lessonStatus[activeCourse] || {};
      const doneCount = course.lessons.filter(l => currentDone[l.id] === "done" || l.id === lesson.id).length;
      return { ...prev, [activeCourse]: { ...prev[activeCourse], lessonsCompleted: doneCount } };
    });

    apiSaveProgress(student?.id, activeCourse, lesson.id, "done");
  }

  function handleQuizDone(result) {
    if (!result) { setScreen(activeCourse ? "course" : "dashboard"); return; }

    if (quizCtx.quizType === "pretest") {
      setLessonStatus(prev => {
        const cur = prev[activeCourse] || {};
        return { ...prev, [activeCourse]: { ...cur, "__pretest__": "done" } };
      });
      apiSaveScore(student?.id, activeCourse, "pretest", quizCtx.qg, result.correct, result.total, result.pct, true);
      apiSaveProgress(student?.id, activeCourse, "__pretest__", "done");
      setScreen("course");
      return;
    }

    // Knowledge Check / Diagnostic
    markLessonDone(activeLesson, result.pct);
    apiSaveScore(student?.id, activeCourse, quizCtx.quizType, quizCtx.qg, result.correct, result.total, result.pct, result.pct >= CFG.passThreshold);
    setActiveLesson(null);
    setScreen("course");
  }

  // Session unlock (Onsite)
  function handleSessionUnlocked(lesson) {
    const qs = getLessonQuiz(lesson);
    if (!qs.length) { markLessonDone(lesson, 100); setScreen("course"); return; }
    setActiveLesson(lesson);
    setQuizCtx({ questions:qs, title:lesson.name, threshold:CFG.passThreshold, quizType:"knowledge_check", qg:lesson.qg });
    setScreen("quiz");
  }

  // Track video watch (called from LessonViewer or when user clicks "ดูคลิป")
  function recordWatch(lessonId, qg) {
    const newCount = (watchData[lessonId]?.count || 0) + 1;
    setWatchData(prev => {
      const cur = prev[lessonId] || { count:0, seconds:0 };
      const next = { count:cur.count+1, seconds:cur.seconds };
      apiSaveWatch(student?.id, activeCourse, lessonId, next.seconds, next.count);
      return { ...prev, [lessonId]:next };
    });
    if (newCount > CFG.maxWatchCount) {
      const lesson = COURSES[activeCourse]?.lessons.find(l => l.id === lessonId);
      if (lesson) setAlert(lesson);
    }
  }

  const activeCourseStatus = lessonStatus[activeCourse] || {};
  const allLessonsDone = activeCourse &&
    COURSES[activeCourse].lessons.every(l => activeCourseStatus[l.id]==="done");

  return (
    <div style={S.page} onCopy={e=>e.preventDefault()}>
      <Header student={screen!=="login"?student:null} onLogout={handleLogout} />

      {/* Watch-count alert popup */}
      {alert && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,.5)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
          <div style={{ ...S.card, maxWidth:400, margin:20 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>แจ้งเตือน</div>
            <div style={{ fontSize:14, color:"#333", lineHeight:1.6 }}>
              คุณเข้าดูบท <strong>"{alert.name}"</strong> เกิน {CFG.maxWatchCount} ครั้งแล้ว
            </div>
            <div style={{ fontSize:13, color:"#555", marginTop:10, lineHeight:1.6 }}>
              จากการวิเคราะห์ด้านการเรียนรู้ (Ebbinghaus Forgetting Curve) การดูซ้ำหลายครั้งโดยไม่ฝึกปฏิบัติ
              มักแสดงว่าเนื้อหาบางส่วนยังไม่ชัดเจน ทีมงานจะติดต่อเพื่อช่วยซ่อมเสริมตรงจุดที่ต้องการ
            </div>
            <button onClick={()=>setAlert(null)} style={{ ...S.btn, marginTop:16, width:"100%" }}>รับทราบ</button>
          </div>
        </div>
      )}

      {screen==="login" && <LoginScreen onLogin={handleLogin} />}

      {screen==="dashboard" && (
        <Dashboard
          student={student}
          enrolledCourses={enrolledCourses}
          courseProgress={courseProgress}
          onSelect={selectCourse}
        />
      )}

      {screen==="course" && activeCourse && (
        <CourseView
          courseId={activeCourse}
          student={student}
          allLessonStatus={lessonStatus}
          allLessonScores={lessonScores}
          onBack={()=>setScreen("dashboard")}
          onPretest={startPretest}
          onLesson={startLessonQuiz}
          onSessionUnlock={lesson=>{setActiveLesson(lesson);setScreen("session_unlock");}}
          onViewResults={()=>setScreen("results")}
          onWatch={recordWatch}
        />
      )}

      {screen==="session_unlock" && activeLesson && (
        <SessionUnlock
          lesson={activeLesson}
          courseId={activeCourse}
          student={student}
          onUnlocked={handleSessionUnlocked}
          onBack={()=>setScreen("course")}
        />
      )}

      {screen==="quiz" && quizCtx && (
        <QuizEngine
          {...quizCtx}
          student={student}
          courseId={activeCourse}
          onDone={handleQuizDone}
        />
      )}

      {screen==="results" && activeCourse && (
        <CourseResults
          courseId={activeCourse}
          student={student}
          lessonScores={lessonScores[activeCourse] || {}}
          enrolledCourses={enrolledCourses}
          onBack={()=>setScreen("course")}
          onSelectCourse={(cId) => { setActiveCourse(cId); setScreen("course"); }}
        />
      )}

      {/* Footer Concept Logo */}
      <div style={{ textAlign:"center", padding:"40px 0 60px", opacity:0.6 }}>
        <img src={IMG.concept} alt="Concept" style={{ width:180 }} />
      </div>
    </div>
  );
}
