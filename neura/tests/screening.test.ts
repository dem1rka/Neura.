import { describe, expect, it } from "vitest";
import { allQuestions } from "../src/features/screening/content";
import { analyze, demoCohort, demoMetrics, screenResults, type ScreeningRecord } from "../src/features/screening/engine";
import { blankRecord, exportCSV, exportJSON, mergeRecords, parseImport, validateRecord } from "../src/features/screening/io";

const mchat = (total: number, followUp?: number, ageMonths = 24): ScreeningRecord => ({ ...blankRecord("ru"), ageMonths, mchat: { total, ...(followUp === undefined ? {} : { followUp }) } });
const status = (record: ScreeningRecord) => screenResults(record)[0].status;

describe("screening rules", () => {
  it.each([[0, "negative"], [2, "negative"], [3, "pending"], [7, "pending"], [8, "positive"], [20, "positive"]] as const)("M-CHAT %i has status %s", (total, expected) => {
    expect(status(mchat(total))).toBe(expected);
  });
  it("does not mistake absent follow-up for a negative screen", () => {
    expect(status(mchat(4))).toBe("pending");
    expect(status(mchat(4, 0))).toBe("negative");
    expect(status(mchat(4, 1))).toBe("negative");
    expect(status(mchat(4, 2))).toBe("positive");
  });
  it("enforces the supported M-CHAT age range including boundaries", () => {
    for (const age of [15, 31, 84]) expect(status(mchat(9, undefined, age))).toBe("ineligible");
    for (const age of [16, 30]) expect(status(mchat(9, undefined, age))).toBe("positive");
  });
  it("enforces AQ-10 child age, applicability and threshold", () => {
    const record: ScreeningRecord = { ...blankRecord("kk"), aq10: { total: 6, noLearningDisability: true } };
    expect(status(record)).toBe("positive");
    expect(status({ ...record, aq10: { total: 5, noLearningDisability: true } })).toBe("negative");
    for (const ageMonths of [47, 144]) expect(status({ ...record, ageMonths })).toBe("ineligible");
    for (const ageMonths of [48, 143]) expect(status({ ...record, ageMonths })).toBe("positive");
    for (const noLearningDisability of [false, null]) expect(status({ ...record, aq10: { total: 9, noLearningDisability } })).toBe("ineligible");
  });
  it("keeps missing and unknown answers out of complete scale scores", () => {
    const record = blankRecord("ru");
    record.answers = { soc1: 3, soc2: 3, soc3: null };
    const factor = analyze(record).factors[0];
    expect(factor.score).toBeNull();
    expect(factor.flagged).toBe(false);
    expect(factor.answered).toBe(2);
    record.answers.soc3 = 1; record.answers.soc4 = 1;
    expect(analyze(record).factors[0]).toMatchObject({ score: 8, flagged: true });
    expect(analyze({ ...record, regression: true }).regression).toBe(true);
    expect(analyze(record).screens).toEqual([]);
  });
  it("calculates demo metrics from independent fixed fictional labels", () => {
    expect(demoMetrics()).toEqual({ tp: 3, tn: 3, fp: 1, fn: 1, n: 8, excluded: 0, accuracy: .75, sensitivity: .75, specificity: .75, precision: .75 });
    expect(demoMetrics([{ record: mchat(4), truth: true }])).toMatchObject({ n: 0, excluded: 1, accuracy: null, sensitivity: null });
    expect(demoMetrics([{ record: mchat(9), truth: false }])).toMatchObject({ fp: 1, accuracy: 0, specificity: 0, sensitivity: null });
  });
});

describe("questionnaire import/export", () => {
  it("round trips all demo answers and external scores through both formats", () => {
    const records = demoCohort.map((v) => v.record);
    for (const language of ["ru", "kk", "en"] as const) {
      const text = exportJSON(records, language);
      expect(JSON.parse(text).questionnaires[0].questions).toHaveLength(8);
      expect(parseImport(text, "answers.json")).toEqual(records);
    }
    expect(parseImport(exportCSV(records), "answers.csv")).toEqual(records);
  });
  it("preserves zeros, false and unknown in CSV and accepts a BOM", () => {
    const record = mchat(3, 0);
    record.answers.soc1 = 0; record.regression = false;
    expect(parseImport(exportCSV([record]), "answers.csv")).toEqual([record]);
    expect(parseImport("\uFEFF" + exportJSON([record]), "answers.json")).toEqual([record]);
  });
  it.each([
    { ageMonths: -1 }, { ageMonths: 72.5 }, { ageMonths: 216 },
    { id: "=HYPERLINK()" }, { id: "Иван" }, { date: "2026-02-30" },
    { answers: { soc1: "2" } }, { answers: { soc1: 4 } }, { answers: { unknown: 0 } },
    { mchat: { total: 21 } }, { mchat: { total: 4, followUp: 5 } }, { mchat: { total: 8, followUp: 2 } },
    { aq10: { total: 11, noLearningDisability: true } }, { aq10: { total: 5 } },
    { truth: true }, { language: "kz" }, { demo: "false" }, { regression: "false" },
  ])("rejects invalid data %j", (change) => {
    expect(() => validateRecord({ ...blankRecord("ru"), ...change })).toThrow();
  });
  it("rejects malformed files, unknown columns, duplicate IDs and oversized batches", () => {
    expect(() => parseImport("not json", "x.json")).toThrow("format");
    expect(() => parseImport(exportJSON([blankRecord("ru")]), "x.pdf")).toThrow("format");
    expect(() => parseImport(exportJSON([]), "x.json")).toThrow("rows");
    expect(() => parseImport(exportJSON([blankRecord("ru"), blankRecord("ru")]), "x.json")).toThrow("duplicate");
    expect(() => parseImport(exportJSON(Array.from({ length: 101 }, (_, i) => ({ ...blankRecord("ru"), id: String(i) }))), "x.json")).toThrow("rows");
    expect(() => parseImport("x".repeat(1024 * 1024 + 1), "x.json")).toThrow("size");
    expect(() => parseImport("id,ageMonths,language,demo,date,regression,unknown\nA,24,ru,false,2026-10-16,,1", "x.csv")).toThrow("fields");
    expect(() => parseImport("id,ageMonths,language,demo,date,regression\nA,24,ru,false,2026-10-16,,extra", "x.csv")).toThrow("format");
  });
  it("validates a complete batch before returning and does not mutate existing records on duplicates", () => {
    const original = [blankRecord("ru")];
    expect(() => mergeRecords(original, [blankRecord("ru")])).toThrow("duplicate");
    expect(original).toHaveLength(1);
    const text = JSON.stringify({ schemaVersion: 1, records: [original[0], { ...original[0], id: "bad", answers: { soc1: 99 } }] });
    expect(() => parseImport(text, "x.json")).toThrow("answer");
  });
  it("provides complete Russian and Kazakh questionnaire text with stable unique IDs", () => {
    expect(new Set(allQuestions.map((q) => q.id)).size).toBe(18);
    for (const q of allQuestions) {
      expect(q.text.every((text) => text.trim().length > 10)).toBe(true);
      expect(q.text[0]).not.toBe(q.text[1]);
    }
  });
});
