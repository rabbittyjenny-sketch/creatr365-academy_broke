/**
 * PPACT — Creator Transformation System (Creatr365)
 * ==================================================
 * SINGLE SOURCE OF TRUTH for the "5 มิติ" language used anywhere in
 * Creatr365 products.
 *
 * Why this file exists
 * --------------------
 * Before this, three different "5 dimension" models were live at once:
 *   1. LMS Skill Radar   — hook / voice / psych / data / brand
 *   2. Pre-course test   — AC / TB / EI / DO / ST
 *   3. FAQ + course books— PPACT (Presence, Psychology, Authority,
 *                          Communication, Trust)
 * They did not agree, so a learner who took the free test and then bought a
 * course saw two unrelated sets of numbers, and the certificate language
 * ("PPACT stamp") matched neither.
 *
 * PPACT wins because it is the one already baked into the printed course
 * books (SIGNAL Module 0.2 "PPACT — แผนที่รวมของหลักสูตร", FOUNDATION,
 * ARCHITECT) and into the certificate copy. Changing code is cheap;
 * reprinting course material is not.
 *
 * The other two models are NOT deleted — they are kept as *evidence codes*
 * and mapped onto PPACT here, so historical scores stay interpretable.
 */

export type PpactKey = 'presence' | 'psychology' | 'authority' | 'communication' | 'trust';

export interface PpactDimension {
  key: PpactKey;
  /** The letter as shown in the PPACT acronym. */
  letter: string;
  /** English name (used on certificates and EPK-facing material). */
  en: string;
  /** Thai name shown to learners. */
  th: string;
  /** One-line plain-Thai definition for tooltips / result pages. */
  definition: string;
  /** Question groups in the LMS quiz bank that feed this dimension. */
  qgs: string[];
  /**
   * Whether a multiple-choice / SJT instrument can measure this dimension.
   * Presence is a *performance* dimension: you cannot measure whether
   * someone holds eye-line and controls their breath with a quiz. It is
   * assessed by rubric (RUB-02 Vocal Engine, RUB-08 Camera Presence,
   * RUB-05 Hook Factory Speak) instead. This mirrors ISO/IEC 17024, which
   * separates knowledge assessment from performance assessment.
   */
  knowledgeAssessable: boolean;
  /** Rubrics that supply the practical evidence for this dimension. */
  rubrics: string[];
}

export const PPACT: PpactDimension[] = [
  {
    key: 'presence',
    letter: 'P',
    en: 'Presence',
    th: 'การปรากฏตัวหน้ากล้อง',
    definition: 'พลังเสียง สายตา และการวางตัวหน้ากล้องที่ทำให้คนดูอยากอยู่ต่อ',
    qgs: ['QG-03'],
    knowledgeAssessable: true,
    rubrics: ['RUB-02', 'RUB-08', 'RUB-05'],
  },
  {
    key: 'psychology',
    letter: 'P',
    en: 'Psychology',
    th: 'จิตวิทยาการโน้มน้าว',
    definition: 'อ่านอารมณ์ห้อง เข้าใจกลไกการตัดสินใจ และออกแบบบทพูดให้ตรงใจ',
    qgs: ['QG-04'],
    knowledgeAssessable: true,
    rubrics: ['RUB-09'],
  },
  {
    key: 'authority',
    letter: 'A',
    en: 'Authority',
    th: 'ความน่าเชื่อถือจากข้อมูลและระบบธุรกิจ',
    definition: 'ตัดสินใจจากตัวเลขจริง อ่าน KPI ได้ และวางโครงสร้างธุรกิจให้ทำซ้ำได้',
    qgs: ['QG-05', 'QG-07'],
    knowledgeAssessable: true,
    rubrics: ['RUB-03', 'RUB-17'],
  },
  {
    key: 'communication',
    letter: 'C',
    en: 'Communication',
    th: 'การสื่อสารที่ตรึงคนดู',
    definition: 'Hook ใน 3 วินาทีแรก การเล่าเรื่อง และการสร้างความเร่งด่วนอย่างซื่อสัตย์',
    qgs: ['QG-01', 'QG-02'],
    knowledgeAssessable: true,
    rubrics: ['RUB-01', 'RUB-05', 'RUB-06', 'RUB-07'],
  },
  {
    key: 'trust',
    letter: 'T',
    en: 'Trust',
    th: 'ความไว้วางใจและจรรยาบรรณ',
    definition: 'ตัวตนที่สม่ำเสมอ จรรยาบรรณ และมาตรฐานที่ทำให้แบรนด์กล้าฝากงาน',
    // QG-08/09/10 added 2569-09-21: split out of QG-06 after a lesson-by-
    // lesson content audit found 7 lessons mislabeled "Brand/Production"
    // that were actually about ethics/legal rules or on-camera/business-role
    // identity — neither fits Trust's own definition any worse than QG-06
    // did (ethics and "consistent identity" are both named in it above).
    // See RADAR_DIMS in 6course-quiz/src/Creatr365_LMS_v2.jsx for the
    // per-QG breakdown (that file is the canonical QG list; keep in sync).
    qgs: ['QG-06', 'QG-08', 'QG-09', 'QG-10'],
    knowledgeAssessable: true,
    rubrics: ['RUB-11', 'RUB-14'],
  },
];

