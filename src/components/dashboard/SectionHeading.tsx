export default function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <span className="bg-card px-4 text-xl font-normal text-foreground whitespace-nowrap font-display">
        {children}
      </span>
    </div>
  );
}
