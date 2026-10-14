import { Link } from "react-router-dom";
import { Printer, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { service, summarize } from "../../services/storage";
import { situations, areas } from "../../data/content";
import { Card, Heading, Empty, Disclaimer } from "../../components/UI";
export default function GameReport() {
  const s = service.game();
  if (!s?.completedAt)
    return (
      <Empty
        title="Отчёт появится после приключения"
        text="Пройдите восемь игровых ситуаций, чтобы увидеть записанные наблюдения."
        to="/game"
        label="Перейти к игре"
      />
    );
  const totals = summarize(s);
  return (
    <>
      <Heading
        eyebrow="ИГРОВОЕ НАБЛЮДЕНИЕ · ОТЧЁТ"
        title="Маленькие действия. Больше контекста."
        description={`Сессия ${s.id.slice(0, 8)} · ${new Date(s.completedAt).toLocaleString("ru-RU")} · завершены 8 из 8 ситуаций`}
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
      <div className="stats-grid">
        {[
          ["Ситуаций", "8 / 8"],
          ["Время ответов", `${totals.seconds} сек.`],
          ["Изменений выбора", totals.changes],
          ["Повторений инструкции", totals.help],
        ].map(([label, value]) => (
          <Card className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>
      <Card>
        <h2>Время ответа по ситуациям</h2>
        <p className="muted">
          Секунды до перехода к следующему шагу, включая повторения и паузы.
        </p>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={s.answers.map((a) => ({
                name: String(a.situationId + 1),
                seconds: a.seconds,
              }))}
            >
              <CartesianGrid vertical={false} stroke="#edf1f5" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => [`${v} сек.`, "Время"]} />
              <Bar dataKey="seconds" fill="#6a96ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="section-line">
        <h2>Пять областей наблюдения</h2>
        <span>Без рейтингов и диагностических баллов</span>
      </div>
      <div className="observation-grid">
        {areas.map((area, i) => {
          const answers = s.answers.filter(
            (a) => situations[a.situationId].area === i,
          );
          const changes = answers.reduce((n, a) => n + a.changes, 0),
            help = answers.reduce((n, a) => n + a.help, 0);
          return (
            <Card key={area}>
              <span className="area-number">0{i + 1}</span>
              <h3>{area}</h3>
              <p>
                Ситуаций: {answers.length}. Изменений выбора: {changes}.
                Повторений инструкции: {help}.
              </p>
              <small>
                {help
                  ? "Инструкция была повторена. Обсудите, какая поддержка оказалась удобной."
                  : "Повтор инструкции не запрашивался. Это не определяет уровень навыка."}
              </small>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2>Ответы и контекст</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ситуация</th>
                <th>Выбранный ответ</th>
                <th>Время</th>
                <th>Изменения</th>
                <th>Повторы</th>
              </tr>
            </thead>
            <tbody>
              {s.answers.map((a) => (
                <tr key={a.situationId}>
                  <td>{situations[a.situationId].title}</td>
                  <td>{situations[a.situationId].options[a.choice]}</td>
                  <td>{a.seconds} с</td>
                  <td>{a.changes}</td>
                  <td>{a.help}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-note">
          Метод: прямой подсчёт событий интерфейса. Выбор ответа не оценивается
          как правильный или неправильный. Время может включать перерывы и не
          является показателем способностей.
        </p>
      </Card>
      <Disclaimer />
      <Link className="text-link print-hide" to="/questionnaire">
        Дополнить наблюдение анкетой педагога
        <ArrowRight size={18} />
      </Link>
    </>
  );
}
