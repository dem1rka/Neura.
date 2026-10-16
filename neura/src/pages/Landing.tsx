import { PreferencesControls } from "../components/PreferencesControls";
import { useT, localeTag } from "../i18n";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Gamepad2,
  ClipboardList,
  ScanLine,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Logo } from "../layouts/AppLayout";
import { Scene } from "../components/Scene";
import { Badge, Disclaimer } from "../components/UI";
export default function Landing() {
  const t = useT();
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <PreferencesControls />
        <nav>
          <a href="#modules">{t("Возможности")}</a>
          <a href="#how">{t("Как это работает")}</a>
          <Link to="/about">{t("О проекте")}</Link>
        </nav>
        <Link className="button secondary" to="/dashboard">
          {t("Открыть платформу")}
          <ArrowUpRight size={17} />
        </Link>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <Badge>{t("Технологии с вниманием к ребёнку")}</Badge>
          <h1>
            {t("Замечать особенности.")}
            <br />
            <em>{t("Открывать возможности.")}</em>
          </h1>
          <p>
            {t(
              "Neura объединяет игру и наблюдения педагогов, чтобы помочь специалистам лучше понимать особенности развития каждого ребёнка.",
            )}
          </p>
          <div className="actions">
            <Link className="button" to="/dashboard">
              {t("Посмотреть платформу")}
              <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" to="/game">
              {t("Попробовать демо")}
            </Link>
          </div>
          <div className="hero-note">
            <ShieldCheck size={16} />
            {t("Поддержка специалиста · Без постановки диагноза")}
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-top">
            <span className="status-dot" />
            {t("Пространство маленьких открытий")}
            <span>01 / 08</span>
          </div>
          <Scene />
          <div className="visual-bottom">
            <div className="icon-tile blue">
              <Gamepad2 />
            </div>
            <div>
              <strong>{t("Приключение Айко")}</strong>
              <small>{t("Играем. Наблюдаем. Понимаем.")}</small>
            </div>
            <span className="round-arrow">
              <ArrowUpRight />
            </span>
          </div>
          <div className="floating-note">
            <Check size={17} />
            {t("Каждый способ общения важен")}
          </div>
        </div>
      </section>
      <div className="landing-divider">
        <span>{t("ОДНА ПЛАТФОРМА — РАЗНЫЕ ПЕРСПЕКТИВЫ")}</span>
        <span>{t("Педагогам")}</span>
        <span>{t("Специалистам")}</span>
        <span>{t("Родителям")}</span>
      </div>
      <section id="modules" className="landing-section">
        <div className="eyebrow">{t("ЦЕЛОСТНЫЙ ВЗГЛЯД")}</div>
        <h2>
          {t("Больше контекста.")}
          <br />
          {t("Больше понимания.")}
        </h2>
        <div className="modules-grid">
          {[
            {
              icon: Gamepad2,
              title: t("Игровое наблюдение"),
              text: t(
                "Восемь повседневных ситуаций в дружелюбном мире Айко. Ответы и действия становятся материалом для наблюдения.",
              ),
              to: "/game",
              tone: "blue",
            },
            {
              icon: ClipboardList,
              title: t("Взгляд педагога"),
              text: t(
                "Структурированная анкета помогает собрать опыт ежедневного общения и обсудить важные детали.",
              ),
              to: "/questionnaire",
              tone: "teal",
            },
            {
              icon: ScanLine,
              title: t("Исследование МРТ"),
              text: t(
                "Просмотр NIfTI-снимков в 2D и 3D, метаданные и сопоставление с ABIDE. Всё в вашем браузере.",
              ),
              to: "/mri",
              tone: "purple",
            },
          ].map(({ icon: Icon, title, text, to, tone }, i) => (
            <Link key={to} className="card module" to={to}>
              <div className="module-top">
                <span className={"icon-tile " + tone}>
                  <Icon />
                </span>
                <span className="muted">0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="text-link">
                {t("Открыть модуль")}
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section id="how" className="landing-section how-section">
        <div>
          <div className="eyebrow">{t("ПРОСТОЙ ПУТЬ")}</div>
          <h2>
            {t("От маленького наблюдения")}
            <br />
            {t("к содержательному разговору.")}
          </h2>
        </div>
        <div className="how-grid">
          {[
            [
              t("Выберите инструмент"),
              t("Начните с игры или наблюдений педагога."),
            ],
            [t("Соберите контекст"), t("Пройдите сценарий в удобном темпе.")],
            [
              t("Обсудите со специалистом"),
              t("Используйте описательный отчёт как основу разговора."),
            ],
          ].map(([title, text], i) => (
            <div key={title}>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="landing-section">
        <div className="eyebrow">{t("ВОКРУГ РЕБЁНКА")}</div>
        <h2>{t("Для тех, кто рядом.")}</h2>
        <div className="benefits-grid">
          {[
            [
              t("Педагогам"),
              t("Удобно фиксировать наблюдения в привычных ситуациях."),
            ],
            [
              t("Специалистам"),
              t("Видеть ответы и контекст, а не непрозрачные оценки."),
            ],
            [
              t("Родителям"),
              t("Получать понятную основу для обсуждения со специалистом."),
            ],
          ].map(([t, p]) => (
            <div key={t}>
              <Check size={22} />
              <h3>{t}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
        <Disclaimer />
      </section>
      <footer className="landing-footer">
        <Logo />
        <Link to="/about">
          {t("Ответственный подход к AI")}
          <ArrowUpRight size={15} />
        </Link>
      </footer>
    </div>
  );
}
