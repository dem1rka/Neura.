import Papa from "papaparse";
import { allQuestions, forms, options } from "./content";
import type { Answer, ScreeningRecord } from "./engine";
import { read, write } from "../../services/storage";

export const MAX_BYTES = 1024 * 1024;
export const MAX_RECORDS = 100;
export type ImportError = "format" | "size" | "rows" | "duplicate" | "fields" | "id" | "age" | "answer" | "score" | "date" | "metadata";
export class ScreeningImportError extends Error {
  constructor(public code: ImportError, public row?: number) { super(code); }
}
const fail = (code: ImportError): never => { throw new ScreeningImportError(code); };
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : fail("format");
const keys = (value: Record<string, unknown>, allowed: string[]) => { if (Object.keys(value).some((key) => !allowed.includes(key))) fail("fields"); };
const integer = (value: unknown, min: number, max: number, code: ImportError): number => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : fail(code);
const nullableBoolean = (value: unknown): boolean | null => value === true || value === false || value === null ? value : fail("metadata");

export function validateRecord(input: unknown): ScreeningRecord {
  const v = object(input);
  keys(v, ["schemaVersion", "id", "ageMonths", "language", "demo", "date", "regression", "answers", "mchat", "aq10"]);
  if (v.schemaVersion !== 1) fail("format");
  if (typeof v.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(v.id)) fail("id");
  const ageMonths = integer(v.ageMonths, 0, 215, "age");
  if (!["ru", "kk", "en"].includes(String(v.language)) || typeof v.demo !== "boolean") fail("metadata");
  if (typeof v.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !Number.isFinite(Date.parse(v.date)) || new Date(v.date).toISOString().slice(0, 10) !== v.date) fail("date");
  const answers = object(v.answers);
  keys(answers, allQuestions.map((q) => q.id));
  for (const value of Object.values(answers)) if (value !== null) integer(value, 0, 3, "answer");
  const record: ScreeningRecord = {
    schemaVersion: 1, id: v.id as string, ageMonths, language: v.language as ScreeningRecord["language"],
    demo: v.demo as boolean, date: v.date as string, regression: nullableBoolean(v.regression), answers: answers as Record<string, Answer>,
  };
  if (v.mchat !== undefined) {
    const m = object(v.mchat);
    keys(m, ["total", "followUp"]);
    const total = integer(m.total, 0, 20, "score");
    if (m.followUp !== undefined && (total < 3 || total > 7)) fail("score");
    record.mchat = { total, ...(m.followUp !== undefined ? { followUp: integer(m.followUp, 0, total, "score") } : {}) };
  }
  if (v.aq10 !== undefined) {
    const aq = object(v.aq10);
    keys(aq, ["total", "noLearningDisability"]);
    record.aq10 = { total: integer(aq.total, 0, 10, "score"), noLearningDisability: nullableBoolean(aq.noLearningDisability) };
  }
  return record;
}

const metaColumns = ["id", "ageMonths", "language", "demo", "date", "regression", "mchatTotal", "mchatFollowUp", "aq10Total", "aq10NoLearningDisability"];
const columns = [...metaColumns, ...allQuestions.map((q) => q.id)];
const csvNumber = (v: string | undefined) => v !== undefined && /^\d+$/.test(v) ? Number(v) : fail("score");
const csvBoolean = (v: string | undefined) => v === "true" ? true : v === "false" ? false : v === "" || v === undefined ? null : fail("metadata");

