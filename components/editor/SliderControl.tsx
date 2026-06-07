"use client";

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  // Optional formatter for the displayed value (e.g. "18px", "1.4").
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: SliderControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[13px] font-medium text-th-editor-muted">{label}</label>
        <span className="text-xs font-semibold tabular-nums text-th-amber">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="editor-range"
      />
    </div>
  );
}
