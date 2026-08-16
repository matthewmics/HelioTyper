import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-panel p-5", className)}
      {...props}
    />
  );
}

/** The small all-caps heading that labels a card's contents. */
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "mb-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim",
        className,
      )}
      {...props}
    />
  );
}

/** Vertical rhythm for a column of cards. */
export function CardStack({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-5", className)} {...props} />;
}
