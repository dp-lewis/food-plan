'use client';

import { useEffect } from 'react';

/**
 * A standalone Next.js client component that dynamically generates identical-resolution
 * iOS splash screens using a hidden HTML Canvas, bypassing the need for generating
 * dozens of static image files.
 */
export function IOSDynamicSplashScreen() {
  useEffect(() => {
    // Only run on iOS devices
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (!isIOS) return;

    // Check if running in standalone mode (no need to inject if already installed)
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if we already injected it
    if (document.querySelector('link[rel="apple-touch-startup-image"][data-dynamic="true"]')) {
      return;
    }

    const generateSplashScreenDataUrl = (
      width: number,
      height: number,
      pixelRatio: number,
      iconUrl: string,
      backgroundColor: string
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const iconScreenRatio = 0.18; // Icon takes up 18% of the screen dimension
        
        // Calculate canvas dimensions
        const imageWidth = width * pixelRatio;
        const imageHeight = height * pixelRatio;
        
        // Calculate icon dimensions
        const iconSize = Math.floor(Math.max(imageWidth, imageHeight) * iconScreenRatio);
        const iconTop = Math.floor((imageHeight - iconSize) / 2);
        const iconLeft = Math.floor((imageWidth - iconSize) / 2);

        const img = new Image();
        img.crossOrigin = 'anonymous'; // Important for canvas toDataURL
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = imageWidth;
          canvas.height = imageHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return reject('No 2d context');

          // 1. Draw the background color
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, imageWidth, imageHeight);
          
          // 2. Setup clipping path for iOS squircle shape
          ctx.save();
          // Scale corner radius based on icon size (100px radius for ~400px icon is ~25%)
          const cornerRadius = iconSize * 0.22; 

          ctx.beginPath();
          ctx.moveTo(iconLeft + cornerRadius, iconTop);
          ctx.lineTo(iconLeft + iconSize - cornerRadius, iconTop);
          ctx.quadraticCurveTo(iconLeft + iconSize, iconTop, iconLeft + iconSize, iconTop + cornerRadius);
          ctx.lineTo(iconLeft + iconSize, iconTop + iconSize - cornerRadius);
          ctx.quadraticCurveTo(iconLeft + iconSize, iconTop + iconSize, iconLeft + iconSize - cornerRadius, iconTop + iconSize);
          ctx.lineTo(iconLeft + cornerRadius, iconTop + iconSize);
          ctx.quadraticCurveTo(iconLeft, iconTop + iconSize, iconLeft, iconTop + iconSize - cornerRadius);
          ctx.lineTo(iconLeft, iconTop + cornerRadius);
          ctx.quadraticCurveTo(iconLeft, iconTop, iconLeft + cornerRadius, iconTop);
          ctx.closePath();
          
          // Clip to squircle and draw image
          ctx.clip();
          ctx.drawImage(img, iconLeft, iconTop, iconSize, iconSize);
          ctx.restore();

          // 3. Export to base64
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        };
        
        img.onerror = reject;
        img.src = iconUrl;
      });
    };

    const injectAppleSplashScreen = async () => {
      try {
        const width = window.screen.width;
        const height = window.screen.height;
        const pixelRatio = window.devicePixelRatio || 1;

        // Ensure we handle both portrait and landscape orientation natively if needed,
        // though typically portrait is forced for PWAs unless specified in manifest
        const orientation = 'portrait';
        
        // Define your PWA setup values
        const iconUrl = '/icons/icon-512.png';
        const backgroundColor = '#5b806e'; // Match your layout.tsx theme color

        const dataUrl = await generateSplashScreenDataUrl(
          width,
          height,
          pixelRatio,
          iconUrl,
          backgroundColor
        );

        const mediaString = `screen and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${pixelRatio}) and (orientation: ${orientation})`;

        // Create and inject the meta tag
        const linkNode = document.createElement('link');
        linkNode.rel = 'apple-touch-startup-image';
        linkNode.media = mediaString;
        linkNode.href = dataUrl;
        linkNode.dataset.dynamic = 'true'; // Mark it so we don't duplicate
        
        document.head.appendChild(linkNode);
      } catch (err) {
        console.error('Failed to generate dynamic splash screen:', err);
      }
    };

    injectAppleSplashScreen();
  }, []);

  return null; // This component doesn't render anything to the DOM
}
