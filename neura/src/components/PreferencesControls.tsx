import { Languages, Moon, Sun } from "lucide-react";
import { setPreferences, usePreferences, useT } from "../i18n";
import type { Language } from "../i18n";

export function PreferencesControls() {
  const { language, theme } = usePreferences();
  const t = useT();
  return (
    <div className="preferences-controls print-hide">
      <label className="language-control">
        <Languages size={16} aria-hidden="true" />
        <span className="sr-only">{t("Язык интерфейса")}</span>
        <select
          value={language}
          onChange={(event) =>
            setPreferences({ language: event.target.value as Language })
          }
        >
          <option value="ru" lang="ru">
            Русский
          </option>
          <option value="kk" lang="kk">
            Қазақша
          </option>
          <option value="en" lang="en">
            English
          </option>
        </select>
      </label>
      <div
        className="theme-control"
        role="group"
        aria-label={t("Тема оформления")}
      >
        <button
          type="button"
          aria-label={t("Светлая тема")}
          title={t("Светлая тема")}
          aria-pressed={theme === "light"}
          onClick={() => setPreferences({ theme: "light" })}
        >
          <Sun size={17} />
        </button>
        <button
          type="button"
          aria-label={t("Тёмная тема")}
          title={t("Тёмная тема")}
          aria-pressed={theme === "dark"}
          onClick={() => setPreferences({ theme: "dark" })}
        >
          <Moon size={17} />
        </button>
      </div>
    </div>
  );
}
