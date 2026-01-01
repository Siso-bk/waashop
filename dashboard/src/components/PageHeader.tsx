type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  tone?: "default" | "light";
};

export function PageHeader({ eyebrow, title, description, actions, align = "left", className, tone = "default" }: Props) {
  const alignment = align === "center" ? "text-center sm:text-left" : "";
  const accentColor = tone === "light" ? "text-white/60" : "text-indigo-600";
  const titleColor = tone === "light" ? "text-white" : "text-slate-900";
  const descriptionColor = tone === "light" ? "text-white/80" : "text-slate-500";
  return (
    <header
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${alignment} ${
        className || ""
      }`.trim()}
    >
      <div className="space-y-1">
        {eyebrow && (
          <p className={`text-xs uppercase tracking-[0.3em] ${accentColor}`}>
            {eyebrow}
          </p>
        )}
        <h1 className={`text-3xl font-semibold ${titleColor}`}>{title}</h1>
        {description && <p className={`text-sm ${descriptionColor}`}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
