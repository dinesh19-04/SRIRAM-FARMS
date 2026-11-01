export type Language = 'en' | 'ta';

export type UserRole = 'Owner' | 'Manager';

export interface UserProfile {
  uid: string;
  id?: 'owner' | 'manager' | string;
  name: string;
  email?: string;
  phone?: string;
  mobile: string;
  photoURL?: string;
  photoUrl?: string;
  role: UserRole;
  age?: number;
  education?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MachineryType = 'Small Machine' | 'Large Machine';
export type RateType = 'Per Acre' | 'Per Cent';

export type BookingStatus =
  | 'Booked'
  | 'Seeding Completed'
  | 'Planting Pending'
  | 'Planting Completed'
  | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
  recordedBy: string;
}

export interface CustomerEmployeeAssignment {
  id: string;
  employeeId?: string;
  employeeName: string;
  amountPaid: number;
  date: string;
  notes?: string;
}

export interface LandMeasurementImage {
  dataUrl: string;
  capturedDate: string;
  notes?: string;
  fileSizeKb?: number;
}

export interface Customer {
  id: string; // e.g. SRF-2026-001
  name: string;
  village: string;
  mobile: string;
  address?: string;
  acres: number;
  cents: number;
  seedVariety: string;
  notes?: string;
  machineryType: MachineryType;
  rateType: RateType;
  customRatePerUnit?: number;
  seedingDate: string; // YYYY-MM-DD
  plantingIntervalDays: 22 | 23 | 24 | 25;
  expectedPlantingDate: string; // YYYY-MM-DD
  isPlantingDateOverridden: boolean;
  actualPlantingDate: string | null; // YYYY-MM-DD
  bookingStatus: BookingStatus;
  baseCharge: number;
  discountAmount: number;
  discountReason?: string;
  totalCharge: number;
  advancePayment: number;
  totalCustomerPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  paymentHistory: PaymentRecord[];
  employees: CustomerEmployeeAssignment[];
  landImage?: LandMeasurementImage;
  seedUsedKg?: number; // Seed used in kg (1 bag = 30 kg)
  seedBags?: number; // Calculated seed bags required (seedUsedKg / 30)
  wholeBagsRequired?: number; // Whole bags required for purchasing (Math.ceil)
  season: string; // e.g. 2026-27 or Thaladi / Samba
  createdByRole?: UserRole;
  createdByName?: string;
  updatedByRole?: UserRole;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = 'Pending' | 'Scheduled' | 'In Progress' | 'Completed';

export interface PlantingSchedule {
  id: string; // e.g. SCH-2026-001 or SCH-1730000000000
  customerId: string; // Linked customer ID (foreign key)
  customerName: string;
  village: string;
  mobile: string;
  machineryType: MachineryType;
  scheduledDate: string; // YYYY-MM-DD
  timeSlot?: string; // e.g. Morning, Afternoon, Evening, Full Day
  scheduledTime?: string; // backwards compatibility
  acres: number;
  cents: number;
  totalCents: number;
  ratePerCent: number;
  totalAmount: number;
  seedUsedKg?: number; // Seed used in kg (1 bag = 30 kg)
  seedBags?: number; // Calculated seed bags required
  wholeBagsRequired?: number; // Whole bags required for purchasing
  status: ScheduleStatus;
  notes?: string;
  createdByRole?: UserRole;
  createdByName?: string;
  updatedByRole?: UserRole;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string; // e.g. EMP-001
  name: string;
  mobile: string;
  village: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
}

export interface EmployeeWorkLog {
  id: string;
  employeeId: string;
  employeeName: string;
  mobile?: string;
  village?: string;
  workDate: string;
  customerId: string;
  customerName: string;
  workType: 'Seeding' | 'Planting';
  amountEarned: number;
  amountPaid: number;
  pendingWage: number;
  notes?: string;
}

export type ReminderType = '3_DAYS_BEFORE' | '2_DAYS_BEFORE' | 'PLANTING_DAY' | 'OVERDUE';
export type NotificationCategory = 'Upcoming' | 'Today' | 'Completed' | 'Overdue';

export interface AppNotification {
  id: string;
  customerId: string;
  customerName: string;
  village: string;
  mobile: string;
  machineryType: MachineryType;
  landSummary: string;
  seedingDate: string;
  expectedPlantingDate: string;
  remainingBalance: number;
  reminderType: ReminderType;
  category: NotificationCategory;
  isRead: boolean;
  isDone: boolean;
  dueDate: string;
}

export interface AppSettings {
  language: Language;
  defaultPlantingInterval: 22 | 23 | 24 | 25;
  defaultSmallRateAcre: number;
  defaultSmallRateCent: number;
  defaultLargeRateAcre: number;
  defaultLargeRateCent: number;
  activeProfileId: 'owner' | 'manager';
  userProfiles: Record<'owner' | 'manager', UserProfile>;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalAcres: number;
  totalCents: number;
  smallMachineBookings: number;
  largeMachineBookings: number;
  totalCustomerCharges: number;
  totalAdvanceCollected: number;
  totalPaymentsCollected: number;
  totalRemainingBalance: number;
  totalEmployeePayments: number;
  totalPendingEmployeeWages: number;
  netCashCollected: number;
  todaySeedingCount: number;
  todayPlantingCount: number;
  upcomingPlantingCount: number;
  overduePaymentCount: number;
}
