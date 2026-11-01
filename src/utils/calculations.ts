import { MachineryType, RateType, PaymentStatus } from '../types';

export const DEFAULT_RATES = {
  smallAcre: 4500,
  smallCent: 45,
  largeAcre: 4000,
  largeCent: 40,
};

/**
 * Calculate planting machine price directly by cents as required:
 * Small machine: ₹45 per cent
 * Large machine: ₹40 per cent
 * Total price = Number of cents × Rate per cent
 */
export function calculatePlantingPriceByCents(
  machineryType: MachineryType,
  totalCents: number,
  customCentRate?: number
): { ratePerCent: number; totalCents: number; totalPrice: number; formula: string } {
  const ratePerCent = customCentRate && customCentRate > 0
    ? customCentRate
    : (machineryType === 'Small Machine' ? DEFAULT_RATES.smallCent : DEFAULT_RATES.largeCent);
  const cents = Math.max(0, Math.round(totalCents));
  const totalPrice = cents * ratePerCent;
  const formula = `${cents} cents × ₹${ratePerCent} = ₹${totalPrice.toLocaleString('en-IN')}`;
  return { ratePerCent, totalCents: cents, totalPrice, formula };
}

/**
 * Total land in cents = (Acres * 100) + Additional Cents
 */
export function calculateTotalCents(acres: number, cents: number): number {
  const safeAcres = Number.isFinite(acres) ? Math.max(0, acres) : 0;
  const safeCents = Number.isFinite(cents) ? Math.max(0, cents) : 0;
  return Math.round(safeAcres * 100 + safeCents);
}

/**
 * Total land in acres = Acres + (Cents / 100)
 */
export function calculateTotalAcres(acres: number, cents: number): number {
  const safeAcres = Number.isFinite(acres) ? Math.max(0, acres) : 0;
  const safeCents = Number.isFinite(cents) ? Math.max(0, cents) : 0;
  return Number((safeAcres + safeCents / 100).toFixed(4));
}

/**
 * Convert cents into acres + remaining cents
 */
export function convertCentsToAcres(totalCents: number): {
  acres: number;
  cents: number;
  totalAcresDecimal: number;
} {
  const safeCents = Math.max(0, Math.round(totalCents || 0));
  const acres = Math.floor(safeCents / 100);
  const cents = safeCents % 100;
  const totalAcresDecimal = Number((safeCents / 100).toFixed(4));
  return { acres, cents, totalAcresDecimal };
}

/**
 * Get effective machinery unit rate
 */
export function getMachineryRate(
  machineryType: MachineryType,
  rateType: RateType,
  customRate?: number,
  customRatesConfig?: {
    smallAcre?: number;
    smallCent?: number;
    largeAcre?: number;
    largeCent?: number;
  }
): number {
  if (customRate !== undefined && customRate !== null && customRate > 0) {
    return customRate;
  }

  const rates = {
    smallAcre: customRatesConfig?.smallAcre ?? DEFAULT_RATES.smallAcre,
    smallCent: customRatesConfig?.smallCent ?? DEFAULT_RATES.smallCent,
    largeAcre: customRatesConfig?.largeAcre ?? DEFAULT_RATES.largeAcre,
    largeCent: customRatesConfig?.largeCent ?? DEFAULT_RATES.largeCent,
  };

  if (machineryType === 'Small Machine') {
    return rateType === 'Per Acre' ? rates.smallAcre : rates.smallCent;
  } else {
    return rateType === 'Per Acre' ? rates.largeAcre : rates.largeCent;
  }
}

/**
 * Calculate base machinery charge
 * For per-acre billing: total acres (including fractional) * ratePerAcre
 * For per-cent billing: total cents * ratePerCent
 */
export function calculateBaseCharge(
  acres: number,
  cents: number,
  machineryType: MachineryType,
  rateType: RateType,
  customRate?: number,
  customRatesConfig?: {
    smallAcre?: number;
    smallCent?: number;
    largeAcre?: number;
    largeCent?: number;
  }
): number {
  const rate = getMachineryRate(machineryType, rateType, customRate, customRatesConfig);

  if (rateType === 'Per Acre') {
    const totalAcres = calculateTotalAcres(acres, cents);
    return Math.round(totalAcres * rate);
  } else {
    const totalCents = calculateTotalCents(acres, cents);
    return Math.round(totalCents * rate);
  }
}

/**
 * Total charge = baseCharge - discountAmount
 */
