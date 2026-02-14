export interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({ value, max, showLabel = false, label }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
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
