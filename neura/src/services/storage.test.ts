import { beforeEach, describe, expect, it, vi } from "vitest";
import { read, write, service, summarize } from "./storage";
import { situations, questions } from "../data/content";
beforeEach(() => {
  const memory = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
  });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
});
describe("local observation service", () => {
  it("recovers from malformed JSON", () => {
    localStorage.setItem("neura.v1.game", "broken");
    expect(service.game()).toBeNull();
  });
  it("persists and retrieves typed session data", () => {
    const s = {
      id: "test",
      startedAt: "2026-10-14",
      answers: [
        { situationId: 0, choice: 2, seconds: 12, changes: 1, help: 2 },
      ],
    };
    service.saveGame(s);
    expect(service.game()).toEqual(s);
  });
  it("summarizes events without scoring answer choices", () => {
    const s = {
      id: "test",
      startedAt: "2026-10-14",
      answers: [
        { situationId: 0, choice: 3, seconds: 12, changes: 1, help: 2 },
        { situationId: 1, choice: 0, seconds: 8, changes: 0, help: 1 },
      ],
    };
    expect(summarize(s)).toEqual({ seconds: 20, changes: 1, help: 3 });
    expect(
      summarize({ ...s, answers: s.answers.map((a) => ({ ...a, choice: 1 })) }),
    ).toEqual(summarize(s));
  });
  it("signals unavailable storage", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(write("test", true)).toBe(false);
    expect(window.dispatchEvent).toHaveBeenCalledOnce();
  });
  it("bounds MRI history and excludes file data", () => {
    for (let i = 0; i < 24; i++)
      service.saveMRI({
        id: String(i),
        completedAt: "2026-10-14",
        source: "example",
        simulated: true,
      });
    expect(service.mri()).toHaveLength(20);
    expect(service.mri()[0].id).toBe("23");
    expect(Object.keys(service.mri()[0])).toEqual([
      "id",
      "completedAt",
      "source",
      "simulated",
    ]);
  });
  it("returns fallback when there is no stored value", () =>
    expect(read("missing", [])).toEqual([]));
});
describe("content coverage", () => {
  it("provides eight four-option situations across five areas", () => {
    expect(situations).toHaveLength(8);
    expect(situations.every((s) => s.options.length === 4)).toBe(true);
    expect(new Set(situations.map((s) => s.area)).size).toBe(5);
  });
  it("provides two questions in each category", () => {
    expect(questions).toHaveLength(10);
    for (let i = 0; i < 5; i++)
      expect(questions.filter((q) => q.category === i)).toHaveLength(2);
  });
});
