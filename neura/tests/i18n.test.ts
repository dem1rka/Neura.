import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import translations from "../src/i18n/translations.json";
import { getContent } from "../src/data/content";
import {
  localeTag,
  parsePreferences,
  preferenceKey,
  setPreferences,
  translate,
} from "../src/i18n/index";

describe("translation coverage", () => {
  it("has both translations with matching interpolation placeholders", () => {
    for (const [source, values] of Object.entries(translations)) {
      for (const language of ["en", "kk"] as const) {
        expect(values[language].trim().length, source).toBeGreaterThan(0);
        expect(
          values[language].match(/\{\w+\}/g)?.sort() ?? [],
          source,
        ).toEqual(source.match(/\{\w+\}/g)?.sort() ?? []);
      }
    }
  });
  it("covers every literal translation key used by the React views", () => {
    function checkDirectory(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const filename = join(directory, entry.name);
        if (entry.isDirectory()) checkDirectory(filename);
        else if (filename.endsWith(".tsx")) {
          const source = ts.createSourceFile(
            filename,
            readFileSync(filename, "utf8"),
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX,
          );
          function visit(node: ts.Node) {
            if (
              ts.isCallExpression(node) &&
              ts.isIdentifier(node.expression) &&
              node.expression.text === "t" &&
              node.arguments[0] &&
              ts.isStringLiteral(node.arguments[0])
            ) {
              expect(
                Object.hasOwn(translations, node.arguments[0].text),
                `${filename}: ${node.arguments[0].text}`,
              ).toBe(true);
            }
            ts.forEachChild(node, visit);
          }
          visit(source);
        }
      }
    }
    checkDirectory(join(process.cwd(), "src"));
  });
  it("translates game and questionnaire content while preserving persisted IDs", () => {
    const ru = getContent((message) => message);
    for (const language of ["en", "kk"] as const) {
      const localized = getContent((message) => translate(language, message));
      expect(localized.situations).toHaveLength(8);
      expect(localized.questions.map((q) => q.id)).toEqual(
        ru.questions.map((q) => q.id),
      );
      expect(localized.situations.map((s) => s.scene)).toEqual(
        ru.situations.map((s) => s.scene),
      );
      expect(localized.situations[0].title).not.toEqual(ru.situations[0].title);
      expect(localized.situations.every((s) => s.options.length === 4)).toBe(
        true,
      );
      expect(
        localized.questions.every(
          (q) => q.text !== ru.questions[Number(q.id)].text,
        ),
      ).toBe(true);
    }
  });
  it("formats report values and selects locale tags", () => {
    expect(translate("en", "Вопрос {0}: «{1}»", { 0: 3, 1: "Often" })).toBe(
      "Question 3: “Often”",
    );
    expect(translate("ru", "{0} сек.", { 0: 12 })).toBe("12 сек.");
    expect(localeTag("kk")).toBe("kk-KZ");
  });
});
describe("appearance preferences", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
  });
  it("handles malformed and unsupported stored settings", () => {
    expect(parsePreferences("broken")).toEqual({
      language: "ru",
      theme: "light",
    });
    expect(parsePreferences('{"language":"fr","theme":"invalid"}')).toEqual({
      language: "ru",
      theme: "light",
    });
    expect(parsePreferences('{"language":"kk","theme":"dark"}')).toEqual({
      language: "kk",
      theme: "dark",
    });
  });
  it("saves preferences without changing in-progress observations", () => {
    localStorage.setItem("neura.v1.game", '{"answers":[1,2]}');
    setPreferences({ language: "kk", theme: "dark" });
    expect(JSON.parse(localStorage.getItem(preferenceKey)!)).toEqual({
      language: "kk",
      theme: "dark",
    });
    expect(localStorage.getItem("neura.v1.game")).toBe('{"answers":[1,2]}');
    setPreferences({ language: "en" });
    expect(JSON.parse(localStorage.getItem(preferenceKey)!)).toEqual({
      language: "en",
      theme: "dark",
    });
  });
  it("still switches appearance when local storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() =>
      setPreferences({ language: "ru", theme: "light" }),
    ).not.toThrow();
  });
});

