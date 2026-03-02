export default function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center mb-4">
      <span className="text-xl font-normal text-foreground font-display">
        {children}
      </span>
    </div>
  );
}
