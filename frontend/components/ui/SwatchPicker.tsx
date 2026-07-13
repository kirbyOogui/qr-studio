interface SwatchOption {
  key: string;
  label: string;
  swatchCss: string;
}

interface SwatchPickerProps {
  options: SwatchOption[];
  value: string;
  onChange: (key: string) => void;
  ariaLabel: string;
  columns?: 3 | 4 | 6;
}

const COLUMN_CLASS: Record<NonNullable<SwatchPickerProps["columns"]>, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
};

export function SwatchPicker({ options, value, onChange, ariaLabel, columns = 4 }: SwatchPickerProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`grid ${COLUMN_CLASS[columns]} gap-2`}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.key)}
            className={`group flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all ${
              selected ? "border-accent bg-accent/5 shadow-soft" : "border-black/10 hover:border-accent/40 hover:bg-black/[0.02]"
            }`}
          >
            <span className="relative">
              <span
                aria-hidden
                className="block h-9 w-9 rounded-full border border-black/10 shadow-sm transition-transform duration-150 group-hover:scale-110"
                style={{ background: option.swatchCss }}
              />
              {selected && (
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white ring-2 ring-white"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1 4L3 6L7 1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </span>
            <span className="whitespace-nowrap text-[11px] font-medium text-ink/70">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
