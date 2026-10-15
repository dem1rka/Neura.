import { useT, localeTag } from "../../i18n";
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
import { getContent } from "../../data/content";
import { Card, Heading, Empty, Disclaimer } from "../../components/UI";
export default function GameReport() {
  const t = useT();
  const { situations, areas } = getContent(t);
  const s = service.game();
  if (!s?.completedAt)
    return (
      <Empty
        title={t("Отчёт появится после приключения")}
        text={t(
          "Пройдите восемь игровых ситуаций, чтобы увидеть записанные наблюдения.",
        )}
        to="/game"
        label={t("Перейти к игре")}
      />
    );
  const totals = summarize(s);
  return (
    <>
      <Heading
        eyebrow={t("ИГРОВОЕ НАБЛЮДЕНИЕ · ОТЧЁТ")}
        title={t("Маленькие действия. Больше контекста.")}
        description={t("Сессия {0} · {1} · завершены 8 из 8 ситуаций", {
          "0": s.id.slice(0, 8),
          "1": new Date(s.completedAt).toLocaleString(localeTag()),
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
      <div className="stats-grid">
        {[
          [t("Ситуаций"), "8 / 8"],
          [t("Время ответов"), t("{0} сек.", { "0": totals.seconds })],
          [t("Изменений выбора"), totals.changes],
          [t("Повторений инструкции"), totals.help],
        ].map(([label, value]) => (
          <Card className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>
      <Card>
        <h2>{t("Время ответа по ситуациям")}</h2>
        <p className="muted">
          {t(
            "Секунды до перехода к следующему шагу, включая повторения и паузы.",
          )}
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
              <Tooltip
                formatter={(v) => [
                  t("{0} сек.", { "0": String(v) }),
                  t("Время"),
                ]}
              />
              <Bar dataKey="seconds" fill="#6a96ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="section-line">
        <h2>{t("Пять областей наблюдения")}</h2>
        <span>{t("Без рейтингов и диагностических баллов")}</span>
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
                {t("Ситуаций:")} {answers.length}
                {t(". Изменений выбора:")} {changes}
                {t(". Повторений инструкции:")} {help}.
              </p>
              <small>
                {help
                  ? t(
                      "Инструкция была повторена. Обсудите, какая поддержка оказалась удобной.",
                    )
                  : t(
                      "Повтор инструкции не запрашивался. Это не определяет уровень навыка.",
                    )}
              </small>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2>{t("Ответы и контекст")}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Ситуация")}</th>
                <th>{t("Выбранный ответ")}</th>
                <th>{t("Время")}</th>
                <th>{t("Изменения")}</th>
                <th>{t("Повторы")}</th>
              </tr>
            </thead>
            <tbody>
              {s.answers.map((a) => (
                <tr key={a.situationId}>
                  <td>{situations[a.situationId].title}</td>
                  <td>{situations[a.situationId].options[a.choice]}</td>
                  <td>
                    {a.seconds} {t("с")}
                  </td>
                  <td>{a.changes}</td>
                  <td>{a.help}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-note">
          {t(
            "Метод: прямой подсчёт событий интерфейса. Выбор ответа не оценивается как правильный или неправильный. Время может включать перерывы и не является показателем способностей.",
          )}
        </p>
      </Card>
      <Disclaimer />
      <Link className="text-link print-hide" to="/questionnaire">
        {t("Дополнить наблюдение анкетой педагога")}
        <ArrowRight size={18} />
      </Link>
    </>
  );
}
