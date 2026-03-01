'use client';

import { useEffect, useState } from 'react';

/**
 * An artificial DOM-based Splash Screen that perfectly mimics the generated iOS native 
 * startup image. By displaying this immediately on launch in PWA mode, and fading it 
 * out after a delay, it creates a seamless, deliberate app launch experience rather 
 * than immediately snapping to the app UI.
 */
export function PWASplashScreen() {
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check if the app is currently running in standalone PWA mode
    const isStandalone = 
      ('standalone' in window.navigator && (window.navigator as any).standalone === true) || 
      window.matchMedia('(display-mode: standalone)').matches;

    if (!isStandalone) {
      // If we are just in the regular browser, remove this immediately
      setVisible(false);
      return;
    }

    // Hold the splash screen for 1 second, then fade out
    const fadeTimer = setTimeout(() => setFading(true), 1000);
    
    // Completely unmount after the CSS fade transition completes
    const removeTimer = setTimeout(() => setVisible(false), 1500); 

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style suppressHydrationWarning>{`
        .pwa-splash {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #5b806e; /* Fallback matching theme color */  
          z-index: 9999999;
          display: none;
          transition: opacity 0.5s ease;
        }
        
        /* Visually show it instantly without JS delay if the browser is launching in standalone mode */
        @media (display-mode: standalone) {
          .pwa-splash {
            display: flex;
          }
        }
      `}</style>
      <div 
        className="pwa-splash"
        style={{ 
          opacity: fading ? 0 : 1, 
          pointerEvents: fading ? 'none' : 'auto' 
        }}
      />
    </>
  );
}
