import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-apple border border-black/[0.06] bg-white p-6 shadow-card sm:p-8",
        className,
      )}
      {...props}
    />
  );
}
