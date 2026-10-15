import { useSyncExternalStore } from "react";
import translations from "./translations.json";

export type Language = "ru" | "kk" | "en";
export type Theme = "light" | "dark";
export interface Preferences {
  language: Language;
  theme: Theme;
}
export const preferenceKey = "neura.preferences.v1";
const defaults: Preferences = { language: "ru", theme: "light" };
export function parsePreferences(raw: string | null): Preferences {
  try {
    const value = JSON.parse(raw || "null");
    return {
      language: ["ru", "kk", "en"].includes(value?.language)
        ? value.language
        : "ru",
      theme: value?.theme === "dark" ? "dark" : "light",
    };
  } catch {
    return { ...defaults };
  }
}
function loadPreferences() {
  try {
    return parsePreferences(localStorage.getItem(preferenceKey));
  } catch {
    return { ...defaults };
  }
}
let preferences = loadPreferences();
const listeners = new Set<() => void>();
const dictionary: Record<string, { en: string; kk: string }> = translations;
export function translate(
  language: Language,
  message: string,
  params: Record<string, string | number> = {},
): string {
  const template =
    language === "ru" ? message : (dictionary[message]?.[language] ?? message);
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(params, key) ? String(params[key]) : match,
  );
}
export function localeTag(language = preferences.language) {
  return { ru: "ru-RU", kk: "kk-KZ", en: "en-GB" }[language];
}
export function applyAppearance() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.lang = preferences.language;
  document.documentElement.style.colorScheme = preferences.theme;
  document.title = `Neura · ${translate(preferences.language, "Пространство наблюдения")}`;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      preferences.theme === "dark" ? "#101a2b" : "#2563eb",
    );
}
export function setPreferences(update: Partial<Preferences>) {
  preferences = parsePreferences(JSON.stringify({ ...preferences, ...update }));
  try {
    localStorage.setItem(preferenceKey, JSON.stringify(preferences));
  } catch {
    /* Keep the current choice usable when browser storage is unavailable. */
  }
  applyAppearance();
  listeners.forEach((listener) => listener());
}
function onStorage(event: StorageEvent) {
  if (event.key !== preferenceKey && event.key !== null) return;
  preferences = loadPreferences();
  applyAppearance();
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  if (!listeners.size && typeof window !== "undefined")
    window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== "undefined")
      window.removeEventListener("storage", onStorage);
  };
}
export function usePreferences() {
  return useSyncExternalStore(
    subscribe,
    () => preferences,
    () => defaults,
  );
}
export function useT() {
  const { language } = usePreferences();
  return (message: string, params?: Record<string, string | number>) =>
    translate(language, message, params);
}
