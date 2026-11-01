import React, { useState, useEffect } from 'react';
import {
  Customer,
  MachineryType,
  RateType,
  BookingStatus,
  Language,
  CustomerEmployeeAssignment,
  Employee,
  LandMeasurementImage,
} from '../types';
import { useTranslation } from '../i18n/translations';
import {
  calculateTotalCents,
  calculateTotalAcres,
  calculateBaseCharge,
  calculateTotalCharge,
  calculateRemainingBalance,
  determinePaymentStatus,
  calculatePlantingDate,
  formatCurrency,
  formatDateDisplay,
  generateCustomerId,
  cleanMobileNumber,
  calculateSeedBags,
  SEED_BAG_CAPACITY_KG,
  SeedBagCalculationResult,
} from '../utils/calculations';
import {
  X,
  Tractor,
  Calendar,
  CreditCard,
  User,
  MapPin,
  Phone,
  HardHat,
  Camera,
  Upload,
  Trash2,
  RotateCcw,
  ExternalLink,
  Plus,
  AlertCircle,
  Check,
  Sprout,
  Scale,
} from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => Promise<void>;
  onDelete?: (customerId: string) => Promise<void>;
  initialCustomer?: Customer | null;
  existingCustomerIds: string[];
  employeesList: Employee[];
  language: Language;
  activeProfile?: import('../types').UserProfile;
}

