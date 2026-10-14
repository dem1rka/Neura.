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
import { demoActivity } from "../data/content";
import type { Observation } from "../types";
const chart = [
  { day: "Пн", game: 2, form: 1 },
  { day: "Вт", game: 4, form: 2 },
  { day: "Ср", game: 3, form: 2 },
  { day: "Чт", game: 6, form: 3 },
  { day: "Пт", game: 5, form: 4 },
  { day: "Сб", game: 8, form: 5 },
  { day: "Вс", game: 7, form: 4 },
];
export default function Dashboard() {
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
        Загружаем пространство наблюдений…
      </div>
    );
  const g = Number(!!data.game?.completedAt),
    q = Number(!!data.questionnaire.completedAt),
    m = data.mri.length;
  const local: Observation[] = [
    ...(g
      ? [
          {
            id: "local-game",
            title: "Ваше игровое наблюдение",
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
            title: "Ваша анкета педагога",
            kind: "questionnaire" as const,
            date: data.questionnaire.completedAt!,
            demo: false,
          },
        ]
      : []),
    ...data.mri.map((v) => ({
      id: v.id,
      title: "Локальная симуляция МРТ",
      kind: "mri" as const,
      date: v.completedAt,
      demo: false,
    })),
  ];
  const activity = [
    ...local.sort((a, b) => b.date.localeCompare(a.date)),
    ...demoActivity,
  ].filter((a) => filter === "all" || a.kind === filter);
  return (
    <>
      <Heading
        eyebrow="ОБЗОР ПЛАТФОРМЫ"
        title="Замечать больше. Понимать лучше."
        description="Все инструменты наблюдения — в одном спокойном пространстве."
        action={
          <Link className="button" to="/game">
            <Plus size={18} />
            Новое наблюдение
          </Link>
        }
      />
      <div className="welcome-banner">
        <div>
          <span className="pill">ОТ НАБЛЮДЕНИЯ К ПОНИМАНИЮ</span>
          <h2>
            У каждого ребёнка
            <br />
            свой способ открывать мир.
          </h2>
          <p>
            Соединяем игру, опыт педагога и исследовательские
            <br className="desktop" /> инструменты для более целостного взгляда.
          </p>
          <Link to="/about">
            Как работает Neura <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-art">
          <Scene compact />
          <span className="art-note">
            <span className="status-dot" /> Привет! Я Айко
          </span>
        </div>
      </div>
      <div className="stats-grid">
        {[
          {
            label: "Всего наблюдений",
            value: 0 + g + q + m,
            icon: Layers,
            tone: "blue",
            note: "Объединяя разные перспективы",
          },
          {
            label: "Игровых сессий",
            value: 0 + g,
            icon: Gamepad2,
            tone: "purple",
            note: "8 ситуаций в каждой игре",
          },
          {
            label: "Анкет педагогов",
            value: 0 + q,
            icon: ClipboardList,
            tone: "teal",
            note: "Опыт ежедневного общения",
          },
          {
            label: "МРТ-симуляций",
            value: 0 + m,
            icon: ScanLine,
            tone: "orange",
            note: "Исследовательский модуль",
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
        <h2>Три инструмента. Одна картина.</h2>
        <span>Выберите, с чего начать</span>
      </div>
      <div className="modules-grid">
        {[
          {
            title: "Приключение Айко",
            label: "ИГРОВОЕ НАБЛЮДЕНИЕ",
            text: "Знакомые ситуации, маленькие открытия и бережное наблюдение в игре.",
            to: "/game",
            icon: Gamepad2,
            tone: "blue",
            foot: "7–8 лет · 10–15 минут",
          },
          {
            title: "Взгляд педагога",
            label: "АНКЕТИРОВАНИЕ",
            text: "Структурируйте наблюдения за общением, гибкостью и повседневным поведением.",
            to: "/questionnaire",
            icon: ClipboardList,
            tone: "teal",
            foot: "10 вопросов · около 5 минут",
          },
          {
            title: "Исследовать глубже",
            label: "МРТ · ЭКСПЕРИМЕНТАЛЬНО",
            text: "Познакомьтесь с концепцией анализа МРТ в прозрачной симуляции процесса.",
            to: "/mri",
            icon: ScanLine,
            tone: "purple",
            foot: "Без анализа медицинских данных",
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
              <h2>Ритм наблюдений</h2>
              <p className="muted">Вымышленный пример активности</p>
            </div>
            <select
              aria-label="Период графика"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="week">Эта неделя</option>
              <option value="month">4 недели</option>
            </select>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Игровые сессии
            </span>
            <span>
              <i />
              Анкеты
            </span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={
                  period === "week"
                    ? chart
                    : [
                        { day: "1 нед.", game: 4, form: 2 },
                        { day: "2 нед.", game: 8, form: 5 },
                        { day: "3 нед.", game: 6, form: 3 },
                        { day: "4 нед.", game: 14, form: 8 },
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
                  name="Игровые сессии"
                  stroke="#4c80eb"
                  strokeWidth={3}
                  fill="url(#blue-chart)"
                />
                <Area
                  type="monotone"
                  dataKey="form"
                  name="Анкеты"
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
            <h2>Последние события</h2>
            <Clock size={18} />
          </div>
          <select
            className="activity-filter"
            aria-label="Фильтр событий"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Все модули</option>
            <option value="game">Игры</option>
            <option value="questionnaire">Анкеты</option>
            <option value="mri">МРТ</option>
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
                      ? "Вымышленный пример"
                      : new Date(a.date).toLocaleDateString("ru-RU")}{" "}
                    · {a.kind === "mri" ? "Симуляция" : "Завершено"}
                  </small>
                </div>
                <Chevron />
              </Link>
            ))}
          </div>
          <p className="small-note">
            24 исходных записи — вымышленный набор. Ваши завершённые действия
            добавляются к нему.
          </p>
        </Card>
      </div>
      <Disclaimer />
    </>
  );
}
function Chevron() {
  return <ArrowUpRight size={16} className="muted" />;
}
