import React, { useState, useMemo } from 'react';
import { Customer, PlantingSchedule, Language, MachineryType, BookingStatus, PaymentStatus } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  formatCurrency,
  formatDateDisplay,
  cleanMobileNumber,
  calculateSeedBags,
} from '../utils/calculations';
import {
  Search,
  Filter,
  Phone,
  Edit,
  Eye,
  FileText,
  PlusCircle,
  X,
  ArrowUpDown,
  Tractor,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Share2,
  Trash2,
  Download,
  Sprout,
  RefreshCw,
  Home,
} from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  schedules?: PlantingSchedule[];
  language: Language;
  onAddCustomer: () => void;
  onNavigateHome?: () => void;
  onRefreshData?: () => Promise<void>;
  onSelectCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onGeneratePdf: (customer: Customer) => void;
  onDownloadPdf?: (customer: Customer) => void;
  onSharePdf?: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  onViewSchedules?: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  schedules = [],
  language,
  onAddCustomer,
  onNavigateHome,
  onRefreshData,
  onSelectCustomer,
  onEditCustomer,
  onGeneratePdf,
  onDownloadPdf,
  onSharePdf,
  onDeleteCustomer,
  onViewSchedules,
}) => {
  const t = useTranslation(language);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterVillage, setFilterVillage] = useState('ALL');
  const [filterMachinery, setFilterMachinery] = useState<'ALL' | MachineryType>('ALL');
  const [filterBookingStatus, setFilterBookingStatus] = useState<'ALL' | BookingStatus>('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'ALL' | PaymentStatus>('ALL');
  const [filterSeed, setFilterSeed] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'plantingDate' | 'balance' | 'name'>('newest');

  // Delete Customer State
  const [customerPendingDelete, setCustomerPendingDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConfirmDelete = async () => {
    if (!customerPendingDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCustomer(customerPendingDelete.id);
      setCustomerPendingDelete(null);
    } catch (err) {
      console.error('Delete customer error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } catch (err) {
      console.error('Manual refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Extract unique villages & seeds for dropdowns
  const uniqueVillages = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (c.village) set.add(c.village);
    });
    return Array.from(set).sort();
  }, [customers]);

  const uniqueSeeds = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      if (c.seedVariety) set.add(c.seedVariety);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        // Search term matches Name, Village, Mobile, or Customer ID
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = c.name.toLowerCase().includes(q);
          const matchVillage = c.village.toLowerCase().includes(q);
          const matchMobile = c.mobile.includes(q);
          const matchId = c.id.toLowerCase().includes(q);
          if (!matchName && !matchVillage && !matchMobile && !matchId) {
            return false;
          }
        }

        if (filterVillage !== 'ALL' && c.village !== filterVillage) return false;
        if (filterMachinery !== 'ALL' && c.machineryType !== filterMachinery) return false;
        if (filterBookingStatus !== 'ALL' && c.bookingStatus !== filterBookingStatus) return false;
        if (filterPaymentStatus !== 'ALL' && c.paymentStatus !== filterPaymentStatus) return false;
        if (filterSeed !== 'ALL' && c.seedVariety !== filterSeed) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
        if (sortBy === 'plantingDate') {
          return (a.expectedPlantingDate || '').localeCompare(b.expectedPlantingDate || '');
        }
        if (sortBy === 'balance') {
          return b.remainingBalance - a.remainingBalance;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [
    customers,
    searchTerm,
    filterVillage,
    filterMachinery,
    filterBookingStatus,
    filterPaymentStatus,
    filterSeed,
    sortBy,
  ]);

  const activeFiltersCount =
    (filterVillage !== 'ALL' ? 1 : 0) +
    (filterMachinery !== 'ALL' ? 1 : 0) +
    (filterBookingStatus !== 'ALL' ? 1 : 0) +
    (filterPaymentStatus !== 'ALL' ? 1 : 0) +
    (filterSeed !== 'ALL' ? 1 : 0);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterVillage('ALL');
    setFilterMachinery('ALL');
    setFilterBookingStatus('ALL');
    setFilterPaymentStatus('ALL');
    setFilterSeed('ALL');
  };

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto px-3 sm:px-6 pt-2">
      {/* Search Bar & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {t.navCustomers}
          </h2>
          <p className="text-xs text-stone-500">
            {filteredCustomers.length} of {customers.length} farmers shown
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              title="Return to Home Dashboard"
              className="flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-3 py-2.5 rounded-xl border border-stone-300 transition active:scale-95 text-xs min-h-[44px]"
            >
              <Home className="w-4 h-4 text-emerald-800" />
              <span>Back to Home</span>
            </button>
          )}

          {onRefreshData && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh and sync data with Firebase Cloud Firestore"
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-bold px-3 py-2.5 rounded-xl shadow-2xs transition active:scale-95 text-xs min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>
          )}

          <button
            onClick={onAddCustomer}
            className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 text-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.addCustomerBtn}</span>
          </button>
        </div>
      </div>

      {/* Search Input & Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, village, mobile, or ID..."
            className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white shadow-2xs focus:outline-none focus:border-emerald-600 min-h-[44px]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition min-h-[44px] ${
            activeFiltersCount > 0
              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
              : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <Filter className="w-4 h-4 text-emerald-700" />
          <span className="hidden sm:inline">{t.filter}</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Sort Trigger */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-2.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 focus:outline-none focus:border-emerald-600 min-h-[44px]"
        >
          <option value="newest">Newest First</option>
          <option value="plantingDate">Earliest Planting</option>
          <option value="balance">Highest Balance</option>
          <option value="name">Farmer Name (A-Z)</option>
        </select>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Filter Records
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                {t.clearFilters}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Village */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Village
              </label>
              <select
                value={filterVillage}
                onChange={e => setFilterVillage(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
              >
                <option value="ALL">All Villages</option>
                {uniqueVillages.map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Machinery */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Machinery
              </label>
              <select
                value={filterMachinery}
                onChange={e => setFilterMachinery(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
              >
                <option value="ALL">All Machines</option>
                <option value="Small Machine">Small Machine (4-row)</option>
                <option value="Large Machine">Large Machine (8-row)</option>
              </select>
            </div>

            {/* Booking Status */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Booking Status
              </label>
              <select
                value={filterBookingStatus}
                onChange={e => setFilterBookingStatus(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
              >
                <option value="ALL">All Statuses</option>
                <option value="Booked">{t.statusBooked}</option>
                <option value="Seeding Completed">{t.statusSeedingCompleted}</option>
                <option value="Planting Pending">{t.statusPlantingPending}</option>
                <option value="Planting Completed">{t.statusPlantingCompleted}</option>
                <option value="Cancelled">{t.statusCancelled}</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Payment Status
              </label>
              <select
                value={filterPaymentStatus}
                onChange={e => setFilterPaymentStatus(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
              >
                <option value="ALL">All Payments</option>
                <option value="Unpaid">{t.statusUnpaid}</option>
                <option value="Partially Paid">{t.statusPartiallyPaid}</option>
                <option value="Fully Paid">{t.statusFullyPaid}</option>
              </select>
            </div>

            {/* Seed Variety */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Seed Variety
              </label>
              <select
                value={filterSeed}
                onChange={e => setFilterSeed(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-stone-50"
              >
                <option value="ALL">All Varieties</option>
                {uniqueSeeds.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Customer Cards List */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-stone-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Tractor className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-stone-900">No customers found. Add your first customer.</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Register farmers, machinery bookings, seedling schedules, and advance payments to get started.
          </p>
          <button
            onClick={onAddCustomer}
            className="mt-4 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-1.5 transition active:scale-95 min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Customer</span>
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center shadow-xs">
          <Tractor className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800">No Farmers Match Filters</h4>
          <p className="text-xs text-stone-500 mt-1">
            Try adjusting your search query or filters.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCustomers.map(customer => {
            const hasOverduePlanting =
              customer.bookingStatus !== 'Planting Completed' &&
              customer.bookingStatus !== 'Cancelled' &&
              customer.expectedPlantingDate < new Date().toISOString().slice(0, 10);

            const customerSchedules = schedules.filter(s => s.customerId === customer.id);

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {customer.id}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          {customer.village}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-700" />
                          <span>{customerSchedules.length} {customerSchedules.length === 1 ? 'Schedule' : 'Schedules'}</span>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-1 leading-snug">
                        {customer.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Delete Button in Header */}
                      <button
                        type="button"
                        onClick={() => setCustomerPendingDelete(customer)}
                        className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70 flex items-center justify-center transition active:scale-95"
                        title={`Delete ${customer.name}`}
                        aria-label={`Delete ${customer.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Direct Call Button (tap-to-call) */}
                      <a
                        href={`tel:${cleanMobileNumber(customer.mobile)}`}
                        className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition active:scale-95"
                        title={`Call ${customer.name}`}
                        aria-label={`Call ${customer.name}`}
                      >
                        <Phone className="w-4 h-4 stroke-[2.5]" />
                      </a>
                    </div>
                  </div>

                  {/* Land & Machinery Specs */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-medium">Land Area</span>
                      <strong className="text-stone-900">
                        {customer.acres} Ac {customer.cents > 0 ? `${customer.cents} Cts` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block uppercase font-medium">Machinery</span>
                      <strong className="text-stone-900">{customer.machineryType}</strong>
                    </div>
                  </div>

                  {/* Dates & Schedule */}
                  <div className="mt-2.5 text-xs text-stone-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Seeding:</span>
                      <span className="font-mono text-stone-800">{formatDateDisplay(customer.seedingDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Expected Planting:</span>
                      <span className={`font-mono font-bold ${hasOverduePlanting ? 'text-red-600' : 'text-stone-900'}`}>
                        {formatDateDisplay(customer.expectedPlantingDate)}
                      </span>
                    </div>

                    {customer.seedVariety && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Paddy Seed:</span>
                        <span className="text-stone-800 font-medium truncate max-w-[150px]">
                          {customer.seedVariety}
                        </span>
                      </div>
                    )}

                    {/* Seed Usage and Bag Requirement */}
                    <div className="flex items-center justify-between text-[11px] bg-stone-50 rounded-lg px-2 py-1 border border-stone-200">
                      <span className="text-stone-600 flex items-center gap-1 font-medium">
                        <Sprout className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Seed (30kg/bag):</span>
                      </span>
                      <span className="font-mono font-bold text-stone-900 text-right">
                        {(() => {
                          const calc = calculateSeedBags(customer.seedUsedKg);
                          if (!calc) return <span className="text-stone-400 font-sans font-normal text-[10px]">Not recorded</span>;
                          return (
                            <span>
                              {calc.seedUsedKg} kg ({calc.wholeBagsRequired} bag{calc.wholeBagsRequired !== 1 ? 's' : ''})
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Financial Balance Summary */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-stone-400">Balance Due</div>
                      <div className="text-base font-black text-amber-700 tabular-nums leading-none mt-0.5">
                        {formatCurrency(customer.remainingBalance)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-400">Total: {formatCurrency(customer.totalCharge)}</div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        customer.paymentStatus === 'Fully Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : customer.paymentStatus === 'Partially Paid'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (View, Edit, Download PDF, Share, Delete) */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[150px]">
                    <button
                      onClick={() => onSelectCustomer(customer)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition min-h-[38px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-600" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => onEditCustomer(customer)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition min-h-[38px]"
                    >
                      <Edit className="w-3.5 h-3.5 text-stone-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => (onDownloadPdf ? onDownloadPdf(customer) : onGeneratePdf(customer))}
                      className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition min-h-[38px] border border-emerald-200"
                      title="Download PDF Bill/Receipt directly"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>PDF</span>
                    </button>

                    {onSharePdf && (
                      <button
                        onClick={() => onSharePdf(customer)}
                        className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition min-h-[38px]"
                        title="Share Receipt"
                      >
                        <Share2 className="w-3.5 h-3.5 text-stone-600" />
                      </button>
                    )}

                    <button
                      onClick={() => setCustomerPendingDelete(customer)}
                      className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition min-h-[38px]"
                      title="Delete Customer Record"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Delete Customer */}
      {customerPendingDelete && (() => {
        const linkedSchedules = schedules.filter(s => s.customerId === customerPendingDelete.id);
        const hasLinkedSchedules = linkedSchedules.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-red-200">
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Delete Customer Record</h3>
                  <p className="text-xs text-red-600 font-bold">
                    {hasLinkedSchedules
                      ? `Warning: This customer has ${linkedSchedules.length} linked planting schedule(s)`
                      : 'Are you sure you want to permanently delete this customer?'}
                  </p>
                </div>
              </div>

              {hasLinkedSchedules && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1 my-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Linked Schedules Notice</span>
                  </div>
                  <p>
                    Deleting this customer will also permanently delete their{' '}
                    <strong>{linkedSchedules.length} linked planting schedule(s)</strong> from the calendar to maintain data integrity.
                  </p>
                </div>
              )}

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1.5 my-3">
                <div className="flex justify-between">
                  <span className="text-stone-500">Farmer:</span>
                  <span className="font-bold text-stone-900">{customerPendingDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Village:</span>
                  <span className="font-medium text-stone-800">{customerPendingDelete.village}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Customer ID:</span>
                  <span className="font-mono text-stone-800">{customerPendingDelete.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Land Area:</span>
                  <span className="font-semibold text-stone-800">
                    {customerPendingDelete.acres} Ac {customerPendingDelete.cents > 0 ? `${customerPendingDelete.cents} Cts` : ''} · {customerPendingDelete.machineryType}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200">
                  <span className="text-stone-500">Total Charge:</span>
                  <span className="font-bold text-stone-900">{formatCurrency(customerPendingDelete.totalCharge)}</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 mb-4">
                This record will be permanently deleted from the shared Firestore database and removed from all mobile and laptop screens immediately.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setCustomerPendingDelete(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 min-h-[40px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isDeleting
                      ? 'Deleting...'
                      : hasLinkedSchedules
                      ? `Delete Customer & ${linkedSchedules.length} Schedule(s)`
                      : 'Yes, Permanently Delete'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
