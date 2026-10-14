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
import { brand } from "../data/content";
import { Badge } from "../components/UI";
const nav = [
  ["/dashboard", "Обзор", LayoutDashboard],
  ["/game", "Приключение Айко", Gamepad2],
  ["/questionnaire", "Анкета педагога", ClipboardList],
  ["/mri", "Анализ МРТ", ScanLine],
  ["/about", "О проекте", Info],
] as const;
export function Logo() {
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
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (open ? "is-open" : "")}>
        <Logo />
        <div className="workspace-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
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
            <span className="tiny-label">PIZZA PITCH · 2026</span>
            <h3>
              Большая забота.
              <br />
              Маленькие шаги.
            </h3>
            <Link to="/about">
              Познакомиться с проектом <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="profile">
            <span>ДС</span>
            <div>
              <strong>Демо-специалист</strong>
              <small>Исследовательский доступ</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Меню"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <div className="breadcrumbs">
            Платформа <ChevronRight size={14} />
            <strong>
              {nav.find(([path]) => pathname.startsWith(path))?.[1] || "Отчёт"}
            </strong>
          </div>
          <Badge>Демонстрационные данные</Badge>
          <span className="avatar">ДС</span>
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
        <footer className="app-footer">
          © 2026 {brand.name}. Ранний прототип.
          <span>Создано, чтобы замечать больше</span>
        </footer>
      </div>
    </div>
  );
}
