import type { ReactNode } from "react";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="badge">
      <span />
      {children}
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Disclaimer() {
  return (
    <div className="disclaimer">
      <ShieldCheck size={20} />
      <p>
        <strong>Внимательное наблюдение. Ответственная интерпретация.</strong>{" "}
        Прототип помогает структурировать наблюдения и не ставит диагноз. Все
        AI-результаты симулированы. Интерпретация требует участия специалиста.
      </p>
    </div>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"card " + className}>{children}</section>;
}
export function Empty({
  title,
  text,
  to,
  label,
}: {
  title: string;
  text: string;
  to: string;
  label: string;
}) {
  return (
    <Card className="empty">
      <Sparkles size={36} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" to={to}>
        {label}
        <ArrowUpRight size={18} />
      </Link>
    </Card>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Прогресс"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: value + "%" }} />
    </div>
  );
}
