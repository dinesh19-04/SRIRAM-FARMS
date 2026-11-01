import React, { useState } from 'react';
import { Customer, DashboardMetrics, Language, UserProfile } from '../types';
import { useTranslation } from '../i18n/translations';
import { formatCurrency, formatDateDisplay, cleanMobileNumber } from '../utils/calculations';
import {
  Users,
  Tractor,
  Calendar,
  CreditCard,
  PlusCircle,
  Clock,
  Phone,
  FileText,
  Calculator,
  HardHat,
  Database,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Smartphone,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Share2,
} from 'lucide-react';

interface DashboardProps {
  metrics: DashboardMetrics;
  customers: Customer[];
  activeProfile: UserProfile;
  language: Language;
  onNavigate: (tab: 'customers' | 'schedule' | 'calculator' | 'more', subview?: string) => void;
  onAddCustomer: () => void;
  onSelectCustomer: (cust: Customer) => void;
  onDownloadReport: () => void;
  onShareReport: () => void;
  onExportGoogleSheets?: () => void;
  onResetDashboard?: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  customers,
  activeProfile,
  language,
  onNavigate,
  onAddCustomer,
  onSelectCustomer,
  onDownloadReport,
  onShareReport,
  onExportGoogleSheets,
  onResetDashboard,
}) => {
  const t = useTranslation(language);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Filter today's seeding & planting
  const todaySeedingCustomers = customers.filter(c => c.seedingDate === todayStr);
  const todayPlantingCustomers = customers.filter(
    c => c.expectedPlantingDate === todayStr && c.bookingStatus !== 'Planting Completed' && c.bookingStatus !== 'Cancelled'
  );

  // Overdue / upcoming customers
  const upcomingPlantingCustomers = customers
    .filter(c => {
      if (c.bookingStatus === 'Planting Completed' || c.bookingStatus === 'Cancelled') return false;
      const exp = c.expectedPlantingDate;
      return exp > todayStr;
    })
    .sort((a, b) => a.expectedPlantingDate.localeCompare(b.expectedPlantingDate))
    .slice(0, 4);

  const pendingBalanceCustomers = customers
    .filter(c => c.remainingBalance > 0)
    .sort((a, b) => b.remainingBalance - a.remainingBalance)
    .slice(0, 3);

  return (
    <div className="space-y-5 pb-8 max-w-7xl mx-auto px-3 sm:px-6 pt-2">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-emerald-700 border-2 border-amber-300 shadow-md shrink-0">
            {activeProfile.photoUrl ? (
              <img src={activeProfile.photoUrl} alt={activeProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-amber-200 text-lg">
                {activeProfile.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="text-[11px] font-medium text-emerald-200">
              {new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {activeProfile.name}
              </h2>
              <span className="text-[10px] bg-amber-400 text-emerald-950 font-bold px-2 py-0.5 rounded-full">
                {activeProfile.role} {activeProfile.age ? `· ${activeProfile.age} Yrs` : ''}
              </span>
            </div>
            {activeProfile.education && (
              <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                {activeProfile.education}
              </p>
            )}
            <p className="text-[10px] text-emerald-200/80 mt-0.5">
              {t.equalPermissionsNote}
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={onAddCustomer}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-sm min-h-[44px] shrink-0 self-stretch sm:self-auto justify-center"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{t.addCustomerBtn}</span>
        </button>
      </div>

      {/* Empty State Banner when no customers exist */}
      {customers.length === 0 && (
        <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-950">No customers found. Add your first customer.</h3>
            <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
              Your farm machinery database is clean and ready. Register farmers, book planting machines, track acreage, and calculate charges.
            </p>
          </div>
          <button
            onClick={onAddCustomer}
            className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Customer</span>
          </button>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={onAddCustomer}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/70 transition text-left min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.addCustomerBtn}</span>
          </button>

          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 transition text-left min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-700 text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.viewCustomersBtn}</span>
          </button>

          <button
            onClick={() => onNavigate('schedule')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/70 transition text-left min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.todayScheduleBtn}</span>
          </button>

          <button
            onClick={() => onNavigate('calculator')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200/70 transition text-left min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.calculatorBtn}</span>
          </button>

          <button
            onClick={() => onNavigate('more', 'employees')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200/70 transition text-left min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
              <HardHat className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.employeeRecordsBtn}</span>
          </button>

          <button
            onClick={() => onNavigate('more', 'reports')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200/70 transition text-left min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.seasonalReportsBtn}</span>
          </button>

          {/* Button 1: Download PDF Report */}
          <button
            onClick={onDownloadReport}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200/70 transition text-left min-h-[48px]"
            title="Download PDF seasonal report directly"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold leading-tight block">Download PDF</span>
              <span className="text-[10px] text-teal-700 font-semibold">Seasonal Report</span>
            </div>
          </button>

          {/* Button 2: Share Report */}
          <button
            onClick={onShareReport}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200/70 transition text-left min-h-[48px]"
            title="Share report via WhatsApp / Email"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold leading-tight block">Share Report</span>
              <span className="text-[10px] text-teal-700 font-semibold">Native Share</span>
            </div>
          </button>

          {onExportGoogleSheets && (
            <button
              onClick={onExportGoogleSheets}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300/80 transition text-left min-h-[48px]"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold leading-tight block">Google Sheets</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Ledger & Sync</span>
              </div>
            </button>
          )}

          <button
            onClick={() => onNavigate('more', 'backup')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 transition text-left min-h-[48px]"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-600 text-white flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold leading-tight">{t.backupRestoreBtn}</span>
          </button>

          {onResetDashboard && (
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition text-left min-h-[48px]"
              title="Reset customer and employee records"
            >
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold leading-tight block">Reset Dashboard</span>
                <span className="text-[10px] text-red-600 font-semibold">Start Fresh</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Top Agricultural KPI Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5 px-0.5">
          Agricultural Bookings & Acreage
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">{t.totalCustomersLabel}</span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
              {metrics.totalCustomers}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Active season farmers
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">{t.totalAcresBooked}</span>
              <Tractor className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">
              {metrics.totalAcres.toFixed(2)}
              <span className="text-xs font-bold text-stone-500 ml-1">Acres</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {metrics.totalCents} total cents
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">{t.smallMachineBookings}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">₹45/Cent</span>
            </div>
            <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
              {metrics.smallMachineBookings}
              <span className="text-xs font-normal text-stone-500 ml-1">bookings</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              ₹4,500/Acre (₹45/Cent)
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">{t.largeMachineBookings}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">₹40/Cent</span>
            </div>
            <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
              {metrics.largeMachineBookings}
              <span className="text-xs font-normal text-stone-500 ml-1">bookings</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              ₹4,000/Acre (₹40/Cent)
            </div>
          </div>
        </div>
      </div>

      {/* Official Machine Rates & Live Formula Card */}
      <div className="bg-gradient-to-r from-emerald-950 to-stone-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-emerald-800/80">
          <div>
            <span className="text-[10px] uppercase font-black text-amber-300 tracking-wider">Pricing Standards</span>
            <h3 className="text-base font-bold text-white">Planting Machine Rates & Price Formula</h3>
          </div>
          <span className="text-[11px] font-bold bg-amber-400 text-emerald-950 px-2.5 py-1 rounded-full">
            1 Acre = 100 Cents
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Small Machine Rate */}
          <div className="p-3 bg-white/5 rounded-xl border border-emerald-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-amber-300">Small Planting Machine</strong>
              <span className="text-xs font-black bg-emerald-700 text-white px-2 py-0.5 rounded">
                ₹45 per cent
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 font-mono">
              Total price = Number of cents × ₹45
            </p>
            <div className="text-[11px] text-emerald-200/90 space-y-0.5 pt-1 border-t border-white/10">
              <div>• 10 cents: 10 × ₹45 = <strong>₹450</strong></div>
              <div>• 25 cents: 25 × ₹45 = <strong>₹1,125</strong></div>
              <div>• 1 acre (100 cents): 100 × ₹45 = <strong>₹4,500</strong></div>
            </div>
          </div>

          {/* Large Machine Rate */}
          <div className="p-3 bg-white/5 rounded-xl border border-emerald-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="text-sm text-amber-300">Large Planting Machine</strong>
              <span className="text-xs font-black bg-emerald-700 text-white px-2 py-0.5 rounded">
                ₹40 per cent
              </span>
            </div>
            <p className="text-[11px] text-emerald-100 font-mono">
              Total price = Number of cents × ₹40
            </p>
            <div className="text-[11px] text-emerald-200/90 space-y-0.5 pt-1 border-t border-white/10">
              <div>• 10 cents: 10 × ₹40 = <strong>₹400</strong></div>
              <div>• 25 cents: 25 × ₹40 = <strong>₹1,000</strong></div>
              <div>• 1 acre (100 cents): 100 × ₹40 = <strong>₹4,000</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5 px-0.5">
          Billing, Payments & Labor
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
            <div className="text-xs font-medium text-stone-500">{t.totalCustomerCharges}</div>
            <div className="text-xl font-black text-stone-900 mt-1 tabular-nums">
              {formatCurrency(metrics.totalCustomerCharges)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">Gross machinery billing</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-xs">
            <div className="text-xs font-medium text-emerald-800">{t.advanceReceived}</div>
            <div className="text-xl font-black text-emerald-700 mt-1 tabular-nums">
              {formatCurrency(metrics.totalPaymentsCollected)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Adv: {formatCurrency(metrics.totalAdvanceCollected)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-xs">
            <div className="text-xs font-medium text-amber-800">{t.pendingCustomerBalance}</div>
            <div className="text-xl font-black text-amber-700 mt-1 tabular-nums">
              {formatCurrency(metrics.totalRemainingBalance)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">To be collected</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-purple-200 bg-purple-50/20 shadow-xs">
            <div className="text-xs font-medium text-purple-900">{t.employeeWagesPaid}</div>
            <div className="text-xl font-black text-purple-800 mt-1 tabular-nums">
              {formatCurrency(metrics.totalEmployeePayments)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Net in hand: <span className="font-bold text-stone-700">{formatCurrency(metrics.netCashCollected)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule Live Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Seeding */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-stone-900">{t.todaySeeding}</h4>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                {todaySeedingCustomers.length}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {todaySeedingCustomers.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-2">
                  No nursery tray seeding scheduled for today.
                </p>
              ) : (
                todaySeedingCustomers.map(cust => (
                  <div
                    key={cust.id}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900">{cust.name}</div>
                      <div className="text-[11px] text-stone-500">
                        {cust.village} · {cust.acres} Ac {cust.cents > 0 ? `${cust.cents} Cts` : ''} · {cust.machineryType}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${cleanMobileNumber(cust.mobile)}`}
                        className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition"
                        title={t.call}
                        aria-label={`Call ${cust.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => onSelectCustomer(cust)}
                        className="px-2 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100"
                      >
                        {t.viewDetails}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigate('schedule')}
            className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-end gap-1 hover:underline pt-2"
          >
            <span>View full schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Today's Planting */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Tractor className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-stone-900">{t.todayPlanting}</h4>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                {todayPlantingCustomers.length}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {todayPlantingCustomers.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-2">
                  No machine planting scheduled for today.
                </p>
              ) : (
                todayPlantingCustomers.map(cust => (
                  <div
                    key={cust.id}
                    className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-stone-900">{cust.name}</div>
                      <div className="text-[11px] text-stone-600">
                        {cust.village} · {cust.acres} Ac {cust.cents > 0 ? `${cust.cents} Cts` : ''} · {cust.machineryType}
                      </div>
                      <div className="text-[10px] font-semibold text-amber-900 mt-0.5">
                        Bal: {formatCurrency(cust.remainingBalance)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${cleanMobileNumber(cust.mobile)}`}
                        className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition"
                        title={t.call}
                        aria-label={`Call ${cust.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => onSelectCustomer(cust)}
                        className="px-2 py-1 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100"
                      >
                        {t.viewDetails}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigate('schedule')}
            className="mt-3 text-xs font-bold text-amber-800 flex items-center justify-end gap-1 hover:underline pt-2"
          >
            <span>Check planting reminders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upcoming Planting & Pending Balances Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Planting Next 7 Days */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {t.upcomingPlanting}
            </h4>
            <span className="text-[11px] font-semibold text-emerald-800">
              {upcomingPlantingCustomers.length} Upcoming
            </span>
          </div>

          <div className="mt-3 divide-y divide-stone-100">
            {upcomingPlantingCustomers.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">No pending plantings in the queue.</p>
            ) : (
              upcomingPlantingCustomers.map(c => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{c.name}</span>
                    <span className="text-stone-500 ml-1.5">({c.village})</span>
                    <div className="text-[11px] text-stone-500">
                      Planting: <span className="font-semibold text-stone-800">{formatDateDisplay(c.expectedPlantingDate)}</span> · {c.acres} Ac
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-700 tabular-nums">{formatCurrency(c.totalCharge)}</span>
                    <button
                      onClick={() => onSelectCustomer(c)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Customer Balances to Collect */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Outstanding Customer Balances</span>
            </h4>
            <button
              onClick={() => onNavigate('customers')}
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="mt-3 divide-y divide-stone-100">
            {pendingBalanceCustomers.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-2">All customer payments are settled.</p>
            ) : (
              pendingBalanceCustomers.map(c => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{c.name}</span>
                    <span className="text-stone-500 ml-1.5">({c.village})</span>
                    <div className="text-[11px] text-stone-500">
                      Total: {formatCurrency(c.totalCharge)} · Paid: {formatCurrency(c.totalCustomerPaid)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-700 tabular-nums">
                      {formatCurrency(c.remainingBalance)}
                    </span>
                    <a
                      href={`tel:${cleanMobileNumber(c.mobile)}`}
                      className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center hover:bg-emerald-200"
                      title={t.call}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Strong Confirmation Dialog: Reset Dashboard / Start Fresh */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Reset Dashboard / Start Fresh</h3>
                <p className="text-xs text-red-600 font-bold">Strong Confirmation Required</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-600 my-3">
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 space-y-1">
                <strong>What will be permanently deleted:</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-800 mt-1">
                  <li>All customer records & farmer bookings ({customers.length} total)</li>
                  <li>All employee worker profiles and work/wage logs</li>
                  <li>All booking schedules, land entries, and payment history</li>
                  <li>Dashboard statistics and metrics will reset to 0</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <strong>What will remain safe:</strong>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-800 mt-1">
                  <li>Owner profile (RAJA S) & Manager profile (DINESH H)</li>
                  <li>Machinery configuration & rates (Small: ₹45/cent, Large: ₹40/cent)</li>
                  <li>Firebase database project and access permissions</li>
                  <li>Application ready for immediate fresh entries</li>
                </ul>
              </div>

              <p className="text-[11px] text-stone-500 font-medium">
                This reset executes against the shared Firestore database and is instantly broadcast to all laptops and phones.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 min-h-[42px]"
              >
                Cancel Safely
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  if (!onResetDashboard) return;
                  setIsResetting(true);
                  try {
                    await onResetDashboard();
                    setShowResetModal(false);
                  } catch (err) {
                    console.error('Reset error:', err);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-2 min-h-[42px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isResetting ? 'Resetting Database...' : 'Yes, Reset & Start Fresh'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
