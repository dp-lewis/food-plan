export interface MetaChipProps {
  label: string;
  value: string | number;
}

export default function MetaChip({ label, value }: MetaChipProps) {
  const containerStyles = {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-bg-tertiary)',
  };

  const labelStyles = {
    display: 'block',
    fontSize: 'var(--font-size-caption)',
    color: 'var(--color-text-muted)',
  };

  const valueStyles = {
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-bold)' as const,
    color: 'var(--color-text-primary)',
  };

  return (
    <div style={containerStyles} aria-label={`${label}: ${value}`}>
      <span style={labelStyles}>{label}</span>
      <span style={valueStyles}>{value}</span>
    </div>
  );
}