export const PPACT_BY_KEY: Record<PpactKey, PpactDimension> =
  Object.fromEntries(PPACT.map(d => [d.key, d])) as Record<PpactKey, PpactDimension>;

/** QG code -> PPACT key. Every QG-01..QG-07 maps to exactly one dimension. */
export const QG_TO_PPACT: Record<string, PpactKey> = PPACT.reduce((acc, d) => {
  d.qgs.forEach(qg => { acc[qg] = d.key; });
  return acc;
}, {} as Record<string, PpactKey>);

/**
 * Crosswalk from the pre-course diagnostic's behavioural codes to PPACT.
 *
 * DO (Data Orientation) and ST (Strategic Thinking) both roll up into
 * Authority — they are two facets of the same construct (evidence-based
 * decision making, short-horizon and long-horizon). Averaging them is the
 * standard way to combine facet scores into a composite.
 *
 * Presence has no entry on purpose: a situational-judgement test cannot
 * observe on-camera behaviour. The result page must show Presence as
 * "ยังไม่ได้ประเมิน — วัดในคอร์สด้วยเกณฑ์ภาคปฏิบัติ", never as 0%.
 */
export const SJT_TO_PPACT: Record<string, PpactKey> = {
  AC: 'communication',
  TB: 'trust',
  EI: 'psychology',
  DO: 'authority',
  ST: 'authority',
};

/** Legacy LMS radar keys -> PPACT, so old stored snapshots stay readable. */
export const LEGACY_RADAR_TO_PPACT: Record<string, PpactKey> = {
  hook: 'communication',
  voice: 'presence',
  psych: 'psychology',
  data: 'authority',
  brand: 'trust',
};

/**
 * Host Level bands. Unchanged numerically — only documented here so that the
 * web app and the LMS read the same table.
 * Source: Creatr365 rubric_master "Progression_Model" tab.
 */
export const HOST_LEVELS = [
  { min: 0,  max: 40,  th: 'เริ่มต้น',            badge: 'STARTER'    },
  { min: 40, max: 60,  th: 'กำลังพัฒนา',          badge: 'DEVELOPING' },
  { min: 60, max: 75,  th: 'มั่นใจหน้ากล้อง',      badge: 'COMPETENT'  },
  { min: 75, max: 90,  th: 'มาตรฐานมืออาชีพ',    badge: 'PROFICIENT' },
  { min: 90, max: 101, th: 'Thought Leader',      badge: 'MASTER'     },
] as const;

export function getHostLevel(overall: number) {
  return HOST_LEVELS.find(l => overall >= l.min && overall < l.max) ?? HOST_LEVELS[HOST_LEVELS.length - 1];
}

/** Build PPACT scores from per-QG averages. Missing QG counts as 0. */
export function ppactFromQgScores(qgScores: Record<string, number[]>) {
  return PPACT.map(d => {
    const vals = d.qgs.flatMap(qg => qgScores[qg] ?? [0]);
    const value = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    return { key: d.key, label: d.th, en: d.en, value };
  });
}
