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
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <nav>
          <a href="#modules">Возможности</a>
          <a href="#how">Как это работает</a>
          <Link to="/about">О проекте</Link>
        </nav>
        <Link className="button secondary" to="/dashboard">
          Открыть платформу
          <ArrowUpRight size={17} />
        </Link>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <Badge>Технологии с вниманием к ребёнку</Badge>
          <h1>
            Замечать особенности.
            <br />
            <em>Открывать возможности.</em>
          </h1>
          <p>
            Neura объединяет игру и наблюдения педагогов, чтобы помочь
            специалистам лучше понимать особенности развития каждого ребёнка.
          </p>
          <div className="actions">
            <Link className="button" to="/dashboard">
              Посмотреть платформу
              <ArrowRight size={18} />
            </Link>
            <Link className="button secondary" to="/game">
              Попробовать демо
            </Link>
          </div>
          <div className="hero-note">
            <ShieldCheck size={16} />
            Поддержка специалиста · Без постановки диагноза
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-top">
            <span className="status-dot" />
            Пространство маленьких открытий<span>01 / 08</span>
          </div>
          <Scene />
          <div className="visual-bottom">
            <div className="icon-tile blue">
              <Gamepad2 />
            </div>
            <div>
              <strong>Приключение Айко</strong>
              <small>Играем. Наблюдаем. Понимаем.</small>
            </div>
            <span className="round-arrow">
              <ArrowUpRight />
            </span>
          </div>
          <div className="floating-note">
            <Check size={17} />
            Каждый способ общения важен
          </div>
        </div>
      </section>
      <div className="landing-divider">
        <span>ОДНА ПЛАТФОРМА — РАЗНЫЕ ПЕРСПЕКТИВЫ</span>
        <span>Педагогам</span>
        <span>Специалистам</span>
        <span>Родителям</span>
      </div>
      <section id="modules" className="landing-section">
        <div className="eyebrow">ЦЕЛОСТНЫЙ ВЗГЛЯД</div>
        <h2>
          Больше контекста.
          <br />
          Больше понимания.
        </h2>
        <div className="modules-grid">
          {[
            {
              icon: Gamepad2,
              title: "Игровое наблюдение",
              text: "Восемь повседневных ситуаций в дружелюбном мире Айко. Ответы и действия становятся материалом для наблюдения.",
              to: "/game",
              tone: "blue",
            },
            {
              icon: ClipboardList,
              title: "Взгляд педагога",
              text: "Структурированная анкета помогает собрать опыт ежедневного общения и обсудить важные детали.",
              to: "/questionnaire",
              tone: "teal",
            },
            {
              icon: ScanLine,
              title: "Исследование МРТ",
              text: "Экспериментальная концепция анализа изображений. Сейчас — прозрачная симуляция без обученной модели.",
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
                Открыть модуль
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section id="how" className="landing-section how-section">
        <div>
          <div className="eyebrow">ПРОСТОЙ ПУТЬ</div>
          <h2>
            От маленького наблюдения
            <br />к содержательному разговору.
          </h2>
        </div>
        <div className="how-grid">
          {[
            ["Выберите инструмент", "Начните с игры или наблюдений педагога."],
            ["Соберите контекст", "Пройдите сценарий в удобном темпе."],
            [
              "Обсудите со специалистом",
              "Используйте описательный отчёт как основу разговора.",
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
        <div className="eyebrow">ВОКРУГ РЕБЁНКА</div>
        <h2>Для тех, кто рядом.</h2>
        <div className="benefits-grid">
          {[
            [
              "Педагогам",
              "Удобно фиксировать наблюдения в привычных ситуациях.",
            ],
            [
              "Специалистам",
              "Видеть ответы и контекст, а не непрозрачные оценки.",
            ],
            [
              "Родителям",
              "Получать понятную основу для обсуждения со специалистом.",
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
        <span>Ранний прототип · Pizza Pitch 2026</span>
        <Link to="/about">
          Ответственный подход к AI
          <ArrowUpRight size={15} />
        </Link>
      </footer>
    </div>
  );
}
