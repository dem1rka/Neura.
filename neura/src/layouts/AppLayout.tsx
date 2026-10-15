import { PreferencesControls } from "../components/PreferencesControls";
import { useT, localeTag } from "../i18n";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Gamepad2,
  ClipboardList,
  ScanLine,
  Info,
  ArrowUpRight,
  ChevronRight,
  Command,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { getContent } from "../data/content";
import { Badge } from "../components/UI";
export function Logo() {
  const t = useT();
  const { brand } = getContent(t);
  return (
    <Link className="logo" to="/">
      <span className="logo-icon">
        <Command size={24} />
      </span>
      {brand.name}
      <span className="logo-dot">.</span>
    </Link>
  );
}
export default function AppLayout() {
  const t = useT();
  const { brand } = getContent(t);
  const nav = [
    ["/dashboard", t("Обзор"), LayoutDashboard],
    ["/game", t("Приключение Айко"), Gamepad2],
    ["/questionnaire", t("Анкета педагога"), ClipboardList],
    ["/mri", t("Анализ МРТ"), ScanLine],
    ["/about", t("О проекте"), Info],
  ] as const;
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (open ? "is-open" : "")}>
        <Logo />
        <div className="workspace-label">{t("РАБОЧЕЕ ПРОСТРАНСТВО")}</div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              key={to}
              to={to}
            >
              <Icon size={19} />
              {label}
              {to === "/mri" && <small>LAB</small>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="pitch-card">
            <span className="tiny-label"></span>
            <h3>
              {t("Большая забота.")}
              <br />
              {t("Маленькие шаги.")}
            </h3>
            <Link to="/about">
              {t("Познакомиться с проектом")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="profile">
            <span>{t("ДС")}</span>
            <div>
              <strong>{t("Демо-специалист")}</strong>
              <small>{t("Исследовательский доступ")}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label={t("Меню")}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <div className="breadcrumbs">
            {t("Платформа")}
            <ChevronRight size={14} />
            <strong>
              {nav.find(([path]) => pathname.startsWith(path))?.[1] ||
                t("Отчёт")}
            </strong>
          </div>
          <Badge>{t("Демонстрационные данные")}</Badge>
          <PreferencesControls />
          <span className="avatar">{t("ДС")}</span>
        </header>
        <main>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
