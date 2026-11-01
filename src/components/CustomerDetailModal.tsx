import React, { useState } from 'react';
import { Customer, PlantingSchedule, Language, PaymentRecord, PaymentMethod, UserProfile } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  formatCurrency,
  formatDateDisplay,
  cleanMobileNumber,
  calculateRemainingBalance,
  determinePaymentStatus,
  calculateSeedBags,
  SEED_BAG_CAPACITY_KG,
} from '../utils/calculations';
import {
  X,
  Phone,
  Edit,
  FileText,
  CreditCard,
  Calendar,
  Tractor,
  MapPin,
  HardHat,
  Plus,
  Share2,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Download,
  UserCheck,
  Sprout,
  Scale,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  schedules?: PlantingSchedule[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onAddPayment: (customerId: string, payment: PaymentRecord) => Promise<void>;
  onDownloadPdf: (customer: Customer) => void;
  onSharePdf: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => Promise<void>;
  language: Language;
  activeProfile?: UserProfile;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  schedules = [],
  isOpen,
  onClose,
  onEdit,
  onAddPayment,
  onDownloadPdf,
  onSharePdf,
  onDeleteCustomer,
  language,
  activeProfile,
}) => {
  const t = useTranslation(language);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  if (!isOpen || !customer) return null;

  const handleDelete = async () => {
    if (!onDeleteCustomer || !customer) return;
    setIsDeletingCustomer(true);
    try {
      await onDeleteCustomer(customer.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const newPay: PaymentRecord = {
        id: `PAY-${Date.now()}`,
        date: paymentDate,
        amount: paymentAmount,
        method: paymentMethod,
        notes: paymentNotes || 'Payment transaction',
        recordedBy: activeProfile ? `${activeProfile.role} (${activeProfile.name})` : 'Owner / Manager',
      };
      await onAddPayment(customer.id, newPay);
      setPaymentAmount(0);
      setPaymentNotes('');
      setShowAddPayment(false);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const seedCalc = calculateSeedBags(customer.seedUsedKg);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-stone-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-amber-300 text-xs">
              {customer.id.split('-').pop()}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">{customer.name}</h3>
              <div className="text-[11px] text-emerald-200 font-medium">
                {customer.village} · {customer.id}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            {/* Button 1: Download PDF */}
            <button
              onClick={() => onDownloadPdf(customer)}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-bold flex items-center gap-1 text-white transition border border-emerald-500/50"
              title="Download PDF Bill/Receipt directly"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download PDF</span>
            </button>

            {/* Button 2: Share */}
            <button
              onClick={() => onSharePdf(customer)}
              className="px-2 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold flex items-center gap-1 text-white transition"
              title="Share Bill/Receipt via WhatsApp / Email"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Share</span>
            </button>

            {onDeleteCustomer && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                title="Delete Customer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={() => onEdit(customer)}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-lg text-xs font-bold flex items-center gap-1 transition"
              title="Edit Customer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{t.edit}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 border border-red-200">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-stone-900">Confirm Customer Deletion</h4>
              </div>
              <p className="text-xs text-red-600 font-bold mb-2">
                Are you sure you want to permanently delete this customer?
              </p>
              <p className="text-xs text-stone-600 mb-4">
                <strong>{customer.name}</strong> ({customer.id}) from {customer.village} will be permanently removed from the shared Firestore database.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isDeletingCustomer}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingCustomer}
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  {isDeletingCustomer ? 'Deleting...' : 'Yes, Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Action Contact Strip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-800">Mobile Phone</div>
              <div className="text-sm font-bold text-emerald-950 font-mono mt-0.5">{customer.mobile}</div>
            </div>
            <a
              href={`tel:${cleanMobileNumber(customer.mobile)}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t.call}</span>
            </a>
          </div>

          {/* Audit Trail: Creator and Last Updater */}
          <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200/80 text-[11px] text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Created by: <strong className="text-stone-800">{customer.createdByRole || 'Owner'} ({customer.createdByName || 'RAJA S'})</strong> on {formatDateDisplay(customer.createdAt)}</span>
            </div>
            {customer.updatedByName && (
              <span className="text-stone-500 text-[10px]">
                Updated by: <strong>{customer.updatedByRole || 'Manager'} ({customer.updatedByName})</strong>
              </span>
            )}
          </div>

          {/* Land & Machinery Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] uppercase text-stone-500 font-bold block">Land Cultivated Area</span>
              <strong className="text-stone-900 text-sm block mt-0.5">
                {customer.acres} Acres {customer.cents > 0 ? `& ${customer.cents} Cents` : ''}
              </strong>
              <span className="text-stone-500 text-[11px]">
                ({customer.acres * 100 + customer.cents} Total Cents)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] uppercase text-stone-500 font-bold block">Machinery &amp; Rate</span>
              <strong className="text-stone-900 text-sm block mt-0.5">{customer.machineryType}</strong>
              <div className="text-emerald-800 font-bold text-xs mt-0.5">
                ₹{customer.customRatePerUnit || (customer.machineryType === 'Small Machine' ? 45 : 40)} / cent
              </div>
              <span className="text-stone-500 text-[11px]">{customer.rateType} billing</span>
            </div>
          </div>

          {/* Seed Usage & Bag Calculation — 30 kg per Bag */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/80">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>Seed Usage &amp; Bag Requirement</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 border border-emerald-300/50">
                1 Bag = 30 kg
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Seed Used (kg)</span>
                <div className="font-bold text-stone-900 text-sm mt-0.5">
                  {customer.seedUsedKg !== undefined && customer.seedUsedKg !== null
                    ? `${customer.seedUsedKg} kg`
                    : <span className="text-stone-400 italic font-normal text-xs">Not recorded</span>}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Seed Bags Required</span>
                <div className="font-bold text-emerald-900 text-sm mt-0.5">
                  {seedCalc
                    ? `${seedCalc.roundedDecimalBags} bags`
                    : <span className="text-stone-400 italic font-normal text-xs">Not recorded</span>}
                </div>
                {seedCalc && (
                  <span className="text-[10px] text-stone-500">
                    {seedCalc.seedUsedKg} kg ÷ 30 kg
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Whole Bags for Purchasing</span>
                <div className="font-bold text-emerald-900 text-sm mt-0.5">
                  {seedCalc
                    ? `${seedCalc.wholeBagsRequired} whole ${seedCalc.wholeBagsRequired === 1 ? 'bag' : 'bags'} required`
                    : <span className="text-stone-400 italic font-normal text-xs">Not recorded</span>}
                </div>
                {seedCalc?.isFractional && (
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    (Rounded up for purchase)
                  </span>
                )}
              </div>
            </div>

            {seedCalc && (
              <div className="text-[11px] text-emerald-900 bg-white/80 p-2 rounded-lg border border-emerald-100/80 font-medium">
                Summary: <strong>{seedCalc.displayText}</strong>
              </div>
            )}
          </div>

          {/* Schedule Details */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Seed Variety:</span>
              <strong className="text-stone-800">{customer.seedVariety || 'Paddy'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Seeding Date:</span>
              <span className="font-mono font-bold text-stone-800">{formatDateDisplay(customer.seedingDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Expected Planting:</span>
              <span className="font-mono font-bold text-stone-900">
                {formatDateDisplay(customer.expectedPlantingDate)} ({customer.plantingIntervalDays || 22} days)
              </span>
            </div>
            {customer.actualPlantingDate && (
              <div className="flex items-center justify-between text-emerald-800 font-semibold">
                <span>Completed Planting:</span>
                <span className="font-mono">{formatDateDisplay(customer.actualPlantingDate)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-stone-200">
              <span className="text-stone-500">Booking Status:</span>
              <strong className="text-stone-900">{customer.bookingStatus}</strong>
            </div>
          </div>

          {/* Linked Planting Schedules in the System */}
          {(() => {
            const customerSchedules = schedules.filter(s => s.customerId === customer.id);
            return (
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Associated Planting Schedules ({customerSchedules.length})</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">ID: {customer.id}</span>
                </div>

                {customerSchedules.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {customerSchedules.map(s => (
                      <div
                        key={s.id}
                        className="p-2.5 bg-white rounded-lg border border-emerald-100 flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-bold text-stone-900">
                            {formatDateDisplay(s.scheduledDate)} ·{' '}
                            <span className="font-medium text-stone-600">{s.timeSlot || s.scheduledTime || 'Full Day'}</span>
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {s.machineryType} · {s.acres} ac {s.cents} ct · ₹{s.ratePerCent}/cent
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'In Progress'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {s.status}
                          </span>
                          <div className="text-xs font-mono font-bold text-emerald-800 mt-0.5">
                            {formatCurrency(s.totalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-500 text-[11px] italic">
                    No machine bookings scheduled yet for this customer.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Financial Breakdown & Balances */}
          <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-sm space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
              <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400">
                Financial Summary
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">
                {customer.paymentStatus}
              </span>
            </div>

            <div className="flex justify-between text-stone-300">
              <span>Base Calculated Charge:</span>
              <span className="font-mono">{formatCurrency(customer.baseCharge)}</span>
            </div>

            {customer.discountAmount > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>Discount / Concession:</span>
                <span className="font-mono">- {formatCurrency(customer.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-100 font-bold pt-1 border-t border-stone-800">
              <span>Total Billable Charge:</span>
              <span className="font-mono text-sm text-white">{formatCurrency(customer.totalCharge)}</span>
            </div>

            <div className="flex justify-between text-emerald-300">
              <span>Advance Collected:</span>
              <span className="font-mono">{formatCurrency(customer.advancePayment)}</span>
            </div>

            <div className="flex justify-between text-emerald-300">
              <span>Total Received:</span>
              <span className="font-mono font-bold">{formatCurrency(customer.totalCustomerPaid)}</span>
            </div>

            <div className="flex justify-between text-base font-black text-amber-400 pt-2 border-t border-stone-800">
              <span>Outstanding Balance:</span>
              <span className="font-mono text-lg">{formatCurrency(customer.remainingBalance)}</span>
            </div>
          </div>

          {/* Payment History & Add Payment Sub-Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t.paymentHistory}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addPaymentBtn}</span>
              </button>
            </div>

            {/* Add Payment Form */}
            {showAddPayment && (
              <form onSubmit={handleRecordPayment} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5">
                <div className="text-xs font-bold text-emerald-950">Record Customer Payment</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-stone-600 font-medium">Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      step="100"
                      value={paymentAmount || ''}
                      onChange={e => setPaymentAmount(parseInt(e.target.value, 10) || 0)}
                      placeholder="e.g. 3000"
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-emerald-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-600 font-medium">Payment Mode</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI (GPay/PhonePe)</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-600 font-medium">Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-stone-600 font-medium">Notes / Reference</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Received from farmer"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(false)}
                    className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment || paymentAmount <= 0}
                    className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            )}

            {/* List of Payments */}
            {customer.paymentHistory && customer.paymentHistory.length > 0 ? (
              <div className="space-y-1.5">
                {customer.paymentHistory.map((p, i) => (
                  <div
                    key={p.id || i}
                    className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900">
                        {formatCurrency(p.amount)} <span className="font-normal text-stone-500">via {p.method}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {formatDateDisplay(p.date)} {p.notes && `· ${p.notes}`}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">{p.recordedBy || 'Owner'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">{t.paymentHistoryEmpty}</p>
            )}
          </div>

          {/* Land Reference / G Land Photo Viewer */}
          {customer.landImage?.dataUrl && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Land Measurement / G Land Photo
              </h4>
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                <img
                  src={customer.landImage.dataUrl}
                  alt="Land Survey Sketch"
                  className="w-full max-h-72 object-contain rounded-lg"
                />
                <div className="mt-2 text-xs text-stone-600 flex justify-between">
                  <span>Captured: {formatDateDisplay(customer.landImage.capturedDate)}</span>
                  <span>{customer.landImage.notes || 'Field Sketch'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Seeding Workers Record */}
          {customer.employees && customer.employees.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Nursery & Seeding Labor Assigned
              </h4>
              <div className="space-y-1.5">
                {customer.employees.map((emp, i) => (
                  <div
                    key={emp.id || i}
                    className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900">{emp.employeeName}</div>
                      <div className="text-[11px] text-stone-500">{emp.notes || 'Nursery seeding'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-800">{formatCurrency(emp.amountPaid)}</div>
                      <div className="text-[10px] text-stone-400">{formatDateDisplay(emp.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-stone-800 block mb-0.5">Field Landmarks & Notes:</span>
              <p className="text-stone-700">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownloadPdf(customer)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition min-h-[44px]"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => onSharePdf(customer)}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold hover:bg-stone-300 transition min-h-[44px]"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Share</span>
            </button>
          </div>

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