export function calculateTotalCharge(baseCharge: number, discountAmount: number = 0): number {
  const safeBase = Math.max(0, baseCharge || 0);
  const safeDiscount = Math.max(0, discountAmount || 0);
  return Math.max(0, Math.round(safeBase - safeDiscount));
}

/**
 * Remaining balance = Total charge - Total customer payments received
 * Note: Employee wages MUST NOT reduce customer balance.
 */
export function calculateRemainingBalance(totalCharge: number, totalCustomerPaid: number): number {
  const safeTotal = Math.max(0, totalCharge || 0);
  const safePaid = Math.max(0, totalCustomerPaid || 0);
  return Math.max(0, Math.round(safeTotal - safePaid));
}

/**
 * Determine payment status based on total charge and amount paid
 */
export function determinePaymentStatus(totalCharge: number, totalPaid: number): PaymentStatus {
  if (totalCharge <= 0) return 'Fully Paid';
  if (totalPaid <= 0) return 'Unpaid';
  if (totalPaid >= totalCharge) return 'Fully Paid';
  return 'Partially Paid';
}

/**
 * Add days to YYYY-MM-DD date string using UTC arithmetic to avoid timezone shifts
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(Date.UTC(year, month, day));
  d.setUTCDate(d.getUTCDate() + days);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Expected planting date from seeding date and interval (default 22-25 days)
 */
export function calculatePlantingDate(seedingDateStr: string, intervalDays: number = 22): string {
  return addDaysToDate(seedingDateStr, intervalDays);
}

/**
 * Difference in full days between two YYYY-MM-DD dates (toDate - fromDate)
 */
export function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 0;
  const parseUTC = (str: string) => {
    const [y, m, d] = str.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  const diffMs = parseUTC(toDateStr) - parseUTC(fromDateStr);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format YYYY-MM-DD to DD-MM-YYYY (or fallback)
 */
export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format currency in Indian Rupees style (₹10,000)
 */
export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const formatted = Math.round(amount).toLocaleString('en-IN');
  return `₹${formatted}`;
}

/**
 * Clean phone number to 10 digits
 */
export function cleanMobileNumber(mobile: string): string {
  return mobile.replace(/\D/g, '').slice(-10);
}

/**
 * Generate Next Customer ID e.g. SRF-2026-001
 */
