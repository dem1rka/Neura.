import { useT, localeTag } from "../i18n";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Gamepad2,
  ClipboardList,
  ScanLine,
  Layers,
  Clock,
  CheckCircle2,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, Heading, Disclaimer } from "../components/UI";
import { Scene } from "../components/Scene";
import { service } from "../services/storage";
import { getContent } from "../data/content";
import type { Observation } from "../types";
export default function Dashboard() {
  const t = useT();
  const { demoActivity } = getContent(t);
  const chart = [
    { day: t("Пн"), game: 2, form: 1 },
    { day: t("Вт"), game: 4, form: 2 },
    { day: t("Ср"), game: 3, form: 2 },
    { day: t("Чт"), game: 6, form: 3 },
    { day: t("Пт"), game: 5, form: 4 },
    { day: t("Сб"), game: 8, form: 5 },
    { day: t("Вс"), game: 7, form: 4 },
  ];
  const [data, setData] = useState<Awaited<
    ReturnType<typeof service.overview>
  > | null>(null);
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("week");
  useEffect(() => {
    let active = true;
    service.overview().then((v) => active && setData(v));
    return () => {
      active = false;
    };
  }, []);
  if (!data)
    return (
      <div className="loading" role="status">
        {t("Загружаем пространство наблюдений…")}
      </div>
    );
  const g = Number(!!data.game?.completedAt),
    q = Number(!!data.questionnaire.completedAt),
    m = data.mri.filter((entry) => !entry.simulated).length;
  const local: Observation[] = [
    ...(g
      ? [
          {
            id: "local-game",
            title: t("Ваше игровое наблюдение"),
            kind: "game" as const,
            date: data.game!.completedAt!,
            demo: false,
          },
        ]
      : []),
    ...(q
      ? [
          {
            id: "local-q",
            title: t("Ваша анкета педагога"),
            kind: "questionnaire" as const,
            date: data.questionnaire.completedAt!,
            demo: false,
          },
        ]
      : []),
    ...data.mri.map((v) => ({
      id: v.id,
      title: v.simulated
        ? t("Локальная симуляция МРТ")
        : v.source === "example"
          ? t("Просмотр демонстрационного МРТ")
          : t("Локальный просмотр МРТ"),
      kind: "mri" as const,
      date: v.completedAt,
      demo: false,
      simulated: v.simulated,
    })),
  ];
  const activity: Observation[] = [
    ...local.sort((a, b) => b.date.localeCompare(a.date)),
    ...demoActivity,
  ].filter((a) => filter === "all" || a.kind === filter);
  return (
    <>
      <Heading
        eyebrow={t("ОБЗОР ПЛАТФОРМЫ")}
        title={t("Замечать больше. Понимать лучше.")}
        description={t(
          "Все инструменты наблюдения — в одном спокойном пространстве.",
        )}
        action={
          <Link className="button" to="/game">
            <Plus size={18} />
            {t("Новое наблюдение")}
          </Link>
        }
      />
      <div className="welcome-banner">
        <div>
          <span className="pill">{t("ОТ НАБЛЮДЕНИЯ К ПОНИМАНИЮ")}</span>
          <h2>
            {t("У каждого ребёнка")}
            <br />
            {t("свой способ открывать мир.")}
          </h2>
          <p>
            {t("Соединяем игру, опыт педагога и исследовательские")}
            <br className="desktop" />
            {t("инструменты для более целостного взгляда.")}
          </p>
          <Link to="/about">
            {t("Как работает Neura")}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-art">
          <Scene compact />
          <span className="art-note">
            <span className="status-dot" />
            {t("Привет! Я Айко")}
          </span>
        </div>
      </div>
      <div className="stats-grid">
        {[
          {
            label: t("Всего наблюдений"),
            value: 0 + g + q + m,
            icon: Layers,
            tone: "blue",
            note: t("Объединяя разные перспективы"),
          },
          {
            label: t("Игровых сессий"),
            value: 0 + g,
            icon: Gamepad2,
            tone: "purple",
            note: t("8 ситуаций в каждой игре"),
          },
          {
            label: t("Анкет педагогов"),
            value: 0 + q,
            icon: ClipboardList,
            tone: "teal",
            note: t("Опыт ежедневного общения"),
          },
          {
            label: t("Просмотров МРТ"),
            value: 0 + m,
            icon: ScanLine,
            tone: "orange",
            note: t("Исследовательский модуль"),
          },
        ].map(({ label, value, icon: Icon, tone, note }) => (
          <Card key={label} className="stat">
            <div className="stat-top">
              <span>{label}</span>
              <div className={"icon-tile " + tone}>
                <Icon size={20} />
              </div>
            </div>
            <strong>{value.toString().padStart(2, "0")}</strong>
            <small>{note}</small>
          </Card>
        ))}
      </div>
      <div className="section-line">
        <h2>{t("Три инструмента. Одна картина.")}</h2>
        <span>{t("Выберите, с чего начать")}</span>
      </div>
      <div className="modules-grid">
        {[
          {
            title: t("Приключение Айко"),
            label: t("ИГРОВОЕ НАБЛЮДЕНИЕ"),
            text: t(
              "Знакомые ситуации, маленькие открытия и бережное наблюдение в игре.",
            ),
            to: "/game",
            icon: Gamepad2,
            tone: "blue",
            foot: t("7–8 лет · 10–15 минут"),
          },
          {
            title: t("Взгляд педагога"),
            label: t("АНКЕТИРОВАНИЕ"),
            text: t(
              "Структурируйте наблюдения за общением, гибкостью и повседневным поведением.",
            ),
            to: "/questionnaire",
            icon: ClipboardList,
            tone: "teal",
            foot: t("10 вопросов · около 5 минут"),
          },
          {
            title: t("Исследовать глубже"),
            label: t("МРТ · ИССЛЕДОВАНИЕ"),
            text: t(
              "Открывайте NIfTI-снимки, изучайте срезы и объём, сопоставляйте данные ABIDE.",
            ),
            to: "/mri",
            icon: ScanLine,
            tone: "purple",
            foot: t("2D и 3D · локальные файлы"),
          },
        ].map(({ title, label, text, to, icon: Icon, tone, foot }) => (
          <Link className="card module" to={to} key={to}>
            <div className="module-top">
              <div className={"icon-tile " + tone}>
                <Icon size={24} />
              </div>
              <ArrowUpRight size={20} />
            </div>
            <div className="tiny-label">{label}</div>
            <h3>{title}</h3>
            <p>{text}</p>
            <div className="module-foot">
              {foot}
              <ArrowRight size={17} />
            </div>
          </Link>
        ))}
      </div>
      <div className="dashboard-bottom">
        <Card>
          <div className="section-line">
            <div>
              <h2>{t("Ритм наблюдений")}</h2>
              <p className="muted">{t("Вымышленный пример активности")}</p>
            </div>
            <select
              aria-label={t("Период графика")}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="week">{t("Эта неделя")}</option>
              <option value="month">{t("4 недели")}</option>
            </select>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              {t("Игровые сессии")}
            </span>
            <span>
              <i />
              {t("Анкеты")}
            </span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  period === "week"
                    ? chart
                    : [
                        { day: t("1 нед."), game: 4, form: 2 },
                        { day: t("2 нед."), game: 8, form: 5 },
                        { day: t("3 нед."), game: 6, form: 3 },
                        { day: t("4 нед."), game: 14, form: 8 },
                      ]
                }
              >
                <defs>
                  <linearGradient id="blue-chart" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#5b8def" stopOpacity={0.2} />
                    <stop offset="1" stopColor="#5b8def" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf1f5" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#8491a5" }}
                />
                <YAxis
                  width={25}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#8491a5" }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="game"
                  name={t("Игровые сессии")}
                  stroke="#4c80eb"
                  strokeWidth={3}
                  fill="url(#blue-chart)"
                />
                <Area
                  type="monotone"
                  dataKey="form"
                  name={t("Анкеты")}
                  stroke="#50b8ac"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="section-line">
            <h2>{t("Последние события")}</h2>
            <Clock size={18} />
          </div>
          <select
            className="activity-filter"
            aria-label={t("Фильтр событий")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t("Все модули")}</option>
            <option value="game">{t("Игры")}</option>
            <option value="questionnaire">{t("Анкеты")}</option>
            <option value="mri">{t("МРТ")}</option>
          </select>
          <div className="activity-list">
            {activity.slice(0, 4).map((a) => (
              <Link
                to={
                  a.demo
                    ? `/${a.kind === "questionnaire" ? "questionnaire" : a.kind === "game" ? "game" : "mri"}`
                    : a.kind === "mri"
                      ? "/mri"
                      : `/${a.kind}/report`
                }
                key={a.id}
              >
                <span className="activity-icon">
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <small>
                    {a.demo
                      ? t("Вымышленный пример")
                      : new Date(a.date).toLocaleDateString(localeTag())}{" "}
                    ·{" "}
                    {a.kind === "mri"
                      ? a.simulated || a.demo
                        ? t("Симуляция")
                        : t("Просмотрено")
                      : t("Завершено")}
                  </small>
                </div>
                <Chevron />
              </Link>
            ))}
          </div>
          <p className="small-note">
            {t(
              "24 исходных записи — вымышленный набор. Ваши завершённые действия добавляются к нему.",
            )}
          </p>
        </Card>
      </div>
      <Disclaimer />
    </>
  );
}
function Chevron() {
  const t = useT();
  const { demoActivity } = getContent(t);
  return <ArrowUpRight size={16} className="muted" />;
}
