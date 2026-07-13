"use client";

import { useId, useState, type ReactNode } from "react";
import clsx from "clsx";

interface DisclosureProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Disclosure({ title, children, defaultOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="border-t border-black/5 pt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-[15px] font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {title}
        <span
          aria-hidden
          className={clsx("text-ink/40 transition-transform duration-200", open && "rotate-180")}
        >
          ⌄
        </span>
      </button>
      <div id={panelId} hidden={!open} className="animate-fade-in pt-4">
        {children}
      </div>
    </div>
  );
}
