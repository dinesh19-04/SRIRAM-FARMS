import React, { useState, useMemo } from 'react';
import { Customer, EmployeeWorkLog, Language } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  formatCurrency,
  formatDateDisplay,
  calculateTotalAcres,
} from '../utils/calculations';
import { generateSeasonalReportPdf, shareOrDownloadPdf } from '../utils/pdfGenerator';
import { exportCustomersToCSV } from '../utils/csvExport';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Tractor,
  DollarSign,
  TrendingUp,
  Share2,
} from 'lucide-react';

interface ReportsViewProps {
  customers: Customer[];
  workLogs: EmployeeWorkLog[];
  language: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers,
  workLogs,
  language,
}) => {
  const t = useTranslation(language);

  // Filters
  const [season, setSeason] = useState('ALL');
  const [filterVillage, setFilterVillage] = useState('ALL');
  const [filterMachinery, setFilterMachinery] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);

  // Unique villages
  const villages = useMemo(() => {
    const s = new Set<string>();
    customers.forEach(c => c.village && s.add(c.village));
    return Array.from(s).sort();
  }, [customers]);

  // Unique seasons
  const seasons = useMemo(() => {
    const s = new Set<string>();
    customers.forEach(c => c.season && s.add(c.season));
    return Array.from(s).sort();
  }, [customers]);

  // Filtered dataset
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (season !== 'ALL' && c.season !== season) return false;
      if (filterVillage !== 'ALL' && c.village !== filterVillage) return false;
      if (filterMachinery !== 'ALL' && c.machineryType !== filterMachinery) return false;
      if (filterPayment !== 'ALL' && c.paymentStatus !== filterPayment) return false;
      return true;
    });
  }, [customers, season, filterVillage, filterMachinery, filterPayment]);

  // Calculate Aggregates
  const totalCustomers = filteredCustomers.length;
  const totalAcres = filteredCustomers.reduce((sum, c) => sum + (c.acres + c.cents / 100), 0);
  const smallAcres = filteredCustomers
    .filter(c => c.machineryType === 'Small Machine')
    .reduce((sum, c) => sum + (c.acres + c.cents / 100), 0);
  const largeAcres = filteredCustomers
    .filter(c => c.machineryType === 'Large Machine')
    .reduce((sum, c) => sum + (c.acres + c.cents / 100), 0);

  const grossRevenue = filteredCustomers.reduce((sum, c) => sum + c.totalCharge, 0);
  const collectedPayments = filteredCustomers.reduce((sum, c) => sum + c.totalCustomerPaid, 0);
  const pendingBalances = filteredCustomers.reduce((sum, c) => sum + c.remainingBalance, 0);

  const customerIdsSet = new Set(filteredCustomers.map(c => c.id));
  const relevantWorkLogs = workLogs.filter(l => customerIdsSet.has(l.customerId));
  const totalWages = relevantWorkLogs.reduce((sum, l) => sum + l.amountPaid, 0);
  const netCashCollected = collectedPayments - totalWages;

  const completedPlantings = filteredCustomers.filter(c => c.bookingStatus === 'Planting Completed').length;
  const pendingPlantings = filteredCustomers.filter(
    c => c.bookingStatus !== 'Planting Completed' && c.bookingStatus !== 'Cancelled'
  ).length;

  // Village-wise summary
  const villageSummary = useMemo(() => {
    const map: Record<string, { count: number; acres: number; billed: number; collected: number; balance: number }> = {};
    filteredCustomers.forEach(c => {
      if (!map[c.village]) {
        map[c.village] = { count: 0, acres: 0, billed: 0, collected: 0, balance: 0 };
      }
      map[c.village].count += 1;
      map[c.village].acres += c.acres + c.cents / 100;
      map[c.village].billed += c.totalCharge;
      map[c.village].collected += c.totalCustomerPaid;
      map[c.village].balance += c.remainingBalance;
    });
    return Object.entries(map).sort((a, b) => b[1].acres - a[1].acres);
  }, [filteredCustomers]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = await generateSeasonalReportPdf(
        filteredCustomers,
        relevantWorkLogs,
        season !== 'ALL' ? season : 'All Seasons Combined'
      );
      await shareOrDownloadPdf(doc, `SRIRAM_FARMS_Seasonal_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto px-3 sm:px-6 pt-2">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {t.reportsTitle}
          </h2>
          <p className="text-xs text-stone-500">
            Performance analytics, machinery splits, and cash reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportCustomersToCSV(filteredCustomers, 'sriram_farms_seasonal_report.csv')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 min-h-[44px]"
          >
            <FileText className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : t.exportSeasonalPdf}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Season</label>
          <select
            value={season}
            onChange={e => setSeason(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
          >
            <option value="ALL">All Seasons</option>
            {seasons.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Village</label>
          <select
            value={filterVillage}
            onChange={e => setFilterVillage(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
          >
            <option value="ALL">All Villages</option>
            {villages.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Machinery</label>
          <select
            value={filterMachinery}
            onChange={e => setFilterMachinery(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
          >
            <option value="ALL">All Machinery</option>
            <option value="Small Machine">Small Machine (4-row)</option>
            <option value="Large Machine">Large Machine (8-row)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Payment Status</label>
          <select
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
          >
            <option value="ALL">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Fully Paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Farmers Served</span>
          <div className="text-xl font-black text-stone-900 mt-1 tabular-nums">{totalCustomers}</div>
          <span className="text-[11px] text-stone-500">{completedPlantings} planted · {pendingPlantings} pending</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Area Covered</span>
          <div className="text-xl font-black text-emerald-800 mt-1 tabular-nums">
            {totalAcres.toFixed(2)} <span className="text-xs font-normal text-stone-500">Acres</span>
          </div>
          <span className="text-[11px] text-stone-500">
            Small: {smallAcres.toFixed(1)} ac | Large: {largeAcres.toFixed(1)} ac
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Gross Revenue Billed</span>
          <div className="text-xl font-black text-stone-900 mt-1 tabular-nums">
            {formatCurrency(grossRevenue)}
          </div>
          <span className="text-[11px] text-stone-500">Total machinery billing</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-900 block">Collected Cash</span>
          <div className="text-xl font-black text-emerald-700 mt-1 tabular-nums">
            {formatCurrency(collectedPayments)}
          </div>
          <span className="text-[11px] text-stone-500">
            Bal due: <strong className="text-amber-700">{formatCurrency(pendingBalances)}</strong>
          </span>
        </div>
      </div>

      {/* Financial Reconciliation Card */}
      <div className="bg-stone-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
          {t.financialReconciliation}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-stone-800 rounded-xl">
            <span className="text-stone-400 text-[10px] uppercase block">{t.collectedFromFarmers}</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">
              {formatCurrency(collectedPayments)}
            </div>
            <span className="text-[10px] text-stone-400">Total cash & UPI received</span>
          </div>

          <div className="p-3 bg-stone-800 rounded-xl">
            <span className="text-stone-400 text-[10px] uppercase block">{t.totalLaborExpenses}</span>
            <div className="text-lg font-bold text-purple-300 mt-0.5 tabular-nums">
              - {formatCurrency(totalWages)}
            </div>
            <span className="text-[10px] text-stone-400">Disbursed to employees</span>
          </div>

          <div className="p-3 bg-stone-800 rounded-xl border border-amber-400/30">
            <span className="text-amber-300 text-[10px] uppercase font-bold block">{t.netCashRealized}</span>
            <div className="text-xl font-black text-amber-300 mt-0.5 tabular-nums">
              {formatCurrency(netCashCollected)}
            </div>
            <span className="text-[10px] text-stone-400">In-hand after labor expenses</span>
          </div>
        </div>
      </div>

      {/* Village Breakdown Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-stone-50 border-b border-stone-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Village-Wise Machinery Coverage & Collections
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3">Village</th>
                <th className="p-3 text-center">Farmers</th>
                <th className="p-3 text-right">Total Area</th>
                <th className="p-3 text-right">Billed (₹)</th>
                <th className="p-3 text-right">Collected (₹)</th>
                <th className="p-3 text-right">Balance Due (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {villageSummary.map(([villageName, data]) => (
                <tr key={villageName} className="hover:bg-stone-50">
                  <td className="p-3 font-bold text-stone-900">{villageName}</td>
                  <td className="p-3 text-center tabular-nums">{data.count}</td>
                  <td className="p-3 text-right font-mono tabular-nums">{data.acres.toFixed(2)} Ac</td>
                  <td className="p-3 text-right font-mono tabular-nums">{formatCurrency(data.billed)}</td>
                  <td className="p-3 text-right font-mono tabular-nums text-emerald-800">{formatCurrency(data.collected)}</td>
                  <td className="p-3 text-right font-mono tabular-nums font-bold text-amber-700">{formatCurrency(data.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
