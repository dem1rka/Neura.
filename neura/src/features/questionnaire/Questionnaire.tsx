import { useT, localeTag } from "../../i18n";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react";
import { getContent } from "../../data/content";
import { service } from "../../services/storage";
import { Card, Heading, Progress, Disclaimer } from "../../components/UI";
export default function Questionnaire() {
  const t = useT();
  const { questions, categories, frequency } = getContent(t);
  const [session, setSession] = useState(service.questionnaire);
  const [index, setIndex] = useState(() =>
    Math.min(
      9,
      questions.findIndex((q) => session.answers[q.id] === undefined) === -1
        ? 0
        : questions.findIndex((q) => session.answers[q.id] === undefined),
    ),
  );
  const [saved, setSaved] = useState(false);
  const q = questions[index];
  function answer(value: number) {
    const update = { answers: { ...session.answers, [q.id]: value } };
    setSession(update);
    setSaved(service.saveQuestionnaire(update));
  }
  if (session.completedAt)
    return (
      <Card className="empty">
        <CheckCircle2 size={48} />
        <h1>{t("Наблюдения сохранены")}</h1>
        <p>
          {t("Ваш опыт помогает дополнить картину повседневного поведения.")}
        </p>
        <div className="actions">
          <Link className="button" to="/questionnaire/report">
            {t("Посмотреть отчёт")}
            <ArrowRight size={18} />
          </Link>
          <button
            className="button secondary"
            onClick={() => {
              const next = { answers: {} };
              service.saveQuestionnaire(next);
              setSession(next);
              setIndex(0);
            }}
          >
            {t("Заполнить заново")}
          </button>
        </div>
        <p className="small-note">
          {t("Повторное заполнение заменит текущую анкету.")}
        </p>
      </Card>
    );
  return (
    <>
      <Heading
        eyebrow={t("ВЗГЛЯД ПЕДАГОГА")}
        title={t("То, что заметно каждый день")}
        description={t(
          "Опирайтесь на наблюдения за последние две недели в привычной для ребёнка обстановке.",
        )}
      />
      <div className="question-layout">
        <Card className="question-sidebar">
          <h3>{t("Области наблюдения")}</h3>
          {categories.map((c, i) => (
            <div className={q.category === i ? "current" : ""} key={c}>
              <span>{i + 1}</span>
              {c}
            </div>
          ))}
          <p className="small-note">
            {t(
              "Иллюстративные вопросы. Анкета не является валидированным клиническим инструментом.",
            )}
          </p>
        </Card>
        <Card className="question-card">
          <div className="section-line">
            <span className="eyebrow">
              {t("ВОПРОС")} {index + 1} {t("ИЗ 10")}
            </span>
            <span className="muted">
              {Object.keys(session.answers).length * 10}
              {t("% заполнено")}
            </span>
          </div>
          <Progress value={Object.keys(session.answers).length * 10} />
          <span className="pill">{categories[q.category]}</span>
          <h2>{q.text}</h2>
          <p className="muted">
            {t("Если опыта недостаточно, выберите соответствующий вариант.")}
          </p>
          <div className="question-options">
            {frequency.map((label, i) => (
              <button
                aria-pressed={session.answers[q.id] === i}
                className={
                  "answer " + (session.answers[q.id] === i ? "selected" : "")
                }
                onClick={() => answer(i)}
                key={label}
              >
                <span className="radio-dot" />
                {label}
              </button>
            ))}
          </div>
          <div className="game-bottom">
            <button
              className="button secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              <ArrowLeft size={17} />
              {t("Назад")}
            </button>
            {index < 9 ? (
              <button
                className="button"
                disabled={session.answers[q.id] === undefined}
                onClick={() => setIndex(index + 1)}
              >
                {t("Далее")}
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                className="button"
                disabled={Object.keys(session.answers).length !== 10}
                onClick={() => {
                  const next = {
                    ...session,
                    completedAt: new Date().toISOString(),
                  };
                  service.saveQuestionnaire(next);
                  setSession(next);
                }}
              >
                {t("Завершить анкету")}
                <CheckCircle2 size={17} />
              </button>
            )}
          </div>
          <p className="save-status" role="status">
            <Save size={14} />
            {saved
              ? t("Ответ сохранён на этом устройстве")
              : t("Прогресс сохраняется после каждого ответа")}
          </p>
        </Card>
      </div>
      <Disclaimer />
    </>
  );
}
