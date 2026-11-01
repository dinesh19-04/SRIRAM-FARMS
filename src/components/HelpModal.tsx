import React from 'react';
import { Language } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  HelpCircle,
  X,
  Tractor,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = useTranslation(language);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-stone-200">
        <div className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold">Help & Operation Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-stone-700 leading-relaxed">
          {/* Machinery Rates */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <h4 className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
              <Tractor className="w-4 h-4" />
              <span>Machinery Pricing Rules</span>
            </h4>
            <p>
              • <strong>Small Machine</strong> (4-row transplanter): ₹4,000 per Acre or ₹40 per Cent.<br />
              • <strong>Large Machine</strong> (8-row transplanter): ₹4,500 per Acre or ₹45 per Cent.<br />
              • Land calculation: 1 Acre = 100 Cents. Fractional acres and cents are precisely calculated.
            </p>
          </div>

          {/* Seeding & Planting 22-25 Days */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <h4 className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
              <Calendar className="w-4 h-4" />
              <span>Planting Date Calculation</span>
            </h4>
            <p>
              • Default nursery interval is <strong>22 days</strong> (selectable from 22, 23, 24, or 25 days).<br />
              • The expected planting date is automatically scheduled. If manually overridden, an indicator badge appears.<br />
              • Reminders trigger automatically at 3 days before, 2 days before, on the planting day, and when overdue.
            </p>
          </div>

          {/* G Land Measurement */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>G Land & GPS Measurement Reference</span>
            </h4>
            <p>
              When measuring farmer field boundaries with GPS apps like <strong>G Land</strong> or <strong>GPS Fields Area Measure</strong>:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-stone-600">
              <li>Open your land measurement app and record the GPS field perimeter.</li>
              <li>Take a screenshot or photo of the survey map with the recorded acreage.</li>
              <li>Attach the photo in the customer form under <strong>Land Measurement / G Land Reference</strong>.</li>
              <li>The image will be stored locally in IndexedDB and included in the customer PDF report.</li>
            </ol>
          </div>

          {/* Labor & Cash Separation */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
            <h4 className="font-bold text-stone-900 text-xs">Labor & Financial Discipline</h4>
            <p>
              Employee nursery wages and operator wages are tracked as internal operating expenses and do <strong>NOT</strong> reduce customer balances due.
            </p>
          </div>
        </div>

        <div className="p-3 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 min-h-[44px]"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
