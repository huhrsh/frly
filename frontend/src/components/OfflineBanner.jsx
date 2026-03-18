import React, { useEffect, useState } from 'react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm py-2 px-4 flex items-center justify-center text-center z-30">
      <span className="font-medium mr-1">You’re offline.</span>
      <span>Some changes may not save until you’re back online.</span>
    </div>
  );
};

export default OfflineBanner;
