import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeStyles = cva(
  "inline-flex shrink-0 items-center rounded-full px-2 py-[3px] font-display text-2xs font-bold uppercase tracking-[0.09em]",
  {
    variants: {
      tone: {
        accent: "bg-accent/15 text-accent",
        success: "bg-success/15 text-success",
        gold: "bg-gold/15 text-gold",
        special: "bg-special/15 text-special",
        neutral: "bg-line/60 text-ink-dim",
      },
      solid: {
        true: "",
      },
    },
    compoundVariants: [
      { tone: "accent", solid: true, className: "bg-accent text-[#04202a]" },
    ],
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeStyles>;

export function Badge({ className, tone, solid, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ tone, solid }), className)} {...props} />
  );
}
