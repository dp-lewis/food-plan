import { type ReactNode } from 'react';

export interface MetaChipProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export default function MetaChip({ label, value, icon }: MetaChipProps) {
  return (
    <div className="px-3 py-2 rounded-md bg-muted">
      <span className="block text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-base font-normal text-foreground">
        {icon && <span className="w-4 h-4 text-muted-foreground">{icon}</span>}
        {value}
      </span>
    </div>
  );
}
