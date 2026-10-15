import { useT, localeTag } from "../../i18n";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  RotateCcw,
  PartyPopper,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { getContent } from "../../data/content";
import { service, read, write } from "../../services/storage";
import type { GameSession } from "../../types";
import { Card, Heading, Progress } from "../../components/UI";
import { Scene } from "../../components/Scene";
interface Draft {
  index: number;
  choice: number | null;
  changes: number;
  help: number;
  seconds: number;
}
export default function Game() {
  const t = useT();
  const { situations } = getContent(t);
  const [session, setSession] = useState<GameSession | null>(service.game);
  const saved = read<Draft | null>("game-draft", null);
  const index = session?.answers.length ?? 0;
  const draft = saved?.index === index ? saved : null;
  const [choice, setChoice] = useState<number | null>(draft?.choice ?? null);
  const [changes, setChanges] = useState(draft?.changes ?? 0);
  const [help, setHelp] = useState(draft?.help ?? 0);
  const [repeat, setRepeat] = useState(false);
  const started = useRef(performance.now());
  const elapsed = useRef(draft?.seconds ?? 0);
  const item = situations[index];
  function persist(c: number | null, ch: number, h: number) {
    write("game-draft", {
      index,
      choice: c,
      changes: ch,
      help: h,
      seconds: elapsed.current + (performance.now() - started.current) / 1000,
    });
  }
  function begin() {
    const s = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      answers: [],
    };
    service.saveGame(s);
    write("game-draft", null);
    setSession(s);
    setChoice(null);
    setChanges(0);
    setHelp(0);
    elapsed.current = 0;
    started.current = performance.now();
  }
  function next() {
    if (!session || choice === null) return;
    const answers = [
      ...session.answers,
      {
        situationId: index,
        choice,
        seconds: Math.max(
          1,
          Math.round(
            elapsed.current + (performance.now() - started.current) / 1000,
          ),
        ),
        changes,
        help,
      },
    ];
    const updated = {
      ...session,
      answers,
      ...(answers.length === 8
        ? { completedAt: new Date().toISOString() }
        : {}),
    };
    service.saveGame(updated);
    write("game-draft", null);
    setSession(updated);
    setChoice(null);
    setChanges(0);
    setHelp(0);
    setRepeat(false);
    elapsed.current = 0;
    started.current = performance.now();
  }
  if (session?.completedAt)
    return (
      <Card className="game-complete">
        <PartyPopper size={48} />
        <h1>{t("Ты помог Айко открыть новый мир!")}</h1>
        <p>
          {t("Все восемь приключений позади. Спасибо за твои идеи и внимание.")}
        </p>
        <Scene scene="gift" />
        <div className="actions">
          <Link className="button" to="/game/report">
            {t("Отчёт для взрослого")}
            <ArrowRight size={18} />
          </Link>
          <button className="button secondary" onClick={begin}>
            {t("Новое приключение")}
          </button>
        </div>
        <p className="small-note">
          {t("Новое приключение заменит текущую сессию на этом устройстве.")}
        </p>
      </Card>
    );
  if (!session)
    return (
      <>
        <Heading
          eyebrow={t("ИГРОВОЕ НАБЛЮДЕНИЕ")}
          title={t("Приключение Айко")}
          description={t(
            "Восемь маленьких историй о дружбе, чувствах и новых открытиях.",
          )}
        />
        <Card className="game-intro">
          <Scene />
          <div>
            <span className="pill">{t("ЗНАКОМЬСЯ, ТВОЙ НОВЫЙ ДРУГ")}</span>
            <h2>
              {t("Привет! Я Айко.")}
              <br />
              {t("Отправимся в приключение?")}
            </h2>
            <p>
              {t(
                "Будем знакомиться, помогать друзьям и придумывать решения. Выбирай вариант, который тебе ближе. Здесь можно подумать и изменить ответ.",
              )}
            </p>
            <div className="intro-facts">
              <span>
                <Clock size={18} />
                {t("10–15 минут")}
              </span>
              <span>{t("7–8 лет")}</span>
              <span>{t("8 историй")}</span>
            </div>
            <button className="button" onClick={begin}>
              {t("Начать приключение")}
              <ArrowRight size={18} />
            </button>
          </div>
        </Card>
        <div className="disclaimer">
          <ShieldCheck />
          <p>
            <strong>{t("Для сопровождающего взрослого.")}</strong>
            {t(
              "Объясните, что это игра, а не экзамен. Можно сделать перерыв. Фиксируются ответы, время, изменения выбора и повторения инструкции; диагностические баллы не рассчитываются. Прогресс сохраняется на этом устройстве.",
            )}
          </p>
        </div>
      </>
    );
  return (
    <div className="game-container">
      <div className="section-line">
        <Link to="/dashboard" className="muted">
          {t("← К платформе")}
        </Link>
        <span className="pill">{t("Приключение Айко")}</span>
        <strong>{index + 1} / 8</strong>
      </div>
      <Progress value={(index / 8) * 100} />
      <div className="game-step">
        <div className="eyebrow">
          {t("ИСТОРИЯ")} {index + 1}
        </div>
        <h1>{item.title}</h1>
        <Scene scene={item.scene} />
        <h2 className="story">{item.story}</h2>
        <button
          className="repeat"
          onClick={() => {
            setHelp(help + 1);
            setRepeat(true);
            persist(choice, changes, help + 1);
          }}
        >
          <RotateCcw size={17} />
          {t("Повторить инструкцию")}
        </button>
        {repeat && (
          <p className="repeat-story" role="status">
            {item.story}
          </p>
        )}
        <div className="answer-grid">
          {item.options.map((option, i) => (
            <button
              key={option}
              aria-pressed={choice === i}
              className={"answer " + (choice === i ? "selected" : "")}
              onClick={() => {
                const ch = changes + Number(choice !== null && choice !== i);
                setChanges(ch);
                setChoice(i);
                persist(i, ch, help);
              }}
            >
              <span>{i + 1}</span>
              {option}
            </button>
          ))}
        </div>
        <div className="game-bottom">
          <span>{t("Можно выбрать любой подходящий тебе вариант")}</span>
          <button className="button" disabled={choice === null} onClick={next}>
            {index === 7 ? t("Завершить") : t("Дальше")}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
