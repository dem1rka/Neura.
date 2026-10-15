import { useT, localeTag } from "../../i18n";
import { Printer } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getContent } from "../../data/content";
import { service } from "../../services/storage";
import { Card, Heading, Empty, Disclaimer } from "../../components/UI";
export default function QuestionnaireReport() {
  const t = useT();
  const { questions, categories, frequency } = getContent(t);
  const s = service.questionnaire();
  if (!s.completedAt)
    return (
      <Empty
        title={t("Пока нет завершённой анкеты")}
        text={t(
          "Ответьте на десять вопросов, чтобы получить описательный отчёт.",
        )}
        to="/questionnaire"
        label={t("Открыть анкету")}
      />
    );
  const data = categories.map((name, i) => ({
    name: [
      t("Взаимодействие"),
      t("Коммуникация"),
      t("Гибкость"),
      t("Сенсорика"),
      t("Инструкции"),
    ][i],
    ...Object.fromEntries(
      frequency.map((label, value) => [
        label,
        questions.filter((q) => q.category === i && s.answers[q.id] === value)
          .length,
      ]),
    ),
  }));
  return (
    <>
      <Heading
        eyebrow={t("АНКЕТА ПЕДАГОГА · ДЕМОНСТРАЦИОННЫЙ ОТЧЁТ")}
        title={t("Повседневность в деталях")}
        description={t("10 ответов · {0} · иллюстративная анкета", {
          "0": new Date(s.completedAt).toLocaleString(localeTag()),
        })}
        action={
          <button
            className="button secondary print-hide"
            onClick={() => window.print()}
          >
            <Printer size={18} />
            {t("Печать / PDF")}
          </button>
        }
      />
      <Card>
        <h2>{t("Распределение ответов по областям")}</h2>
        <p className="muted">
          {t(
            "Количество выбранных вариантов, а не оценка навыка или риска. В каждой области два вопроса.",
          )}
        </p>
        <div className="chart tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" domain={[0, 2]} ticks={[0, 1, 2]} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {frequency.map((label, i) => (
                <Bar
                  key={label}
                  dataKey={label}
                  stackId="a"
                  fill={
                    ["#b8c7dd", "#8daeea", "#5a8ae4", "#53b7ac", "#e7c083"][i]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="observation-grid">
        {categories.map((c, i) => {
          const items = questions.filter((q) => q.category === i);
          return (
            <Card key={c}>
              <span className="area-number">0{i + 1}</span>
              <h3>{c}</h3>
              <p>
                {items
                  .map((q) =>
                    t("Вопрос {0}: «{1}»", {
                      "0": Number(q.id) + 1,
                      "1": frequency[s.answers[q.id]],
                    }),
                  )
                  .join(". ")}
                .
              </p>
              <small>
                {items.some((q) => s.answers[q.id] === 4)
                  ? t(
                      "Для обсуждения: в каких ситуациях можно дополнить наблюдения?",
                    )
                  : t(
                      "Для обсуждения: меняется ли поведение в другой обстановке или при поддержке взрослого?",
                    )}
              </small>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2>{t("Полная анкета")}</h2>
        {questions.map((q) => (
          <div className="report-answer" key={q.id}>
            <p>
              {Number(q.id) + 1}. {q.text}
            </p>
            <span className="pill">{frequency[s.answers[q.id]]}</span>
          </div>
        ))}
        <p className="small-note">
          {t(
            "Сводка построена прямым подсчётом ответов. Частота отдельных действий сама по себе не указывает на наличие или отсутствие РАС.",
          )}
        </p>
      </Card>
      <Disclaimer />
    </>
  );
}
