'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface BackLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export default function BackLink({ href, children = 'Back' }: BackLinkProps) {
  const router = useRouter();

  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    marginBottom: 'var(--space-4)',
    fontSize: 'var(--font-size-caption)',
    color: 'var(--color-text-muted)',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };

  if (href) {
    return (
      <Link href={href} style={styles}>
        ← {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} style={styles}>
      ← {children}
    </button>
  );
}
