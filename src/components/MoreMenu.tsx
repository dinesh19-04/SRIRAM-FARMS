import React from 'react';
import { Language, UserProfile } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  HardHat,
  TrendingUp,
  User,
  Settings,
  Database,
  HelpCircle,
  ExternalLink,
  Phone,
  MapPin,
  Globe,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';

interface MoreMenuProps {
  activeProfile: UserProfile;
  language: Language;
  onLanguageToggle: (lang: Language) => void;
  onOpenSubView: (view: 'employees' | 'reports' | 'backup' | 'profile' | 'help' | 'settings') => void;
  onExportGoogleSheets?: () => void;
  onResetDashboard?: () => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({
  activeProfile,
  language,
  onLanguageToggle,
  onOpenSubView,
  onExportGoogleSheets,
  onResetDashboard,
}) => {
  const t = useTranslation(language);

  return (
    <div className="space-y-4 pb-16 max-w-2xl mx-auto px-3 sm:px-6 pt-2">
      {/* Active Profile Card */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-full overflow-hidden bg-emerald-800 border-2 border-emerald-600 shrink-0 shadow-sm">
              {activeProfile.photoUrl ? (
                <img src={activeProfile.photoUrl} alt={activeProfile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-amber-200 text-lg">
                  {activeProfile.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">{activeProfile.name}</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {activeProfile.role} {activeProfile.age ? `· ${activeProfile.age}y` : ''}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {activeProfile.mobile.replace(/\s+/g, '')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenSubView('profile')}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition min-h-[40px]"
          >
            {t.switchProfile}
          </button>
        </div>

        {activeProfile.education && (
          <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Studies & Qualification</span>
            <strong className="text-stone-800">{activeProfile.education}</strong>
          </div>
        )}
      </div>

      {/* Menu Options List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs divide-y divide-stone-100 overflow-hidden">
        {/* Employees */}
        <button
          onClick={() => onOpenSubView('employees')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition text-left min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">{t.navEmployees}</div>
              <div className="text-xs text-stone-500">Worker wages, nursery labor, and wage logs</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Seasonal Reports */}
        <button
          onClick={() => onOpenSubView('reports')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition text-left min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">{t.navReports}</div>
              <div className="text-xs text-stone-500">Seasonal performance, village splits & PDF export</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Backup & Restore */}
        <button
          onClick={() => onOpenSubView('backup')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition text-left min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">{t.navBackup}</div>
              <div className="text-xs text-stone-500">Export & restore offline database files</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>

        {/* Google Sheets Sync & Ledger */}
        {onExportGoogleSheets && (
          <button
            onClick={onExportGoogleSheets}
            className="w-full p-4 flex items-center justify-between hover:bg-emerald-50/50 transition text-left min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>Google Sheets Sync</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">OAuth Enabled</span>
                </div>
                <div className="text-xs text-stone-500">Export customers, rates & wages to Google Sheets ledger</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        )}

        {/* Reset Dashboard / Start Fresh */}
        {onResetDashboard && (
          <button
            onClick={onResetDashboard}
            className="w-full p-4 flex items-center justify-between hover:bg-red-50/50 transition text-left min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-red-700">Reset Dashboard / Start Fresh</div>
                <div className="text-xs text-red-600/80">Wipe customer & employee records, restart with clean slate</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        )}


        {/* Language Switch */}
        <button
          onClick={() => onLanguageToggle(language === 'en' ? 'ta' : 'en')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition text-left min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">{t.languageSetting}</div>
              <div className="text-xs text-stone-500">
                Current: <strong className="text-emerald-800">{language === 'en' ? 'English' : 'தமிழ் (Tamil)'}</strong>
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 px-2.5 py-1 bg-emerald-50 rounded-lg">
            {language === 'en' ? 'Switch to தமிழ்' : 'Switch to English'}
          </span>
        </button>

        {/* Help & G Land Reference Info */}
        <button
          onClick={() => onOpenSubView('help')}
          className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition text-left min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">{t.navHelp} & G Land Guide</div>
              <div className="text-xs text-stone-500">App guide, pricing rules, and GPS land guide</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      </div>

      {/* Official Business Branding Card */}
      <div className="bg-emerald-950 text-emerald-100 p-4 sm:p-5 rounded-2xl shadow-sm space-y-2.5 border border-emerald-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-800 flex items-center justify-center font-black text-amber-300 text-xs">
            SF
          </div>
          <h4 className="text-sm font-black tracking-wider text-white">SRIRAM FARMS</h4>
        </div>

        <div className="text-xs text-emerald-200/90 space-y-1">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <a href="tel:8072514712" className="hover:underline font-mono font-bold text-white">
              8072514712
            </a>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
            <span>MALAIMEDU VILLAGE, SHOLINGHUR TALUK, RANIPET DIST - 632505.</span>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-800 text-[11px] text-emerald-300 font-bold flex justify-between">
          <span>Prop: RAJA S</span>
          <span>Mngr.: DINESH H</span>
        </div>
      </div>
    </div>
  );
};
