import { useT, localeTag } from "../i18n";
import type { ReactNode } from "react";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
export function Badge({ children }: { children: ReactNode }) {
  const t = useT();
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
  const t = useT();
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
  const t = useT();
  return (
    <div className="disclaimer">
      <ShieldCheck size={20} />
      <p>
        <strong>
          {t("Внимательное наблюдение. Ответственная интерпретация.")}
        </strong>{" "}
        {t(
          "Прототип помогает структурировать наблюдения и не ставит диагноз. Все AI-результаты симулированы. Интерпретация требует участия специалиста.",
        )}
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
  const t = useT();
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
  const t = useT();
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
  const t = useT();
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={t("Прогресс")}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: value + "%" }} />
    </div>
  );
}
