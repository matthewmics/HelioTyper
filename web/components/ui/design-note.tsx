/**
 * Inline commentary carried over from the prototype. These call out decisions
 * that are still open, so they are content rather than chrome. Delete each one
 * as its decision gets locked in.
 */
export function DesignNote({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="mt-8 rounded-xl border border-special/30 bg-special/[0.07] px-4 py-3.5 text-xs leading-relaxed text-ink-dim">
      <b className="text-special">{title}</b> {children}
    </aside>
  );
}
