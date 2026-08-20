import { useEffect, useState } from 'react';

const DESKTOP_BREAKPOINT = 1024; // matches Tailwind's `lg`

/**
 * Real physical viewport width, independent of the app's manual desktop/mobile
 * preview toggle — used to gate device-specific actions (e.g. Virtual calls
 * requiring a laptop, phone Calls requiring a handset) against what the user
 * is actually holding, not what they've set the preview to.
 */
export function useDeviceViewport(): 'mobile' | 'desktop' {
  const [kind, setKind] = useState<'mobile' | 'desktop'>(() =>
    typeof window !== 'undefined' && window.innerWidth < DESKTOP_BREAKPOINT ? 'mobile' : 'desktop',
  );

  useEffect(() => {
    const onResize = () => setKind(window.innerWidth < DESKTOP_BREAKPOINT ? 'mobile' : 'desktop');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return kind;
}
