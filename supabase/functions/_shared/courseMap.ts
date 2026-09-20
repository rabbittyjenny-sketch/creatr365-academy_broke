/**
 * Z3-2 — ONE place that knows how an LMS course code relates to a DB slug.
 *
 * The problem this replaces: the same table existed twice, once inside the
 * LMS bundle (COURSES / LMS_TO_SLUG) and once inside each edge function
 * (SLUG_TO_LMS in get-enrollment, an implicit assumption in save-score).
 * Editing one side and not the other did not raise an error anywhere — the
 * score simply never landed, and nothing in the UI said so.
 *
 * Every edge function that receives a course identifier from the LMS should
 * import `resolveCourseSlug` and accept either form.
 */

/** LMS course code -> courses.slug in the database. */
export const LMS_TO_SLUG: Record<string, string> = {
  FR_MAGNET:            "magnet",
  COURSE_0_FOUNDATION:  "foundation",
  COURSE_1_SIGNAL:      "signal",
  COURSE_2_STAGE:       "stage",
  COURSE_3_BRAND_HOST:  "brand-host-architect",
};

/** courses.slug -> LMS course code. Derived, never hand-maintained. */
export const SLUG_TO_LMS: Record<string, string> = Object.fromEntries(
  Object.entries(LMS_TO_SLUG).map(([code, slug]) => [slug, code]),
);

/** The canonical curriculum order, used for "next course" logic. */
export const COURSE_ORDER = [
  "FR_MAGNET",
  "COURSE_0_FOUNDATION",
  "COURSE_1_SIGNAL",
  "COURSE_2_STAGE",
  "COURSE_3_BRAND_HOST",
] as const;

/**
 * Accepts either an LMS course code or a DB slug and returns the DB slug.
 * Returns null when the value is unknown, so the caller can fail loudly
 * instead of guessing.
 */
export function resolveCourseSlug(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  if (LMS_TO_SLUG[raw]) return LMS_TO_SLUG[raw];               // LMS code
  const upper = raw.toUpperCase();
  if (LMS_TO_SLUG[upper]) return LMS_TO_SLUG[upper];
  const lower = raw.toLowerCase();
  if (SLUG_TO_LMS[lower]) return lower;                        // already a slug
  return null;
}

/** Accepts either form and returns the LMS course code. */
export function resolveLmsCode(input: string | null | undefined): string | null {
  const slug = resolveCourseSlug(input);
  return slug ? SLUG_TO_LMS[slug] ?? null : null;
}
