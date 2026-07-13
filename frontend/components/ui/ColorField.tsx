interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorField({ id, label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-medium text-ink/80">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
          aria-label={label}
        />
        <span className="text-xs uppercase tabular-nums text-ink/50">{value}</span>
      </div>
    </div>
  );
}
