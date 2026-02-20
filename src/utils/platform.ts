// Platform utilities for Max Mini App

export type Platform = 'max';

export function getPlatform(): Platform {
  return 'max';
}

export function getWebApp() {
  return (window as any).WebApp || null;
}

// Initialize the Max web app (call once on app startup)
export function initWebApp() {
  const max = (window as any).WebApp;
  if (max) {
    max.ready?.();
    max.expand?.();
  }
}

// Haptic feedback
export function hapticSuccess() {
  const wa = getWebApp();
  wa?.HapticFeedback?.notificationOccurred?.('success');
}

export function hapticLight() {
  const wa = getWebApp();
  wa?.HapticFeedback?.impactOccurred?.('light');
}

// Open external link
export function openLink(url: string) {
  const wa = getWebApp();
  if (wa?.openLink) {
    wa.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}
