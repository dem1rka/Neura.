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
import { questions, categories, frequency } from "../../data/content";
import { service } from "../../services/storage";
import { Card, Heading, Empty, Disclaimer } from "../../components/UI";
export default function QuestionnaireReport() {
  const s = service.questionnaire();
  if (!s.completedAt)
    return (
      <Empty
        title="Пока нет завершённой анкеты"
        text="Ответьте на десять вопросов, чтобы получить описательный отчёт."
        to="/questionnaire"
        label="Открыть анкету"
      />
    );
  const data = categories.map((name, i) => ({
    name: [
      "Взаимодействие",
      "Коммуникация",
      "Гибкость",
      "Сенсорика",
      "Инструкции",
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
        eyebrow="АНКЕТА ПЕДАГОГА · ДЕМОНСТРАЦИОННЫЙ ОТЧЁТ"
        title="Повседневность в деталях"
        description={`10 ответов · ${new Date(s.completedAt).toLocaleString("ru-RU")} · иллюстративная анкета`}
        action={
          <button
            className="button secondary print-hide"
            onClick={() => window.print()}
          >
            <Printer size={18} />
            Печать / PDF
          </button>
        }
      />
      <Card>
        <h2>Распределение ответов по областям</h2>
        <p className="muted">
          Количество выбранных вариантов, а не оценка навыка или риска. В каждой
          области два вопроса.
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
                  .map(
                    (q) =>
                      `Вопрос ${Number(q.id) + 1}: «${frequency[s.answers[q.id]]}»`,
                  )
                  .join(". ")}
                .
              </p>
              <small>
                {items.some((q) => s.answers[q.id] === 4)
                  ? "Для обсуждения: в каких ситуациях можно дополнить наблюдения?"
                  : "Для обсуждения: меняется ли поведение в другой обстановке или при поддержке взрослого?"}
              </small>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2>Полная анкета</h2>
        {questions.map((q) => (
          <div className="report-answer" key={q.id}>
            <p>
              {Number(q.id) + 1}. {q.text}
            </p>
            <span className="pill">{frequency[s.answers[q.id]]}</span>
          </div>
        ))}
        <p className="small-note">
          Сводка построена прямым подсчётом ответов. Частота отдельных действий
          сама по себе не указывает на наличие или отсутствие РАС.
        </p>
      </Card>
      <Disclaimer />
    </>
  );
}
