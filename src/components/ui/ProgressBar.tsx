export type ProgressBarVariant = 'default' | 'inverted' | 'shopping';

const variantClasses: Record<ProgressBarVariant, { fill: string; border: string }> = {
  default: { fill: 'bg-primary', border: 'border-primary' },
  inverted: { fill: 'bg-primary-foreground', border: 'border-primary-foreground' },
  shopping: { fill: 'bg-[var(--progress-shopping)]', border: 'border-[var(--progress-shopping)]' },
};

export interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
  label?: string;
  variant?: ProgressBarVariant;
}

export default function ProgressBar({ value, max, showLabel = false, label, variant = 'default' }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const classes = variantClasses[variant];

  return (
    <div className="w-full">
      <div className={`h-3 rounded-full overflow-hidden border ${classes.border}`}>
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${classes.fill}`}
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