export function generateCustomerId(existingIds: string[], year: number = 2026): string {
  const prefix = `SRF-${year}-`;
  let maxSeq = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const seqStr = id.slice(prefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Generate Next Employee ID e.g. EMP-001
 */
export function generateEmployeeId(existingIds: string[]): string {
  const prefix = 'EMP-';
  let maxSeq = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const seqStr = id.slice(prefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

/**
 * Generate Next Schedule ID e.g. SCH-2026-001
 */
export function generateScheduleId(existingIds: string[], year: number = 2026): string {
  const prefix = `SCH-${year}-`;
  let maxSeq = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const seqStr = id.slice(prefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

/**
 * Checks whether two time slot windows overlap on the same calendar day.
 * - 'Full Day' overlaps with every time slot.
 * - Same exact slots overlap.
 * - Overlapping intervals (e.g. Morning 6-10 and Morning 8-12; Afternoon 1-5 and Evening 3-7) overlap.
 * - Morning vs Afternoon (e.g. 6-10 or 8-12 vs 1-5) do NOT overlap.
 * - Morning vs Evening (e.g. 6-10 or 8-12 vs 3-7) do NOT overlap.
 */
export function doTimeSlotsOverlap(slotA?: string, slotB?: string): boolean {
  if (!slotA || !slotB) return true; // conservative if unspecified
  const a = slotA.trim().toLowerCase();
  const b = slotB.trim().toLowerCase();

  if (a === b) return true;
  if (a.includes('full day') || b.includes('full day')) return true;

  // Morning overlaps
  const aIsMorning = a.includes('morning') || a.includes('am');
  const bIsMorning = b.includes('morning') || b.includes('am');
  if (aIsMorning && bIsMorning) return true;

  // Afternoon & Evening specifics
  const aIsAfternoon = a.includes('afternoon') || a.includes('1:00 pm');
  const bIsAfternoon = b.includes('afternoon') || b.includes('1:00 pm');
  if (aIsAfternoon && bIsAfternoon) return true;

  const aIsEvening = a.includes('evening') || a.includes('3:00 pm - 7:00 pm');
  const bIsEvening = b.includes('evening') || b.includes('3:00 pm - 7:00 pm');
  if (aIsEvening && bIsEvening) return true;

  // Afternoon 1:00 PM - 5:00 PM and Evening 3:00 PM - 7:00 PM overlap between 3-5 PM
  if ((aIsAfternoon && bIsEvening) || (bIsAfternoon && aIsEvening)) {
    return true;
  }

  // Morning and Afternoon do NOT overlap
  if ((aIsMorning && bIsAfternoon) || (bIsMorning && aIsAfternoon)) {
    return false;
  }

  // Morning and Evening do NOT overlap
  if ((aIsMorning && bIsEvening) || (bIsMorning && aIsEvening)) {
    return false;
  }

  return false;
}

/**
 * Find conflicting schedules for a candidate machine booking.
 * Conflict occurs if:
 * 1. Same scheduledDate
 * 2. Same machineryType
 * 3. Overlapping timeSlot / scheduledTime
 * 4. Status is not Completed or Cancelled
 * 5. Not the candidate schedule itself (by ID)
 */
export function findConflictingSchedules<T extends {
  id: string;
  scheduledDate: string;
  machineryType: MachineryType;
  timeSlot?: string;
  scheduledTime?: string;
  status: string;
}>(
  existingSchedules: T[],
  candidate: {
    id?: string;
    scheduledDate: string;
    machineryType: MachineryType;
    timeSlot?: string;
    scheduledTime?: string;
  }
): T[] {
  if (!candidate.scheduledDate || !candidate.machineryType) return [];
  const candidateSlot = candidate.timeSlot || candidate.scheduledTime || 'Full Day';

  return existingSchedules.filter(s => {
    if (candidate.id && s.id === candidate.id) return false;
    if (s.status === 'Completed' || s.status === 'Cancelled') return false;
    if (s.scheduledDate !== candidate.scheduledDate) return false;
    if (s.machineryType !== candidate.machineryType) return false;

    const existingSlot = s.timeSlot || s.scheduledTime || 'Full Day';
    return doTimeSlotsOverlap(candidateSlot, existingSlot);
  });
}

// -------------------------------------------------------------
// Seed Bag Calculation Standard — 30 kg per Bag
// -------------------------------------------------------------
export const SEED_BAG_CAPACITY_KG = 30;

export interface SeedBagCalculationResult {
  seedUsedKg: number;
  exactBags: number;
  roundedDecimalBags: number;
  seedBags: number;
  wholeBagsRequired: number;
  displayText: string;
  isFractional: boolean;
}

/**
 * Calculates seed bag requirements based on the 30 kg per bag standard.
 * - One seed bag contains 30 kg.
 * - Seed Bags Required = Seed Used (kg) ÷ 30
 * - If fractional, shows exact decimal and whole bags required for purchasing (rounded up).
 * - Example: 75 kg = 2.5 bags; 3 whole bags required
 * - Example: 60 kg = 2 bags
 * - Example: 25 kg = 0.84 bags; 1 whole bag required (Math.ceil((25/30)*100)/100 = 0.84)
 * - Returns null if not provided or if value is negative (< 0)
 */
export function calculateSeedBags(
  seedUsedKg?: number | null | string
): SeedBagCalculationResult | null {
  if (seedUsedKg === undefined || seedUsedKg === null || seedUsedKg === '') {
    return null;
  }
  const kg = typeof seedUsedKg === 'string' ? parseFloat(seedUsedKg) : seedUsedKg;
  if (isNaN(kg) || kg <= 0) {
    return null;
  }

  const exactBags = kg / SEED_BAG_CAPACITY_KG;
  const isFractional = exactBags % 1 !== 0;

  // Round fractional bags up to 2 decimals matching standard (e.g. 25/30 -> 0.84; 75/30 -> 2.5)
  const roundedDecimalBags = isFractional
    ? Math.ceil(exactBags * 100) / 100
    : exactBags;

  const wholeBagsRequired = Math.ceil(exactBags);
  const bagUnitStr = wholeBagsRequired === 1 ? 'bag' : 'bags';
  const wholeUnitStr = wholeBagsRequired === 1 ? 'whole bag required' : 'whole bags required';

  let displayText: string;
  if (!isFractional) {
    displayText = `${wholeBagsRequired} ${bagUnitStr}`;
  } else {
    displayText = `${roundedDecimalBags} bags; ${wholeBagsRequired} ${wholeUnitStr}`;
  }

  return {
    seedUsedKg: kg,
    exactBags,
    roundedDecimalBags,
    seedBags: roundedDecimalBags,
    wholeBagsRequired,
    displayText,
    isFractional,
  };
}

