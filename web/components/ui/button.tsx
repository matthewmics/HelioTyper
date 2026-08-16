import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** Exported separately so `<Link>` can wear the same styles without a Slot polyfill. */
export const buttonStyles = cva(
  "focus-ring inline-flex items-center gap-2 font-display font-bold uppercase tracking-[0.05em] transition-[filter,background-color,box-shadow,transform] duration-150 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-[#04202a] shadow-[0_4px_18px_rgba(79,216,255,0.28)] hover:brightness-110 hover:shadow-[0_6px_24px_rgba(79,216,255,0.4)]",
        ghost: "border border-line-hi bg-panel-hi text-ink hover:bg-line",
      },
      size: {
        md: "rounded-lg px-6 py-3.5 text-base",
        sm: "rounded-md px-4 py-2.5 text-xs",
      },
      block: {
        true: "w-full justify-center",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonStyles>;

export function Button({
  className,
  variant,
  size,
  block,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    />
  );
}
