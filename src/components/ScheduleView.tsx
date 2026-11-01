import React, { useState, useMemo } from 'react';
import { PlantingSchedule, Customer, Language, UserProfile, MachineryType, ScheduleStatus } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  formatCurrency,
  formatDateDisplay,
  cleanMobileNumber,
  DEFAULT_RATES,
  generateCustomerId,
  generateScheduleId,
  doTimeSlotsOverlap,
  findConflictingSchedules,
  calculateSeedBags,
  SEED_BAG_CAPACITY_KG,
  SeedBagCalculationResult,
} from '../utils/calculations';
import { exportSchedulesToCSV } from '../utils/csvExport';
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Tractor,
  PlusCircle,
  Search,
  Filter,
  Download,
  Share2,
  FileSpreadsheet,
  Edit,
  Trash2,
  X,
  MapPin,
  Check,
  AlertCircle,
  UserCheck,
  UserPlus,
  ExternalLink,
  Sprout,
} from 'lucide-react';

interface ScheduleViewProps {
  schedules: PlantingSchedule[];
  customers: Customer[];
  language: Language;
  activeProfile?: UserProfile;
  onSelectCustomer?: (customer: Customer) => void;
  onSaveSchedule: (schedule: PlantingSchedule) => Promise<void>;
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
  onDownloadSchedulePdf: (schedules: PlantingSchedule[]) => void;
  onShareSchedulePdf: (schedules: PlantingSchedule[]) => void;
}

