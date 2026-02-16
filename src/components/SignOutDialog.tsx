'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { Button } from '@/components/ui';
import Drawer from '@/components/ui/Drawer';

interface SignOutDialogProps {
  /** The signed-in user's email, or null if not signed in. */
  userEmail: string | null | undefined;
  /** Called after a successful sign-out (before page redirect). */
  onSignedOut?: () => void;
}

/**
 * Renders the user section in a page header:
 * - When signed in: a button showing the user's email that opens a sign-out confirmation drawer.
 * - When signed out: a "Sign in" link.
 *
 * Encapsulates all sign-out state, the async handler, the trigger button, and the Drawer.
 */
export default function SignOutDialog({ userEmail, onSignedOut }: SignOutDialogProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await fetch('/auth/signout', { method: 'POST' });
    onSignedOut?.();
    router.push('/');
    router.refresh();
  };

  if (!userEmail) {
    return (
      <Link
        href="/auth/signin"
        data-testid="sign-in-link"
        className="flex items-center gap-1 text-xs text-primary-foreground hover:text-primary-foreground"
      >
        <User className="w-4 h-4" />
        <span>Sign in</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        data-testid="user-menu-btn"
        onClick={() => setDrawerOpen(true)}
        disabled={loading}
        className="text-xs text-primary-foreground hover:text-primary-foreground"
      >
        {loading ? 'Signing out…' : userEmail}
      </button>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Sign out"
      >
        <p
          className="text-base text-muted-foreground mb-6"
          data-testid="signout-confirmation-text"
        >
          Are you sure you want to sign out?
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDrawerOpen(false)}
            data-testid="signout-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            onClick={handleSignOut}
            data-testid="signout-confirm-btn"
          >
            {loading ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </Drawer>
    </>
  );
}
