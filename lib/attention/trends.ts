import { z } from "zod";

export const GOOGLE_TRENDS_EXPLORER = "https://trends.google.com/trends/explore";
export const MAX_TREND_NOTES = 12;

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const calendarDateSchema = z.string().refine(isCalendarDate, "Use a real date in YYYY-MM-DD format.");
export const optionalDateSchema = z.union([z.literal(""), calendarDateSchema]);
export const publicUrlSchema = z.string().trim().max(2048).refine((value) => {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use a complete http:// or https:// URL without login credentials.");

const requiredText = (name: string, max: number) => z.string().trim().min(1, `${name} is required.`).max(max);

// 未完成表格都留喺 session memory；只有完整、驗證咗嘅筆記先 attach。
export const trendDraftSchema = z.object({
  sourceUrl: z.string().max(2048),
  term: z.string().max(200),
  geography: z.string().max(120),
  startDate: z.string().max(10),
  endDate: z.string().max(10),
  searchSurface: z.string().max(120),
  comparison: z.string().max(1200),
  observation: z.string().max(3000),
}).strict();

export const trendNoteSchema = z.object({
  sourceUrl: publicUrlSchema,
  term: requiredText("Term or topic", 200),
  geography: requiredText("Geography", 120),
  startDate: calendarDateSchema,
  endDate: calendarDateSchema,
  searchSurface: requiredText("Search surface", 120),
  comparison: requiredText("Comparison context", 1200),
  observation: requiredText("Observation", 3000),
}).strict().refine((note) => note.startDate <= note.endDate, {
  path: ["endDate"], message: "End date must be on or after the start date.",
});

export type TrendDraft = z.infer<typeof trendDraftSchema>;
export type TrendNote = z.infer<typeof trendNoteSchema>;

export function emptyTrendDraft(): TrendDraft {
  return { sourceUrl: "", term: "", geography: "", startDate: "", endDate: "", searchSurface: "", comparison: "", observation: "" };
}

export function trendContext(note: TrendNote): string {
  return [
    `Term / topic: ${note.term}`,
    `Geography: ${note.geography}; window: ${note.startDate} to ${note.endDate}; surface: ${note.searchSurface}`,
    `Comparison: ${note.comparison}`,
    `Observation (user supplied, not verified): ${note.observation}`,
    `Source: ${note.sourceUrl}`,
    "Treat this as a topic hypothesis, not evidence of demand volume, a cause of a spike, or a forecast.",
  ].join("\n");
}
