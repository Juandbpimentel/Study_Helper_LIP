import React, { useEffect } from "react";

interface PageSizeSelectProps {
  value: number;
  onChange: (next: number) => void;
  options?: number[];
  ariaLabel?: string;
  className?: string;
}

export function PageSizeSelect({
  value,
  onChange,
  options = [10, 12, 20, 50, 100],
  ariaLabel = "Itens por página",
  className = "",
}: PageSizeSelectProps) {
  useEffect(() => {
    // no-op: kept for future extensibility (analytics etc.)
  }, [value]);

  return (
    <label
      className={`flex items-center text-sm text-slate-600 gap-2 ${className}`}
    >
      <span className="hidden sm:inline">{ariaLabel}</span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="ml-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        aria-label={ariaLabel}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
