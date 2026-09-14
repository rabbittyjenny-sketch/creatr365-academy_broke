// The courses.tag field is admin free-text like "ชั้นที่ 1 — ไลฟ์ให้เป็น"
// (real values in the DB use "ชั้น", not "ชุด") — the UI only needs the
// tier name itself, no "ชั้นที่ N —" numbering prefix. Matches through the
// first dash after a leading "ชั้น"/"ชุด" rather than a fixed "ชั้นที่ N —"
// shape, so it still strips variants like "ชั้น 1 –" or "ชั้นที่1-" without
// needing to enumerate every admin phrasing. Tags with no such prefix at
// all (e.g. "FREE", "LOW TICKET 1") pass through unchanged.
//
// Shared across Courses.tsx, CourseDetail.tsx and Dashboard.tsx — moved
// here once a third page needed it, instead of a third copy-pasted copy.
export const tierLabel = (tag: string) => tag.replace(/^(?:ชั้น|ชุด)[^-–—]*[-–—]\s*/, '').trim();
