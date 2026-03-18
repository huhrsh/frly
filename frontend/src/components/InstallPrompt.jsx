import React, { useEffect, useState } from 'react';

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
};

const isInStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = window.localStorage.getItem('installPromptDismissed') === '1';

    const handleBeforeInstallPrompt = (e) => {
      // Only handle on Android/desktop, not on iOS
      if (isIosDevice()) return;
      if (dismissed) return;

      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS hint: show if on iOS Safari, not already installed, and not dismissed
    if (isIosDevice() && !isInStandaloneMode() && !dismissed) {
      setShowIosHint(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('installPromptDismissed', '1');
    }
    setShowAndroidPrompt(false);
    setShowIosHint(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowAndroidPrompt(false);
    } else {
      handleDismiss();
    }
  };

  if (!showAndroidPrompt && !showIosHint) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-40">
      <div className="max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-xl px-3 py-2.5 flex items-center gap-3 text-xs sm:text-sm">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-0.5">Install fryly on your device</p>
          {showAndroidPrompt && (
            <p className="text-gray-600">
              Add fryly to your home screen for faster access and an app-like experience.
            </p>
          )}
          {showIosHint && (
            <p className="text-gray-600">
              On iPhone, tap <span className="font-semibold">Share</span> and choose
              <span className="font-semibold"> Add to Home Screen</span> to install.
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {showAndroidPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
