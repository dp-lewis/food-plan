'use client';

import { useEffect, useState } from 'react';

type LoadingScreenProps = {
  visible: boolean;
};

export function LoadingScreen({ visible }: LoadingScreenProps) {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      // Unmount after the fade-out transition completes
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: '#f4ece6',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 300ms ease-out',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/loading-screen.png"
        alt=""
        aria-hidden="true"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}
