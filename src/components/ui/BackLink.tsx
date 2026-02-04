import Link from 'next/link';

export interface BackLinkProps {
  href: string;
  children?: React.ReactNode;
}

export default function BackLink({ href, children = 'Back' }: BackLinkProps) {
  const linkStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    marginBottom: 'var(--space-4)',
    fontSize: 'var(--font-size-caption)',
    color: 'var(--color-text-muted)',
  };

  return (
    <Link href={href} style={linkStyles}>
      ← {children}
    </Link>
  );
}
