import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent-gradient text-white shadow-soft hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:bg-none disabled:bg-[#9DC7F0] disabled:shadow-none",
  secondary:
    "bg-white text-ink border border-black/10 hover:border-black/20 hover:bg-black/[0.03] active:scale-[0.98] disabled:opacity-50",
  ghost: "bg-transparent text-accent hover:bg-accent/10 active:scale-[0.98] disabled:opacity-40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium",
        "transition-all duration-200 ease-out disabled:cursor-not-allowed",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
