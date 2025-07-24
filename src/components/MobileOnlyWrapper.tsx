'use client';

import { useEffect, useState } from 'react';

export default function MobileOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const mobile = /android|iphone|ipad|mobile/i.test(userAgent);
    setIsMobile(mobile);
  }, []);

  if (!isMobile) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%' }}>
        ❌ This app is only available on mobile devices.
      </div>
    );
  }

  return <>{children}</>;
}
