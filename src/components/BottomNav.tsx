import React from 'react';
import { Language } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  Home,
  Users,
  Calendar,
  Calculator,
  Menu,
} from 'lucide-react';

export type TabKey = 'home' | 'customers' | 'schedule' | 'calculator' | 'more';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  language: Language;
  scheduleBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  language,
  scheduleBadgeCount = 0,
}) => {
  const t = useTranslation(language);

  const tabs: { key: TabKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'home', label: t.navHome, icon: Home },
    { key: 'customers', label: t.navCustomers, icon: Users },
    { key: 'schedule', label: t.navSchedule, icon: Calendar },
    { key: 'calculator', label: t.navCalculator, icon: Calculator },
    { key: 'more', label: t.navMore, icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg pb-safe">
      <div className="max-w-md md:max-w-xl mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`flex flex-col items-center justify-center h-full w-full py-1 min-h-[48px] transition-colors relative ${
                isActive ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.key === 'schedule' && scheduleBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                    {scheduleBadgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.5 bg-emerald-700 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
