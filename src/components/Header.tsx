import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { useTranslation } from '../i18n/translations';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import {
  User,
  Download,
  WifiOff,
  Globe,
  Share2,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeProfile: UserProfile;
  language: Language;
  onLanguageToggle: (lang: Language) => void;
  onOpenProfile: () => void;
  onOpenHelp?: () => void;
  todayTasksCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  language,
  onLanguageToggle,
  onOpenProfile,
  todayTasksCount = 0,
}) => {
  const t = useTranslation(language);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md border-b border-emerald-900/40">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs px-3 py-1 flex items-center justify-center gap-1.5 font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t.offlineNotice}</span>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center relative shadow-inner">
            <span className="font-black text-amber-300 text-sm tracking-wider">SF</span>
            {todayTasksCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-emerald-900 text-[9px] font-black rounded-full flex items-center justify-center text-white">
                {todayTasksCount > 9 ? '9+' : todayTasksCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight whitespace-nowrap">
              {t.appName}
            </h1>
            <p className="text-[10px] text-emerald-200 hidden xs:block font-medium leading-none mt-0.5">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right Action Zone */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 text-emerald-950 hover:bg-amber-300 text-xs font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap min-h-[38px]"
              aria-label="Install App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.pwaInstall}</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {/* iOS Install Prompt Button */}
          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1 px-2 py-1 bg-white/15 hover:bg-white/25 text-xs font-medium rounded-lg text-white transition-colors"
              aria-label="Install on iOS"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add to Home</span>
            </button>
          )}

          {/* Language Selector */}
          <button
            onClick={() => onLanguageToggle(language === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-900 text-xs font-semibold text-emerald-100 transition-colors border border-emerald-700/50 min-h-[38px]"
            title="Switch Language"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <span className="font-bold">{language === 'en' ? 'தமிழ்' : 'ENG'}</span>
          </button>

          {/* Active Profile Pill / Trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/15 hover:bg-white/20 text-white transition-colors border border-white/20 min-h-[38px]"
            title={t.switchProfile}
            aria-label={t.activeProfile}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-amber-200 shrink-0 border border-white/30">
              {activeProfile.photoUrl ? (
                <img src={activeProfile.photoUrl} alt={activeProfile.name} className="w-full h-full object-cover" />
              ) : (
                activeProfile.name.charAt(0)
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold leading-none">{activeProfile.name}</div>
              <div className="text-[9px] text-emerald-200 font-medium mt-0.5">
                {activeProfile.role} {activeProfile.age ? `· ${activeProfile.age}y` : ''}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-stone-900">
            <h3 className="text-base font-bold text-emerald-800">
              Install SRIRAM FARMS on iPhone / iPad
            </h3>
            <p className="mt-3 text-sm text-stone-600 leading-relaxed">
              1. Tap the <strong className="text-stone-900">Share</strong> icon (square with arrow) at the bottom of Safari.<br />
              2. Scroll down and tap <strong className="text-stone-900">Add to Home Screen</strong>.<br />
              3. Launch directly from your home screen for full offline access!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 transition"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
