export interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
}

export default function ProgressBar({ value, max, showLabel = false }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const containerStyles = {
    width: '100%',
  };

  const trackStyles = {
    height: '0.5rem',
    borderRadius: '9999px',
    backgroundColor: 'var(--color-bg-tertiary)',
    overflow: 'hidden',
  };

  const barStyles = {
    height: '100%',
    borderRadius: '9999px',
    backgroundColor: 'var(--color-accent)',
    width: `${percentage}%`,
    transition: 'width 0.3s ease',
  };

  const labelStyles = {
    marginTop: 'var(--space-1)',
    fontSize: 'var(--font-size-caption)',
    color: 'var(--color-text-muted)',
    textAlign: 'right' as const,
  };

  return (
    <div style={containerStyles}>
      <div style={trackStyles}>
        <div style={barStyles} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} />
      </div>
      {showLabel && (
        <div style={labelStyles}>
          {value} / {max}
        </div>
      )}
    </div>
  );
}
