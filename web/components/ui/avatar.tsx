import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const GRADIENTS = [
  "linear-gradient(135deg,#4fd8ff,#a678ff)",
  "linear-gradient(135deg,#ffb84d,#ff4d84)",
  "linear-gradient(135deg,#4dffb4,#4fd8ff)",
  "linear-gradient(135deg,#a678ff,#ff4d84)",
  "linear-gradient(135deg,#ff8a4d,#ffb84d)",
  "linear-gradient(135deg,#4fd8ff,#4dffb4)",
];

/**
 * Pick a gradient from the pilot's name so the same pilot keeps the same colors
 * wherever they appear, independent of their position in any given list.
 */
function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % GRADIENTS.length;
  }
  return GRADIENTS[hash];
}

const avatarStyles = cva(
  "grid shrink-0 place-items-center font-display font-bold text-[#06121a]",
  {
    variants: {
      size: {
        sm: "size-[29px] rounded-lg text-xs",
        md: "size-8 rounded-lg text-sm",
        lg: "size-9 rounded-lg text-sm",
        xl: "size-[46px] rounded-xl text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type AvatarProps = React.ComponentProps<"div"> &
  VariantProps<typeof avatarStyles> & { name: string };

export function Avatar({ className, size, name, ...props }: AvatarProps) {
  return (
    <div
      className={cn(avatarStyles({ size }), className)}
      style={{ background: gradientFor(name) }}
      aria-hidden
      {...props}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
