export interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
  label?: string;
  colorVar?: string;
}

export default function ProgressBar({ value, max, showLabel = false, label, colorVar }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div
        className="h-3 rounded-full overflow-hidden border"
        style={{ borderColor: colorVar ?? 'var(--primary)', backgroundColor: 'transparent' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${percentage}%`, backgroundColor: colorVar ?? 'var(--primary)' }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${value} of ${max}`}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-muted-foreground text-right">
          {value} / {max}
        </div>
      )}
    </div>
  );
}