const COMMON_SEED_VARIETIES = [
  'BPT 5204 (Samba Mahsuri)',
  'ADT 45',
  'CO 51',
  'CR 1009',
  'RNR 15048 (Telangana Sona)',
  'ASD 16',
  'IR 20',
  'Poongar',
];

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialCustomer,
  existingCustomerIds,
  employeesList,
  language,
  activeProfile,
}) => {
  const t = useTranslation(language);
  const today = new Date().toISOString().slice(0, 10);

  // Form States
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [mobile, setMobile] = useState('');
  const [acres, setAcres] = useState<number>(1);
  const [cents, setCents] = useState<number>(0);
  const [seedVariety, setSeedVariety] = useState('');
  const [seedUsedKg, setSeedUsedKg] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Machinery & Schedule
  const [machineryType, setMachineryType] = useState<MachineryType>('Small Machine');
  const [rateType, setRateType] = useState<RateType>('Per Acre');
  const [customRate, setCustomRate] = useState<number | undefined>(undefined);
  const [seedingDate, setSeedingDate] = useState(today);
  const [plantingIntervalDays, setPlantingIntervalDays] = useState<22 | 23 | 24 | 25>(22);
  const [expectedPlantingDate, setExpectedPlantingDate] = useState('');
  const [isPlantingDateOverridden, setIsPlantingDateOverridden] = useState(false);
  const [actualPlantingDate, setActualPlantingDate] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('Booked');

  // Pricing & Advance
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [advanceMethod, setAdvanceMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [advanceNotes, setAdvanceNotes] = useState('');

  // Land image
  const [landImage, setLandImage] = useState<LandMeasurementImage | undefined>(undefined);
  const [imageDate, setImageDate] = useState(today);
  const [imageNotes, setImageNotes] = useState('');

  // Assigned Employees
  const [employees, setEmployees] = useState<CustomerEmployeeAssignment[]>([]);

  // Validation & Persistence Status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized Seed Bag Calculation (30 kg/bag standard)
  const seedBagCalc = React.useMemo(() => calculateSeedBags(seedUsedKg), [seedUsedKg]);

  useEffect(() => {
    if (initialCustomer) {
      setCustomerId(initialCustomer.id);
      setName(initialCustomer.name);
      setVillage(initialCustomer.village);
      setMobile(initialCustomer.mobile);
      setAcres(initialCustomer.acres);
      setCents(initialCustomer.cents);
      setSeedVariety(initialCustomer.seedVariety || '');
      setSeedUsedKg(
        initialCustomer.seedUsedKg !== undefined && initialCustomer.seedUsedKg !== null
          ? initialCustomer.seedUsedKg
          : ''
      );
      setNotes(initialCustomer.notes || '');
      setMachineryType(initialCustomer.machineryType);
      setRateType(initialCustomer.rateType);
      setCustomRate(initialCustomer.customRatePerUnit);
      setSeedingDate(initialCustomer.seedingDate);
      setPlantingIntervalDays(initialCustomer.plantingIntervalDays || 22);
      setExpectedPlantingDate(initialCustomer.expectedPlantingDate);
      setIsPlantingDateOverridden(initialCustomer.isPlantingDateOverridden || false);
      setActualPlantingDate(initialCustomer.actualPlantingDate || '');
      setBookingStatus(initialCustomer.bookingStatus);
      setDiscountAmount(initialCustomer.discountAmount || 0);
      setDiscountReason(initialCustomer.discountReason || '');
      setAdvancePayment(initialCustomer.advancePayment || 0);
      setLandImage(initialCustomer.landImage);
      setImageDate(initialCustomer.landImage?.capturedDate || today);
      setImageNotes(initialCustomer.landImage?.notes || '');
      setEmployees(initialCustomer.employees || []);
    } else {
      // New Customer
      const nextId = generateCustomerId(existingCustomerIds);
      setCustomerId(nextId);
      setName('');
      setVillage('');
      setMobile('');
      setAcres(1);
      setCents(0);
      setSeedVariety('BPT 5204 (Samba Mahsuri)');
      setSeedUsedKg('');
      setNotes('');
      setMachineryType('Small Machine');
      setRateType('Per Acre');
      setCustomRate(undefined);
      setSeedingDate(today);
      setPlantingIntervalDays(22);
      setExpectedPlantingDate(calculatePlantingDate(today, 22));
      setIsPlantingDateOverridden(false);
      setActualPlantingDate('');
      setBookingStatus('Booked');
      setDiscountAmount(0);
      setDiscountReason('');
      setAdvancePayment(0);
      setAdvanceMethod('Cash');
      setAdvanceNotes('Advance collected at registration');
      setLandImage(undefined);
      setImageDate(today);
      setImageNotes('');
      setEmployees([]);
    }
    setErrors({});
    setFormError(null);
    setShowConfirmDelete(false);
  }, [initialCustomer, isOpen]);

  // Seeding date / interval change handler
  const handleSeedingDateChange = (newDate: string) => {
    setSeedingDate(newDate);
    // Recalculate planting date only if NOT manually overridden
    if (!isPlantingDateOverridden) {
      setExpectedPlantingDate(calculatePlantingDate(newDate, plantingIntervalDays));
    }
  };

  const handleIntervalChange = (interval: 22 | 23 | 24 | 25) => {
    setPlantingIntervalDays(interval);
    if (!isPlantingDateOverridden) {
      setExpectedPlantingDate(calculatePlantingDate(seedingDate, interval));
    }
  };

  const handleManualPlantingDateChange = (newDate: string) => {
    setExpectedPlantingDate(newDate);
    const calculated = calculatePlantingDate(seedingDate, plantingIntervalDays);
    setIsPlantingDateOverridden(newDate !== calculated);
  };

  const handleRestoreCalculatedDate = () => {
    const calculated = calculatePlantingDate(seedingDate, plantingIntervalDays);
    setExpectedPlantingDate(calculated);
    setIsPlantingDateOverridden(false);
  };

  // Live Calculations
  const totalCents = calculateTotalCents(acres, cents);
  const totalAcres = calculateTotalAcres(acres, cents);
  const baseCharge = calculateBaseCharge(acres, cents, machineryType, rateType, customRate);
  const totalCharge = calculateTotalCharge(baseCharge, discountAmount);

  // If editing, existing payments sum or advancePayment
  const priorPaymentsTotal = initialCustomer
    ? initialCustomer.paymentHistory.reduce((sum, p) => sum + p.amount, 0)
    : advancePayment;
  const remainingBalance = calculateRemainingBalance(totalCharge, priorPaymentsTotal);
  const paymentStatus = determinePaymentStatus(totalCharge, priorPaymentsTotal);

  // Seeding Employee Helpers
  const handleAddEmployeeAssignment = () => {
    const newAss: CustomerEmployeeAssignment = {
      id: `ASN-${Date.now()}`,
      employeeName: employeesList[0]?.name || 'Nursery Worker',
      employeeId: employeesList[0]?.id || '',
      amountPaid: 800,
      date: seedingDate || today,
      notes: 'Tray seeding',
    };
    setEmployees([...employees, newAss]);
  };

  const handleUpdateEmployeeAssignment = (
    index: number,
    field: keyof CustomerEmployeeAssignment,
    value: any
  ) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    // If employee name changed from dropdown, update ID
    if (field === 'employeeName') {
      const match = employeesList.find(e => e.name === value);
      if (match) updated[index].employeeId = match.id;
    }
    setEmployees(updated);
  };

  const handleRemoveEmployeeAssignment = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  // Image Upload Handling (Compressed Base64 into IndexedDB)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const sizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        setLandImage({
          dataUrl: compressedDataUrl,
          capturedDate: imageDate,
          notes: imageNotes,
          fileSizeKb: sizeKb,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenGLandApp = () => {
    // Attempt standard intent / deep link or open play store info
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = 'intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end';
    } else {
      alert('Open your GPS Land Measurement app (such as G Land or GPS Fields Area Measure) to take a screenshot and attach it here.');
    }
  };

  // Validation & Save
  const handleValidateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Farmer name is required.';
    if (!village.trim()) newErrors.village = 'Village name is required.';
    const cleanedPhone = cleanMobileNumber(mobile);
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    }
    if (acres <= 0 && cents <= 0) {
      newErrors.land = 'Land area must be greater than 0.';
    }
    if (seedUsedKg !== '' && (isNaN(Number(seedUsedKg)) || Number(seedUsedKg) < 0)) {
      newErrors.seedUsedKg = 'Seed weight must be 0 kg or greater.';
    }
    if (!seedingDate) newErrors.seedingDate = 'Seeding date is required.';
    if (!expectedPlantingDate) newErrors.expectedPlantingDate = 'Planting date is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      // Build customer object
      const now = new Date().toISOString();
      const updatedPaymentHistory = initialCustomer
        ? [...initialCustomer.paymentHistory]
        : advancePayment > 0
        ? [
            {
              id: `PAY-${Date.now()}`,
              date: seedingDate || today,
              amount: advancePayment,
              method: advanceMethod,
              notes: advanceNotes || 'Advance payment at booking',
              recordedBy: 'Owner / Manager',
            },
          ]
        : [];

      const totalPaidAmount = updatedPaymentHistory.reduce((sum, p) => sum + p.amount, 0);

      const customerRecord: Customer = {
        id: customerId,
        name: name.trim(),
        village: village.trim(),
        mobile: cleanedPhone,
        acres: Number(acres) || 0,
        cents: Number(cents) || 0,
        seedVariety: seedVariety.trim(),
        seedUsedKg: seedUsedKg === '' ? undefined : Number(seedUsedKg),
        seedBags: seedBagCalc ? seedBagCalc.roundedDecimalBags : undefined,
        wholeBagsRequired: seedBagCalc ? seedBagCalc.wholeBagsRequired : undefined,
        notes: notes.trim(),
        machineryType,
        rateType,
        customRatePerUnit: customRate,
        seedingDate,
        plantingIntervalDays,
        expectedPlantingDate,
        isPlantingDateOverridden,
        actualPlantingDate: actualPlantingDate || null,
        bookingStatus,
        baseCharge,
        discountAmount,
        discountReason: discountReason.trim(),
        totalCharge,
        advancePayment: initialCustomer ? initialCustomer.advancePayment : advancePayment,
        totalCustomerPaid: totalPaidAmount,
        remainingBalance: calculateRemainingBalance(totalCharge, totalPaidAmount),
        paymentStatus: determinePaymentStatus(totalCharge, totalPaidAmount),
        paymentHistory: updatedPaymentHistory,
        employees,
        landImage: landImage
          ? {
              ...landImage,
              capturedDate: imageDate,
              notes: imageNotes,
            }
          : undefined,
        season: initialCustomer?.season || 'Samba / Thaladi 2026-27',
        createdByRole: initialCustomer?.createdByRole || (activeProfile ? activeProfile.role : 'Owner'),
        createdByName: initialCustomer?.createdByName || (activeProfile ? activeProfile.name : 'RAJA S'),
        updatedByRole: activeProfile ? activeProfile.role : 'Manager',
        updatedByName: activeProfile ? activeProfile.name : 'DINESH H',
        createdAt: initialCustomer?.createdAt || now,
        updatedAt: now,
      };

      await onSave(customerRecord);
      onClose();
    } catch (err: any) {
      console.error('Failed to save customer to database:', err);
      const errMsg = err?.message || 'Database error occurred while saving customer. Please check your network and retry.';
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-stone-200">
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tractor className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-base font-bold leading-tight">
                {initialCustomer ? t.editCustomerTitle : t.newCustomerTitle}
              </h3>
              <span className="text-[11px] text-emerald-200 font-mono">
                ID: {customerId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleValidateAndSave} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-red-950 mb-0.5">Database Save Error</div>
                <p className="text-red-800 leading-relaxed">{formError}</p>
                <p className="text-[11px] text-red-700 mt-1 font-medium">
                  Your entered customer details and seed data have been safely retained. Please click &quot;Save Customer&quot; below to retry.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Farmer Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-stone-200">
              <User className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.farmerDetailsSec}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.customerName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t.customerNamePlaceholder}
                  className={`w-full px-3 py-2 text-sm rounded-xl border ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-stone-50'
                  } focus:outline-none focus:border-emerald-600 focus:bg-white`}
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-0.5">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.villageName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder={t.villagePlaceholder}
                  className={`w-full px-3 py-2 text-sm rounded-xl border ${
                    errors.village ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-stone-50'
                  } focus:outline-none focus:border-emerald-600 focus:bg-white`}
                />
                {errors.village && <p className="text-[11px] text-red-600 mt-0.5">{errors.village}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.mobileNumber} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9840123456"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                      errors.mobile ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-stone-50'
                    } focus:outline-none focus:border-emerald-600 focus:bg-white`}
                  />
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                </div>
                {errors.mobile && <p className="text-[11px] text-red-600 mt-0.5">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.seedVariety}
                </label>
                <input
                  type="text"
                  value={seedVariety}
                  onChange={e => setSeedVariety(e.target.value)}
                  placeholder={t.seedVarietyPlaceholder}
                  list="seed-list"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
                <datalist id="seed-list">
                  {COMMON_SEED_VARIETIES.map(v => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Seed Usage & Bag Calculation — 30 kg per Bag */}
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Seed Usage & Bag Requirement
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300/50">
                  1 Bag = 30 kg
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
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
                          const num = parseFloat(val);
                          setSeedUsedKg(isNaN(num) ? '' : num);
                        }
                        if (errors.seedUsedKg) {
                          setErrors(prev => {
                            const { seedUsedKg: _, ...rest } = prev;
                            return rest;
                          });
                        }
                      }}
                      placeholder="e.g. 75, 60, or 25"
                      className={`w-full pl-3 pr-9 py-2 text-sm font-semibold rounded-xl border ${
                        errors.seedUsedKg ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-white'
                      } focus:outline-none focus:border-emerald-600`}
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-stone-400">kg</span>
                  </div>
                  {errors.seedUsedKg && <p className="text-[11px] text-red-600 mt-1">{errors.seedUsedKg}</p>}
                  <p className="text-[10px] text-stone-500 mt-1">
                    Enter seed in kg (leave blank for &quot;Not recorded&quot;)
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    Seed Bags Required
                  </span>
                  {seedBagCalc ? (
                    <div>
                      <div className="text-sm font-black text-emerald-900 leading-tight">
                        {seedBagCalc.displayText}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium mt-1 pt-1 border-t border-emerald-50">
                        {seedBagCalc.isFractional ? (
                          <>
                            Exact: <span className="font-mono font-bold">{seedBagCalc.roundedDecimalBags} bags</span> · Whole bags to purchase: <span className="font-mono font-bold text-emerald-900">{seedBagCalc.wholeBagsRequired}</span>
                          </>
                        ) : (
                          <>
                            Exact whole bags: <span className="font-mono font-bold">{seedBagCalc.wholeBagsRequired}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400 italic py-1">
                      Not recorded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Land Area: Acres and Cents */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {t.landMeasurement} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium text-stone-600">{t.acresLabel}:</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={acres}
                      onChange={e => setAcres(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-1.5 text-sm font-bold text-stone-900 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium text-stone-600">{t.centsLabel}:</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      value={cents}
                      onChange={e => setCents(Math.min(99, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                      className="w-full px-3 py-1.5 text-sm font-bold text-stone-900 rounded-lg border border-stone-300 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600 mt-2 pt-2 border-t border-stone-200">
                <span>{t.totalLandInCents}: <strong className="text-stone-900">{totalCents} Cents</strong></span>
                <span>{t.totalLandInAcres}: <strong className="text-stone-900">{totalAcres} Acres</strong></span>
              </div>
              {errors.land && <p className="text-[11px] text-red-600 mt-1">{errors.land}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t.notesOptional}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Section 2: Machinery & Planting Schedule */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-stone-200">
              <Tractor className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.machineryDetailsSec}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.machineryType}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMachineryType('Small Machine')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      machineryType === 'Small Machine'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">Small Machine</div>
                    <div className="text-[10px] font-semibold text-emerald-800 mt-0.5">₹45/Cent · ₹4,500/Ac</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMachineryType('Large Machine')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      machineryType === 'Large Machine'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">Large Machine</div>
                    <div className="text-[10px] font-semibold text-emerald-800 mt-0.5">₹40/Cent · ₹4,000/Ac</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.billingRateType}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRateType('Per Acre')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                      rateType === 'Per Acre'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    {t.perAcre}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRateType('Per Cent')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                      rateType === 'Per Cent'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    {t.perCent}
                  </button>
                </div>
              </div>
            </div>

            {/* Seeding & Planting Dates */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.seedingDate} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={seedingDate}
                    onChange={e => handleSeedingDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-emerald-600 font-mono"
                  />
                  {errors.seedingDate && <p className="text-[11px] text-red-600 mt-0.5">{errors.seedingDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.plantingInterval}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([22, 23, 24, 25] as const).map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleIntervalChange(days)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition ${
                          plantingIntervalDays === days
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {days}d {days === 22 && '★'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculated Planting Date with Override and Restore options */}
              <div className="pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <span>{t.expectedPlantingDate}</span>
                    {isPlantingDateOverridden && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                        {t.manuallyAdjustedBadge}
                      </span>
                    )}
                  </label>
                  {isPlantingDateOverridden && (
                    <button
                      type="button"
                      onClick={handleRestoreCalculatedDate}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t.restoreAutoCalculated}</span>
                    </button>
                  )}
                </div>

                <input
                  type="date"
                  value={expectedPlantingDate}
                  onChange={e => handleManualPlantingDateChange(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-xl border ${
                    isPlantingDateOverridden ? 'border-amber-400 bg-amber-50/40' : 'border-stone-300 bg-white'
                  } focus:outline-none focus:border-emerald-600 font-mono`}
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Expected: <strong className="text-stone-800">{formatDateDisplay(expectedPlantingDate)}</strong> ({plantingIntervalDays} days after seeding). You can manually edit if required.
                </p>
              </div>

              {/* Booking Status & Actual Completion Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.bookingStatus}
                  </label>
                  <select
                    value={bookingStatus}
                    onChange={e => setBookingStatus(e.target.value as BookingStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-medium text-stone-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Booked">{t.statusBooked}</option>
                    <option value="Seeding Completed">{t.statusSeedingCompleted}</option>
                    <option value="Planting Pending">{t.statusPlantingPending}</option>
                    <option value="Planting Completed">{t.statusPlantingCompleted}</option>
                    <option value="Cancelled">{t.statusCancelled}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {t.actualPlantingDate}
                  </label>
                  <input
                    type="date"
                    value={actualPlantingDate}
                    onChange={e => setActualPlantingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Payment Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-stone-200">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.paymentDetailsSec}
              </h4>
            </div>

            {/* Discount Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.discountAmount} (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.discountReason}
                </label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={e => setDiscountReason(e.target.value)}
                  placeholder="e.g. Village elder / neighbor courtesy"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 bg-stone-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Advance payment (only for new customer) */}
            {!initialCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    {t.advanceReceivedNow} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={advancePayment}
                    onChange={e => setAdvancePayment(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-emerald-300 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">
                    {t.paymentMethod}
                  </label>
                  <select
                    value={advanceMethod}
                    onChange={e => setAdvanceMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white text-stone-900"
                  >
                    <option value="Cash">{t.cash}</option>
                    <option value="UPI">{t.upi}</option>
                    <option value="Bank Transfer">{t.bankTransfer}</option>
                    <option value="Cheque">{t.cheque}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-950 mb-1">
                    {t.paymentNotes}
                  </label>
                  <input
                    type="text"
                    value={advanceNotes}
                    onChange={e => setAdvanceNotes(e.target.value)}
                    placeholder="Advance at booking"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Live Financial Breakdown Summary Card */}
            <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-sm space-y-2">
              <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800/80 text-xs">
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  Price Calculation ({machineryType})
                </div>
                <div className="text-emerald-100 font-mono font-bold mt-0.5">
                  {totalCents} Cents × ₹{machineryType === 'Small Machine' ? 45 : 40}/Cent = ₹{baseCharge.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  (1 Acre = 100 Cents · Small: ₹45/cent · Large: ₹40/cent)
                </div>
              </div>

              <div className="flex justify-between text-xs text-stone-300 pt-1">
                <span>{t.baseCharge} ({rateType}):</span>
                <span className="font-mono">{formatCurrency(baseCharge)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-amber-300">
                  <span>{t.discountAmount}:</span>
                  <span className="font-mono">- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-stone-800">
                <span>{t.totalCharge}:</span>
                <span className="font-mono text-base text-amber-400">{formatCurrency(totalCharge)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-300">
                <span>Total Paid Received:</span>
                <span className="font-mono">{formatCurrency(priorPaymentsTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-1.5 border-t border-stone-800">
                <span>{t.remainingBalance}:</span>
                <span className="font-mono text-lg text-emerald-400">{formatCurrency(remainingBalance)}</span>
              </div>
              <div className="text-right text-[11px] text-stone-400">
                Status: <strong className="text-white">{paymentStatus}</strong>
              </div>
            </div>
          </div>

          {/* Section 4: Land Measurement / G Land Reference */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  {t.gLandSec}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleOpenGLandApp}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{t.openGLandBtn}</span>
              </button>
            </div>

            <p className="text-xs text-stone-500">{t.gLandDesc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.measurementDate}
                </label>
                <input
                  type="date"
                  value={imageDate}
                  onChange={e => setImageDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.measurementNotes}
                </label>
                <input
                  type="text"
                  value={imageNotes}
                  onChange={e => setImageNotes(e.target.value)}
                  placeholder="e.g. Survey #142/2, 2.48 ac measured"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>
            </div>

            {/* Image Preview / Upload Controls */}
            {landImage ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-300 bg-stone-100 p-2">
                <img
                  src={landImage.dataUrl}
                  alt="Land Measurement Reference"
                  className="w-full max-h-56 object-contain rounded-lg bg-black/5"
                />
                <button
                  type="button"
                  onClick={() => setLandImage(undefined)}
                  className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-md transition"
                  title={t.removeImage}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="text-[10px] text-stone-500 mt-1.5 text-center">
                  Image attached ({landImage.fileSizeKb ? `${landImage.fileSizeKb} KB` : 'Attached'}). Included in customer PDF export.
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/40 text-stone-700 cursor-pointer transition min-h-[48px]">
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold">{t.uploadImage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-stone-300 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/40 text-stone-700 cursor-pointer transition min-h-[48px]">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold">{t.takePhoto}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Section 5: Seeding & Nursery Employees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  {t.employeeSec}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddEmployeeAssignment}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addEmployeeAssignment}</span>
              </button>
            </div>

            <p className="text-xs text-stone-500">{t.employeeWagesNote}</p>

            {employees.length === 0 ? (
              <div className="p-3 text-center bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500">
                No seeding employees assigned yet. Tap <strong>{t.addEmployeeAssignment}</strong> to record nursery labor and wages paid.
              </div>
            ) : (
              <div className="space-y-2">
                {employees.map((emp, index) => (
                  <div
                    key={emp.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                  >
                    <div>
                      <label className="block text-[10px] text-stone-500 font-medium">Worker Name</label>
                      <input
                        type="text"
                        value={emp.employeeName}
                        onChange={e => handleUpdateEmployeeAssignment(index, 'employeeName', e.target.value)}
                        list="workers-list"
                        className="w-full px-2 py-1 text-xs rounded border border-stone-300 bg-white font-medium"
                      />
                      <datalist id="workers-list">
                        {employeesList.map(w => (
                          <option key={w.id} value={w.name} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-medium">Wage Paid (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={emp.amountPaid}
                        onChange={e => handleUpdateEmployeeAssignment(index, 'amountPaid', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-2 py-1 text-xs font-bold rounded border border-stone-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-medium">Work Notes</label>
                      <input
                        type="text"
                        value={emp.notes || ''}
                        onChange={e => handleUpdateEmployeeAssignment(index, 'notes', e.target.value)}
                        placeholder="Nursery tray work"
                        className="w-full px-2 py-1 text-xs rounded border border-stone-300 bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployeeAssignment(index)}
                        className="text-red-600 hover:text-red-800 p-1 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            {initialCustomer && onDelete ? (
              <div>
                {showConfirmDelete ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-xs text-red-700 font-bold">
                      Are you sure you want to permanently delete this customer?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDelete(initialCustomer.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-2 py-1 bg-stone-200 text-stone-800 rounded-lg text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t.delete}</span>
                  </button>
                )}
              </div>
            ) : <div />}

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 min-h-[44px]"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{formError ? 'Retry Saving Customer' : initialCustomer ? t.updateCustomer : t.saveCustomer}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