export function parseImport(text: string, filename: string): ScreeningRecord[] {
  if (new Blob([text]).size > MAX_BYTES) fail("size");
  let raw: unknown[];
  if (filename.toLowerCase().endsWith(".json")) {
    let input: Record<string, unknown>;
    try { input = object(JSON.parse(text.replace(/^\uFEFF/, ""))); }
    catch { return fail("format"); }
    keys(input, ["schemaVersion", "records", "questionnaires"]);
    if (input.schemaVersion !== 1 || !Array.isArray(input.records)) fail("format");
    raw = input.records as unknown[];
  } else if (filename.toLowerCase().endsWith(".csv")) {
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim(), transform: (v) => v.trim() });
    const headers = result.meta.fields ?? [];
    const renamed = (result.meta as Papa.ParseMeta & { renamedHeaders?: Record<string, string> | null }).renamedHeaders;
    if (result.errors.length || !headers.length || new Set(headers).size !== headers.length || renamed) fail("format");
    if (headers.some((key) => !columns.includes(key)) || !metaColumns.slice(0, 6).every((key) => headers.includes(key))) fail("fields");
    raw = result.data.map((r, i) => {
      try {
        if (r.mchatFollowUp && !r.mchatTotal || r.aq10NoLearningDisability && !r.aq10Total) fail("score");
        return {
          schemaVersion: 1, id: r.id, ageMonths: csvNumber(r.ageMonths), language: r.language,
          demo: csvBoolean(r.demo), date: r.date, regression: csvBoolean(r.regression),
          answers: Object.fromEntries(allQuestions.map((q) => [q.id, r[q.id] ? csvNumber(r[q.id]) : null])),
          ...(r.mchatTotal ? { mchat: { total: csvNumber(r.mchatTotal), ...(r.mchatFollowUp ? { followUp: csvNumber(r.mchatFollowUp) } : {}) } } : {}),
          ...(r.aq10Total ? { aq10: { total: csvNumber(r.aq10Total), noLearningDisability: csvBoolean(r.aq10NoLearningDisability) } } : {}),
        };
      } catch (error) { if (error instanceof ScreeningImportError) error.row = i + 1; throw error; }
    });
  } else return fail("format");
  if (!raw.length || raw.length > MAX_RECORDS) fail("rows");
  const records = raw.map((r, i) => {
    try { return validateRecord(r); }
    catch (error) { if (error instanceof ScreeningImportError) error.row = i + 1; throw error; }
  });
  if (new Set(records.map((r) => r.id)).size !== records.length) fail("duplicate");
  return records;
}

export function mergeRecords(existing: ScreeningRecord[], incoming: ScreeningRecord[]) {
  if (incoming.some((r) => existing.some((e) => e.id === r.id))) fail("duplicate");
  if (existing.length + incoming.length > MAX_RECORDS) fail("rows");
  return [...incoming, ...existing];
}
export const loadRecords = () => {
  try {
    const value = read<unknown>("screening", []);
    if (!Array.isArray(value) || value.length > MAX_RECORDS) return [];
    return value.map(validateRecord);
  } catch { return []; }
};
export const saveRecords = (records: ScreeningRecord[]) => write("screening", records);

export function exportJSON(records: ScreeningRecord[], language: ScreeningRecord["language"] = "ru") {
  const i = language === "kk" ? 1 : language === "en" ? 2 : 0;
  return JSON.stringify({ schemaVersion: 1, questionnaires: forms.map((f) => ({ id: f.id, title: f.title[i], questions: f.questions.map((q) => ({ id: q.id, text: q.text[i] })), options: options.map((o, n) => ({ value: n === 4 ? null : n, label: o[i] })) })), records }, null, 2);
}
export function exportCSV(records: ScreeningRecord[]) {
  return "\uFEFF" + Papa.unparse(records.map((r) => ({
    id: r.id, ageMonths: r.ageMonths, language: r.language, demo: r.demo, date: r.date, regression: r.regression ?? "",
    mchatTotal: r.mchat?.total ?? "", mchatFollowUp: r.mchat?.followUp ?? "", aq10Total: r.aq10?.total ?? "", aq10NoLearningDisability: r.aq10?.noLearningDisability ?? "",
    ...Object.fromEntries(allQuestions.map((q) => [q.id, r.answers[q.id] ?? ""])),
  })), { columns, escapeFormulae: true });
}
export const blankRecord = (language: ScreeningRecord["language"]): ScreeningRecord => ({
  schemaVersion: 1, id: "CHILD-001", ageMonths: 72, language, demo: false,
  date: new Date().toISOString().slice(0, 10), regression: null,
  answers: Object.fromEntries(allQuestions.map((q) => [q.id, null])),
});
export function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
