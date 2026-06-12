'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { XMarkIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY = 'justdogs_homescreen_prompt_v2';
const SHOW_DELAY_MS = 2500;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notThirdPartyBrowser = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && notThirdPartyBrowser;
}

export function AddToHomeScreenPrompt() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosMode, setIosMode] = useState(false);

  const markDone = useCallback((reason: 'installed' | 'dismissed') => {
    try {
      localStorage.setItem(STORAGE_KEY, reason);
    } catch {
      /* private mode */
    }
    setOpen(false);
    setDeferred(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone()) return;

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (stored === 'installed' || stored === 'dismissed') return;

    const ios = isIOSSafari();
    setIosMode(ios);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    const onInstalled = () => markDone('installed');
    window.addEventListener('appinstalled', onInstalled);

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      window.clearTimeout(timer);
    };
  }, [markDone]);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      markDone(outcome === 'accepted' ? 'installed' : 'dismissed');
    } catch {
      markDone('dismissed');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-prompt-title"
      onClick={(e) => { if (e.target === e.currentTarget) markDone('dismissed'); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-[rgb(0_32_96)] px-5 pt-5 pb-4 text-white relative">
          <button
            type="button"
            onClick={() => markDone('dismissed')}
            className="absolute top-3 right-3 rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-white shadow-md">
              <Image
                src="/images/icons/logo.png"
                alt="Just Dogs"
                fill
                className="object-contain p-1.5"
                sizes="64px"
                priority
                unoptimized
              />
            </div>
            <div>
              <h2 id="pwa-prompt-title" className="text-xl font-bold leading-tight">
                Just Dogs
              </h2>
              <p className="text-sm text-white/80 mt-0.5">Add to your home screen</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {iosMode ? (
            /* iOS Safari — manual instructions */
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Get quick access to Just Dogs right from your home screen — no App Store needed.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[rgb(0_32_96)] text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <p className="text-sm text-gray-700">
                    Tap the{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-[rgb(0_32_96)]">
                      Share <ArrowUpOnSquareIcon className="h-4 w-4" />
                    </span>{' '}
                    button at the bottom of Safari
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[rgb(0_32_96)] text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <p className="text-sm text-gray-700">
                    Scroll down and tap{' '}
                    <span className="font-semibold text-[rgb(0_32_96)]">Add to Home Screen</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[rgb(0_32_96)] text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <p className="text-sm text-gray-700">Tap <span className="font-semibold text-[rgb(0_32_96)]">Add</span> in the top right</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => markDone('dismissed')}
                className="w-full mt-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Maybe later
              </button>
            </div>
          ) : deferred ? (
            /* Chrome / Edge / Android — native install prompt */
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Install Just Dogs on your device for quick, app-like access — it opens right in your browser.
              </p>
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="w-full py-3 rounded-xl bg-[rgb(0_32_96)] hover:bg-[rgb(0_24_72)] text-white text-sm font-semibold transition-colors"
              >
                Add to home screen
              </button>
              <button
                type="button"
                onClick={() => markDone('dismissed')}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Maybe later
              </button>
            </div>
          ) : (
            /* Fallback for browsers without install support */
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Save Just Dogs to your home screen or bookmarks for quick access any time.
              </p>
              <button
                type="button"
                onClick={() => markDone('dismissed')}
                className="w-full py-3 rounded-xl bg-[rgb(0_32_96)] hover:bg-[rgb(0_24_72)] text-white text-sm font-semibold transition-colors"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