const TIME_SLOT_OPTIONS = [
  'Morning (6:00 AM - 10:00 AM)',
  'Morning (8:00 AM - 12:00 PM)',
  'Afternoon (1:00 PM - 5:00 PM)',
  'Evening (3:00 PM - 7:00 PM)',
  'Full Day',
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  customers,
  language,
  activeProfile,
  onSelectCustomer,
  onSaveSchedule,
  onSaveCustomer,
  onDeleteSchedule,
  onDownloadSchedulePdf,
  onShareSchedulePdf,
}) => {
  const t = useTranslation(language);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter & Search states
  const [selectedStatusTab, setSelectedStatusTab] = useState<'All' | ScheduleStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PlantingSchedule | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Customer selection mode: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [seedVariety, setSeedVariety] = useState('BPT 5204 (Samba Mahsuri)');
  const [seedUsedKg, setSeedUsedKg] = useState<number | ''>('');
  const [machineryType, setMachineryType] = useState<MachineryType>('Small Machine');
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [scheduledTime, setScheduledTime] = useState(TIME_SLOT_OPTIONS[0]);
  const [acres, setAcres] = useState<number>(1);
  const [cents, setCents] = useState<number>(0);
  const [status, setStatus] = useState<ScheduleStatus>('Scheduled');
  const [notes, setNotes] = useState('');

  // Rate calculation
  const ratePerCent = machineryType === 'Small Machine' ? DEFAULT_RATES.smallCent : DEFAULT_RATES.largeCent;
  const totalCents = acres * 100 + cents;
  const totalAmount = totalCents * ratePerCent;

  // Real-time Seed Bag Calculation (30 kg / bag standard)
  const seedBagCalc = useMemo(() => calculateSeedBags(seedUsedKg), [seedUsedKg]);

  // Real-time conflict check for candidate form inputs taking time slots into account
  const formConflicts = useMemo(() => {
    return findConflictingSchedules(schedules, {
      id: editingSchedule?.id,
      scheduledDate,
      machineryType,
      timeSlot: scheduledTime,
      scheduledTime,
    });
  }, [schedules, scheduledDate, machineryType, scheduledTime, editingSchedule]);

  // Filtered customer list for modal autocomplete search
  const filteredModalCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers.slice(0, 8);
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.village.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [customers, customerSearchQuery]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingSchedule(null);
    setFormFeedback(null);
    setCustomerMode(customers.length > 0 ? 'existing' : 'new');
    setCustomerSearchQuery('');
    setSelectedCustomerId('');
    setFarmerName('');
    setMobile('');
    setVillage('');
    setAddress('');
    setSeedVariety('BPT 5204 (Samba Mahsuri)');
    setSeedUsedKg('');
    setMachineryType('Small Machine');
    setScheduledDate(todayStr);
    setScheduledTime(TIME_SLOT_OPTIONS[0]);
    setAcres(1);
    setCents(0);
    setStatus('Scheduled');
    setNotes('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (schedule: PlantingSchedule) => {
    setEditingSchedule(schedule);
    setFormFeedback(null);
    setCustomerMode('existing');
    setCustomerSearchQuery('');
    setSelectedCustomerId(schedule.customerId || '');
    setFarmerName(schedule.customerName);
    setMobile(cleanMobileNumber(schedule.mobile));
    setVillage(schedule.village);
    setAddress('');
    setSeedUsedKg(schedule.seedUsedKg !== undefined && schedule.seedUsedKg !== null ? schedule.seedUsedKg : '');
    setMachineryType(schedule.machineryType);
    setScheduledDate(schedule.scheduledDate);
    setScheduledTime(schedule.timeSlot || schedule.scheduledTime || TIME_SLOT_OPTIONS[0]);
    setAcres(schedule.acres);
    setCents(schedule.cents);
    setStatus(schedule.status);
    setNotes(schedule.notes || '');
    setIsModalOpen(true);
  };

  // Select customer auto-fill
  const handleCustomerSelection = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find(c => c.id === custId);
    if (found) {
      setFarmerName(found.name);
      setMobile(cleanMobileNumber(found.mobile));
      setVillage(found.village);
      setMachineryType(found.machineryType);
      setAcres(found.acres);
      setCents(found.cents);
      if (found.seedUsedKg !== undefined && found.seedUsedKg !== null) {
        setSeedUsedKg(found.seedUsedKg);
      }
      if (found.expectedPlantingDate) {
        setScheduledDate(found.expectedPlantingDate);
      }
      setFormFeedback({
        type: 'info',
        message: `Selected registered farmer ${found.name} (${found.id}). Customer details linked.`,
      });
    }
  };

  // Submit Schedule form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!farmerName.trim()) {
      setFormFeedback({ type: 'error', message: 'Please enter farmer name.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFormFeedback(null);
      const cleanMobile = cleanMobileNumber(mobile);

      let targetCustomerId = selectedCustomerId;

      // 1. If registering a new customer through the schedule form, save to Customer collection first!
      if (customerMode === 'new' && !selectedCustomerId) {
        const generatedCustId = generateCustomerId(customers.map(c => c.id));
        const newCustomerRecord: Customer = {
          id: generatedCustId,
          name: farmerName.trim(),
          village: village.trim() || 'Malaimedu',
          mobile: cleanMobile || '9876543210',
          address: address.trim() || undefined,
          acres: Number(acres) || 0,
          cents: Number(cents) || 0,
          seedVariety: seedVariety.trim() || 'BPT 5204 (Samba Mahsuri)',
          seedUsedKg: seedUsedKg === '' ? undefined : Number(seedUsedKg),
          seedBags: seedBagCalc ? seedBagCalc.roundedDecimalBags : undefined,
          wholeBagsRequired: seedBagCalc ? seedBagCalc.wholeBagsRequired : undefined,
          machineryType,
          rateType: 'Per Cent',
          customRatePerUnit: ratePerCent,
          seedingDate: scheduledDate,
          plantingIntervalDays: 22,
          expectedPlantingDate: scheduledDate,
          isPlantingDateOverridden: false,
          actualPlantingDate: null,
          bookingStatus: 'Booked',
          baseCharge: totalAmount,
          discountAmount: 0,
          totalCharge: totalAmount,
          advancePayment: 0,
          totalCustomerPaid: 0,
          remainingBalance: totalAmount,
          paymentStatus: 'Unpaid',
          paymentHistory: [],
          employees: [],
          season: '2026-27',
          createdByRole: activeProfile?.role || 'Owner',
          createdByName: activeProfile?.name || 'RAJA S',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: notes.trim() || undefined,
        };

        // Save customer record to shared Firestore and IndexedDB
        await onSaveCustomer(newCustomerRecord);
        targetCustomerId = generatedCustId;
        // Keep customer selected so retry won't create duplicate
        setSelectedCustomerId(generatedCustId);
        setCustomerMode('existing');
      }

      // If still missing customerId, generate stable id
      if (!targetCustomerId) {
        targetCustomerId = generateCustomerId(customers.map(c => c.id));
      }

      // 2. Build the planting schedule record referencing targetCustomerId
      const scheduleId = editingSchedule
        ? editingSchedule.id
        : generateScheduleId(schedules.map(s => s.id));

      const scheduleData: PlantingSchedule = {
        id: scheduleId,
        customerId: targetCustomerId,
        customerName: farmerName.trim(),
        village: village.trim() || 'Malaimedu',
        mobile: cleanMobile,
        machineryType,
        scheduledDate,
        timeSlot: scheduledTime,
        scheduledTime: scheduledTime,
        acres: Number(acres) || 0,
        cents: Number(cents) || 0,
        totalCents,
        ratePerCent,
        totalAmount,
        seedUsedKg: seedUsedKg === '' ? undefined : Number(seedUsedKg),
        seedBags: seedBagCalc ? seedBagCalc.roundedDecimalBags : undefined,
        wholeBagsRequired: seedBagCalc ? seedBagCalc.wholeBagsRequired : undefined,
        status,
        notes: notes.trim(),
        createdAt: editingSchedule?.createdAt || new Date().toISOString(),
        createdByRole: editingSchedule?.createdByRole || activeProfile?.role || 'Owner',
        createdByName: editingSchedule?.createdByName || activeProfile?.name || 'RAJA S',
        updatedByRole: activeProfile?.role || 'Owner',
        updatedByName: activeProfile?.name || 'RAJA S',
        updatedAt: new Date().toISOString(),
      };

      await onSaveSchedule(scheduleData);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save schedule/customer:', err);
      setFormFeedback({
        type: 'error',
        message: err?.message || 'Database error occurred while saving. Please check connection and click Save again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status change
  const handleQuickStatusChange = async (schedule: PlantingSchedule, newStatus: ScheduleStatus) => {
    const updated: PlantingSchedule = {
      ...schedule,
      status: newStatus,
      updatedByRole: activeProfile?.role || 'Owner',
      updatedByName: activeProfile?.name || 'RAJA S',
      updatedAt: new Date().toISOString(),
    };
    await onSaveSchedule(updated);
  };

  // Delete schedule (does NOT delete customer)
  const handleConfirmDelete = async () => {
    if (!deletingScheduleId) return;
    try {
      await onDeleteSchedule(deletingScheduleId);
      setDeletingScheduleId(null);
    } catch (err) {
      console.error('Delete schedule failed:', err);
    }
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (selectedStatusTab !== 'All' && s.status !== selectedStatusTab) return false;
      if (dateFilter && s.scheduledDate !== dateFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = s.customerName.toLowerCase().includes(query);
        const matchesVillage = s.village.toLowerCase().includes(query);
        const matchesMobile = s.mobile.includes(query);
        const matchesId = s.id.toLowerCase().includes(query);
        const matchesCustId = s.customerId ? s.customerId.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesVillage && !matchesMobile && !matchesId && !matchesCustId) return false;
      }
      return true;
    });
  }, [schedules, selectedStatusTab, dateFilter, searchQuery]);

  // Tab counts
  const tabCounts = {
    All: schedules.length,
    Scheduled: schedules.filter(s => s.status === 'Scheduled').length,
    'In Progress': schedules.filter(s => s.status === 'In Progress').length,
    Pending: schedules.filter(s => s.status === 'Pending').length,
    Completed: schedules.filter(s => s.status === 'Completed').length,
  };

  return (
    <div className="space-y-4 pb-16 max-w-7xl mx-auto px-3 sm:px-6 pt-2">
      {/* Header and Top Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              {language === 'ta' ? 'நடவு அட்டவணை மேலாண்மை' : 'Planting Schedule Management'}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {language === 'ta'
              ? 'இயந்திர முன்பதிவு, நேர இடைவெளி & நிகழ்நேர மோதல் தடுப்பு அமைப்பு'
              : 'Machinery allocation, scheduled time slots & real-time conflict detection'}
          </p>
        </div>

        {/* Action Buttons: Add, Download PDF, Share, Export CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Schedule</span>
          </button>

          <button
            onClick={() => onDownloadSchedulePdf(filteredSchedules.length > 0 ? filteredSchedules : schedules)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px]"
            title="Download PDF directly to device"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Download</span> PDF
          </button>

          <button
            onClick={() => onShareSchedulePdf(filteredSchedules.length > 0 ? filteredSchedules : schedules)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px]"
            title="Share PDF Schedule via WhatsApp or Apps"
          >
            <Share2 className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={() => exportSchedulesToCSV(schedules)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px]"
            title="Export CSV to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder={
              language === 'ta'
                ? 'விவசாயி பெயர், ஊர் அல்லது எண் கொண்டு தேடவும்...'
                : 'Search schedules by farmer name, village, mobile, or ID...'
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs min-h-[44px]"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs min-h-[44px] font-mono"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold min-h-[44px] px-3 shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-stone-200/80 rounded-xl">
        {(['All', 'Scheduled', 'In Progress', 'Pending', 'Completed'] as const).map(tab => {
          const isActive = selectedStatusTab === tab;
          const count = tabCounts[tab];
          return (
            <button
              key={tab}
              onClick={() => setSelectedStatusTab(tab)}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 min-h-[40px] ${
                isActive ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="truncate">{tab}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-300 text-stone-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Schedules List or Empty State */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7 text-emerald-700" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-stone-900">
              No planting schedules yet. Add your first schedule.
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Both Owner and Manager can plan paddy transplanter machine operations, avoid time-slot conflicts, and synchronize across all devices.
            </p>
          </div>
          <div>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-2 min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add First Schedule</span>
            </button>
          </div>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center shadow-xs">
          <Filter className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-stone-800">No schedules match your filters</h4>
          <p className="text-xs text-stone-500 mt-1">Try clearing your search query or date filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSchedules.map(schedule => {
            const isToday = schedule.scheduledDate === todayStr;
            const conflicts = findConflictingSchedules(schedules, {
              id: schedule.id,
              scheduledDate: schedule.scheduledDate,
              machineryType: schedule.machineryType,
              timeSlot: schedule.timeSlot || schedule.scheduledTime,
              scheduledTime: schedule.scheduledTime,
            });
            const hasConflict = conflicts.length > 0 && schedule.status !== 'Completed';
            const linkedCustomer = customers.find(c => c.id === schedule.customerId);

            return (
              <div
                key={schedule.id}
                className={`bg-white rounded-2xl p-4 border shadow-2xs flex flex-col justify-between transition hover:shadow-xs ${
                  hasConflict
                    ? 'border-red-300 bg-red-50/15'
                    : isToday
                    ? 'border-emerald-300 ring-1 ring-emerald-500/20'
                    : 'border-stone-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Status & Date Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          schedule.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : schedule.status === 'In Progress'
                            ? 'bg-purple-100 text-purple-800'
                            : schedule.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {schedule.status}
                      </span>

                      {/* Customer ID Badge */}
                      {schedule.customerId && (
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {schedule.customerId}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday ? 'text-emerald-700 underline underline-offset-2' : 'text-stone-800'
                        }`}
                      >
                        {formatDateDisplay(schedule.scheduledDate)}
                      </span>
                    </div>
                  </div>

                  {/* Conflict Alert Warning Badge if overlap exists */}
                  {hasConflict && (
                    <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[11px] font-bold text-red-900">
                          Time-Slot Conflict Detected
                        </strong>
                        <p className="text-[10px] text-red-700">
                          {schedule.machineryType} overlaps with {conflicts.map(c => `${c.customerName} (${c.timeSlot || c.scheduledTime || 'Full Day'})`).join(', ')}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Farmer Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 leading-snug">
                        {schedule.customerName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{schedule.village}</span>
                      </div>
                    </div>

                    <a
                      href={`tel:${cleanMobileNumber(schedule.mobile)}`}
                      className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs"
                      title={`Call ${schedule.customerName}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Machinery & Land Details */}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Machinery:</span>
                      <strong className="text-stone-800">
                        {schedule.machineryType}{' '}
                        <span className="text-[10px] font-normal text-stone-500">
                          (₹{schedule.ratePerCent}/cent)
                        </span>
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-stone-500">Land Area:</span>
                      <strong className="text-stone-800">
                        {schedule.acres > 0 ? `${schedule.acres} ac ` : ''}
                        {schedule.cents} cents{' '}
                        <span className="text-[10px] text-stone-500 font-normal">
                          ({schedule.totalCents} cents total)
                        </span>
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-stone-500">Time Window:</span>
                      <span className="text-stone-800 font-medium">
                        {schedule.timeSlot || schedule.scheduledTime || 'Full Day'}
                      </span>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-stone-200">
                      <span className="text-stone-500">Seed Usage &amp; Bags:</span>
                      <span className="text-emerald-950 font-semibold text-[11px]">
                        {schedule.seedUsedKg !== undefined && schedule.seedUsedKg !== null
                          ? `${schedule.seedUsedKg} kg (${calculateSeedBags(schedule.seedUsedKg)?.displayText || ''})`
                          : <span className="text-stone-400 italic font-normal">Not recorded</span>}
                      </span>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-stone-200">
                      <span className="text-stone-500">Total Calculation:</span>
                      <strong className="text-emerald-800 font-mono font-bold">
                        {formatCurrency(schedule.totalAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {schedule.notes && (
                    <div className="text-[11px] text-stone-600 bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                      <span className="font-bold text-amber-900 block text-[10px] uppercase">Notes</span>
                      {schedule.notes}
                    </div>
                  )}

                  {/* Audit Trail Badge */}
                  {(schedule.createdByRole || schedule.updatedByRole) && (
                    <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 text-right">
                      <span>
                        Created by:{' '}
                        <strong className="text-stone-700">
                          {schedule.createdByRole} ({schedule.createdByName})
                        </strong>
                      </span>
                      {schedule.updatedByRole && schedule.updatedByRole !== schedule.createdByRole && (
                        <span>
                          Updated: <strong>{schedule.updatedByRole}</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={schedule.status}
                    onChange={e => handleQuickStatusChange(schedule, e.target.value as ScheduleStatus)}
                    className="text-xs py-1.5 px-2 bg-stone-100 border border-stone-200 rounded-xl font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    {linkedCustomer && onSelectCustomer && (
                      <button
                        onClick={() => onSelectCustomer(linkedCustomer)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition flex items-center gap-1 text-[11px] font-bold"
                        title="View Full Customer Profile"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Farmer</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(schedule)}
                      className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                      title="Edit schedule"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingScheduleId(schedule.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                      title="Delete schedule (preserves customer)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Tractor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {editingSchedule ? 'Edit Planting Schedule' : 'New Planting Schedule'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Synced permanently to shared cloud database
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formFeedback && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  formFeedback.type === 'error'
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : formFeedback.type === 'info'
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 mt-4">
              {/* Customer Selection Tabs (Only when adding new schedule) */}
              {!editingSchedule && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Customer Source <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('existing')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        customerMode === 'existing'
                          ? 'bg-white text-emerald-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Select Existing Farmer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerMode('new');
                        setSelectedCustomerId('');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        customerMode === 'new'
                          ? 'bg-white text-emerald-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register New Farmer</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 1: Search & Pick Existing Customer */}
              {customerMode === 'existing' && !editingSchedule && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search existing farmers by name, village, mobile, or ID..."
                      value={customerSearchQuery}
                      onChange={e => setCustomerSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <select
                      value={selectedCustomerId}
                      onChange={e => handleCustomerSelection(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 font-medium"
                    >
                      <option value="">-- Choose from {filteredModalCustomers.length} matching farmers --</option>
                      {filteredModalCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.village} · {c.mobile} ({c.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCustomerId && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <span>✓ Farmer linked: <strong>{farmerName}</strong> ({selectedCustomerId})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId('');
                          setFarmerName('');
                          setMobile('');
                          setVillage('');
                        }}
                        className="text-stone-500 hover:text-stone-800 underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Register New Farmer Banner */}
              {customerMode === 'new' && !editingSchedule && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Automatic Permanent Save:</strong> This farmer will be saved immediately to the <strong>Customers</strong> page and synced to both Owner & Manager devices.
                  </p>
                </div>
              )}

              {/* Farmer Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Farmer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={farmerName}
                    onChange={e => setFarmerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Contact Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono"
                  />
                </div>
              </div>

              {/* Village & Optional Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Village / Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    placeholder="e.g. Malaimedu"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Address / Field Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. East Street near Canal"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Machinery Type & Rates */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Machinery Type & Standard Rate
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMachineryType('Small Machine')}
                    className={`p-3 rounded-xl border text-left transition ${
                      machineryType === 'Small Machine'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Small Machine (4-row)</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">₹45 / cent</div>
                    <div className="text-[10px] text-stone-500">₹4,500 / acre</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMachineryType('Large Machine')}
                    className={`p-3 rounded-xl border text-left transition ${
                      machineryType === 'Large Machine'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold">Large Machine (8-row)</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">₹40 / cent</div>
                    <div className="text-[10px] text-stone-500">₹4,000 / acre</div>
                  </button>
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Scheduled Planting Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Time Slot / Window <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-medium"
                  >
                    {TIME_SLOT_OPTIONS.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real Conflict Alert Warning in Form (Checks date, machine, and time slot) */}
              {formConflicts.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Machine Conflict Alert</span>
                  </div>
                  <p>
                    <strong>{machineryType}</strong> is already booked on{' '}
                    <strong>{formatDateDisplay(scheduledDate)}</strong> for:
                  </p>
                  <ul className="list-disc list-inside font-semibold text-amber-800">
                    {formConflicts.map(c => (
                      <li key={c.id}>
                        {c.customerName} ({c.village}) · {c.timeSlot || c.scheduledTime || 'Full Day'}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-700 pt-1">
                    You can adjust the time slot or scheduled date, or still save if this is an intentional shared machine arrangement.
                  </p>
                </div>
              )}

              {/* Land Area: Acres & Cents */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Acres
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={acres}
                    onChange={e => setAcres(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cents (0 - 99)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={cents}
                    onChange={e => setCents(Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono"
                  />
                </div>
              </div>

              {/* Seed Usage & Bag Requirement — 30 kg per Bag */}
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                    <Sprout className="w-4 h-4 text-emerald-700" />
                    <span>Seed Usage &amp; Bag Requirement</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300/50">
                    1 Bag = 30 kg
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Seed Used (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={seedUsedKg}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '') {
                            setSeedUsedKg('');
                          } else {
                            const n = parseFloat(val);
                            setSeedUsedKg(isNaN(n) ? '' : Math.max(0, n));
                          }
                        }}
                        placeholder="e.g. 75, 60, or 25"
                        className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold bg-white border border-stone-300 rounded-xl"
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] font-bold text-stone-400">kg</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Leave empty for &quot;Not recorded&quot;</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      Seed Bags Required
                    </span>
                    {seedBagCalc ? (
                      <div className="text-xs font-bold text-emerald-900 mt-0.5">
                        {seedBagCalc.displayText}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 italic">Not recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculated Price Summary */}
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-stone-600 block">Total Area & Rate:</span>
                  <strong className="text-emerald-950">
                    {totalCents} cents @ ₹{ratePerCent}/cent
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block text-[10px]">Estimated Total</span>
                  <strong className="text-base text-emerald-800 font-mono font-bold">
                    {formatCurrency(totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Schedule Status
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Scheduled', 'In Progress', 'Pending', 'Completed'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition ${
                        status === st
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Field Notes or Operator Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Near big well, water leveled yesterday"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : editingSchedule
                      ? 'Save Changes'
                      : customerMode === 'new'
                      ? 'Save Customer & Schedule'
                      : 'Create Schedule'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Schedule Confirmation Modal */}
      {deletingScheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-stone-900 space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-stone-900">Delete Planting Schedule?</h4>
              <p className="text-xs text-stone-500 mt-1">
                This schedule will be permanently removed from the schedule list. The customer record will remain safely preserved in the Customers directory.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingScheduleId(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition min-h-[40px]"
              >
                Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
