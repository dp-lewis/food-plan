export interface MetaChipProps {
  label: string;
  value: string | number;
}

export default function MetaChip({ label, value }: MetaChipProps) {
  return (
    <div className="px-3 py-2 rounded-md bg-muted" aria-label={`${label}: ${value}`}>
      <span className="block text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  );
}
