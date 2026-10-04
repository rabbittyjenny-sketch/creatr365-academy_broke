import type React from "react";
/**
 * System B rotating accent palette (creatr365-content-system ›
 * visual_system.md › System B), for blocks where the owner explicitly allows
 * cycling colors — currently ONLY the Live Notes cards at the bottom of
 * /courses. Everywhere else a region uses its page/menu color (README §41.4).
 *
 *  fill — the exact System B hex: top border, play-button fill
 *  text — same hue, lightened only as far as needed to reach 4.5:1 on the
 *         dark card (#141414); used for hover text, heading underline and
 *         small labels so navy/purple/red/teal stay readable
 *  on   — icon color on top of `fill` (≥3:1, non-text graphic)
 */
export interface Accent { name: string; fill: string; text: string; on: string }

export const SYSTEM_B_ROTATION: Accent[] = [
  { name: 'Gold',   fill: '#C0A060', text: '#C0A060', on: '#0D0D0D' },
  { name: 'Blue',   fill: '#4A7FB5', text: '#4E82B6', on: '#0D0D0D' },
  { name: 'Green',  fill: '#6AAA7A', text: '#6AAA7A', on: '#0D0D0D' },
  { name: 'Copper', fill: '#B87333', text: '#B87333', on: '#0D0D0D' },
  { name: 'Navy',   fill: '#1E3A6E', text: '#507DCF', on: '#F0ECE4' },
  { name: 'Purple', fill: '#9B4DCA', text: '#A661D0', on: '#F0ECE4' },
  { name: 'Red',    fill: '#C0392B', text: '#D65548', on: '#F0ECE4' },
  { name: 'Teal',   fill: '#2E7D6B', text: '#338C78', on: '#F0ECE4' },
];

/** Cycles back to slot 1 after 8, as System B specifies. */
export const rotatingAccent = (index: number) => SYSTEM_B_ROTATION[index % SYSTEM_B_ROTATION.length];

/** Community › คลิปกิจกรรม group color (Articles.tsx GROUPS). */
export const COMMUNITY_CLIPS_ACCENT: Accent = SYSTEM_B_ROTATION[1];

/** CSS variables that drive the site-wide hover rules for one region. */
export const accentVars = (a: Accent) =>
  ({ '--hover-accent': a.text, '--section-accent': a.text }) as React.CSSProperties;
