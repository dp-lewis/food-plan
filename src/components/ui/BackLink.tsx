'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface BackLinkProps {
  href?: string;
  children?: React.ReactNode;
}

const classes = 'inline-flex items-center gap-1 mb-4 text-sm text-muted-foreground';

export default function BackLink({ href, children = 'Back' }: BackLinkProps) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={classes}>
        ← {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`${classes} bg-transparent border-none p-0 cursor-pointer`}
    >
      ← {children}
    </button>
  );
}
