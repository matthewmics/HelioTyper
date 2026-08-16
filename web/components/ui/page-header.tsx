export type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <p className="mb-2 font-display text-2xs font-semibold uppercase tracking-[0.2em] text-accent">
        {eyebrow}
      </p>
      <h1 className="mb-1.5 font-display text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-ink-dim">{subtitle}</p>}
    </header>
  );
}
