import Dexie, { Table } from 'dexie';
import {
  Customer,
  PlantingSchedule,
  Employee,
  EmployeeWorkLog,
  AppNotification,
  AppSettings,
  PaymentRecord,
  CustomerEmployeeAssignment,
} from '../types';
import { getDaysDifference, formatDateDisplay } from '../utils/calculations';

export class SriramFarmsDatabase extends Dexie {
  customers!: Table<Customer, string>;
  schedules!: Table<PlantingSchedule, string>;
  employees!: Table<Employee, string>;
  employeeWorkLogs!: Table<EmployeeWorkLog, string>;
  notifications!: Table<AppNotification, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('SriramFarmsDB');
    this.version(2).stores({
      customers: 'id, name, village, mobile, machineryType, rateType, bookingStatus, paymentStatus, seedingDate, expectedPlantingDate, actualPlantingDate, season, createdAt',
      schedules: 'id, customerId, customerName, village, machineryType, scheduledDate, status, createdAt',
      employees: 'id, name, mobile, village, status',
      employeeWorkLogs: 'id, employeeId, customerId, workDate, workType',
      notifications: 'id, customerId, reminderType, category, isRead, isDone, dueDate',
      settings: 'key',
    });
  }
}

export const db = new SriramFarmsDatabase();

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  defaultPlantingInterval: 22,
  defaultSmallRateAcre: 4500,
  defaultSmallRateCent: 45,
  defaultLargeRateAcre: 4000,
  defaultLargeRateCent: 40,
  activeProfileId: 'owner',
  userProfiles: {
    owner: {
      uid: 'owner_raja_s_8072514712',
      id: 'owner',
      name: 'RAJA S',
      role: 'Owner',
      mobile: '8072514712',
      phone: '8072514712',
      age: 48,
      education: 'B.A. (Agriculture & Farm Machinery Specialist)',
      photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%2314532d"/><circle cx="60" cy="46" r="22" fill="%23fde047"/><path d="M60 40 C52 40 45 44 43 51 C48 53 54 54 60 54 C66 54 72 53 77 51 C75 44 68 40 60 40 Z" fill="%23713f12" opacity="0.4"/><path d="M42 42 Q60 30 78 42 Q60 34 42 42 Z" fill="%231e293b"/><path d="M26 104 C26 84 41 74 60 74 C79 74 94 84 94 104 Z" fill="%23fef08a"/><path d="M35 104 L60 84 L85 104 Z" fill="%2315803d"/></svg>',
    },
    manager: {
      uid: 'manager_dinesh_h_9840123456',
      id: 'manager',
      name: 'DINESH H',
      role: 'Manager',
      mobile: '9840123456',
      phone: '9840123456',
      age: 22,
      education: 'B.E. Agricultural Engineering (2024-26)',
      photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="%23166534"/><circle cx="60" cy="46" r="22" fill="%23fcd34d"/><path d="M40 38 Q60 22 80 38 Q75 30 60 28 Q45 30 40 38 Z" fill="%230f172a"/><path d="M26 104 C26 84 41 74 60 74 C79 74 94 84 94 104 Z" fill="%23f1f5f9"/><path d="M46 104 L60 82 L74 104 Z" fill="%230284c7"/></svg>',
    },
  },
};

/**
 * Initialize system settings without inserting any mock customers or employees
 */
export async function initializeDatabase(): Promise<void> {
  const settingsCount = await db.settings.count();

  if (settingsCount === 0) {
    await db.settings.put({ key: 'appSettings', value: DEFAULT_SETTINGS });
  } else {
    // Merge new profile fields (age, education, photoUrl) if missing and strip mobile spaces
    const existing = await db.settings.get('appSettings');
    if (existing?.value?.userProfiles) {
      const merged = {
        ...existing.value,
        defaultSmallRateCent: 45,
        defaultSmallRateAcre: 4500,
        defaultLargeRateCent: 40,
        defaultLargeRateAcre: 4000,
        userProfiles: {
          owner: {
            ...DEFAULT_SETTINGS.userProfiles.owner,
            ...existing.value.userProfiles.owner,
            mobile: (existing.value.userProfiles.owner?.mobile || DEFAULT_SETTINGS.userProfiles.owner.mobile).replace(/\s+/g, ''),
            age: existing.value.userProfiles.owner?.age || DEFAULT_SETTINGS.userProfiles.owner.age,
            education: existing.value.userProfiles.owner?.education || DEFAULT_SETTINGS.userProfiles.owner.education,
            photoUrl: existing.value.userProfiles.owner?.photoUrl || DEFAULT_SETTINGS.userProfiles.owner.photoUrl,
          },
          manager: {
            ...DEFAULT_SETTINGS.userProfiles.manager,
            ...existing.value.userProfiles.manager,
            mobile: (existing.value.userProfiles.manager?.mobile || DEFAULT_SETTINGS.userProfiles.manager.mobile).replace(/\s+/g, ''),
            age: existing.value.userProfiles.manager?.age || DEFAULT_SETTINGS.userProfiles.manager.age,
            education: existing.value.userProfiles.manager?.education || DEFAULT_SETTINGS.userProfiles.manager.education,
            photoUrl: existing.value.userProfiles.manager?.photoUrl || DEFAULT_SETTINGS.userProfiles.manager.photoUrl,
          },
        },
      };
      await db.settings.put({ key: 'appSettings', value: merged });
    }
  }
  // Sync notifications queue without deleting any customer or employee records
  await syncPlantingNotifications();
}

/**
 * Scan all pending customers and build notification queue
 * 3 days before, 2 days before, on planting date, and overdue
 */
export async function syncPlantingNotifications(todayDateStr?: string): Promise<AppNotification[]> {
  const today = todayDateStr || new Date().toISOString().slice(0, 10);
  const customers = await db.customers.toArray();

  if (customers.length === 0) {
    await db.notifications.clear();
    return [];
  }

  const existingNotifications = await db.notifications.toArray();
  const notifMap = new Map<string, AppNotification>();
  for (const n of existingNotifications) {
    notifMap.set(n.id, n);
  }

  const updatedNotifications: AppNotification[] = [];
  const currentNotifIds = new Set<string>();

  for (const cust of customers) {
    // Only check active pending bookings
    if (cust.bookingStatus === 'Planting Completed' || cust.bookingStatus === 'Cancelled') {
      continue;
    }

    const expectedDate = cust.expectedPlantingDate;
    if (!expectedDate) continue;

    const diff = getDaysDifference(today, expectedDate);

    let reminderType: AppNotification['reminderType'] | null = null;
    let category: AppNotification['category'] = 'Upcoming';

    if (diff === 3) {
      reminderType = '3_DAYS_BEFORE';
      category = 'Upcoming';
    } else if (diff === 2) {
      reminderType = '2_DAYS_BEFORE';
      category = 'Upcoming';
    } else if (diff === 0) {
      reminderType = 'PLANTING_DAY';
      category = 'Today';
    } else if (diff < 0) {
      reminderType = 'OVERDUE';
      category = 'Overdue';
    } else if (diff > 0 && diff < 7) {
      reminderType = '3_DAYS_BEFORE';
      category = 'Upcoming';
    }

    if (reminderType) {
      const notifId = `NTF-${cust.id}-${reminderType}-${expectedDate}`;
      currentNotifIds.add(notifId);
      const existing = notifMap.get(notifId);

      const notif: AppNotification = {
        id: notifId,
        customerId: cust.id,
        customerName: cust.name,
        village: cust.village,
        mobile: cust.mobile,
        machineryType: cust.machineryType,
        landSummary: `${cust.acres} Ac ${cust.cents > 0 ? `${cust.cents} Cts` : ''}`,
        seedingDate: cust.seedingDate,
        expectedPlantingDate: cust.expectedPlantingDate,
        remainingBalance: cust.remainingBalance,
        reminderType,
        category: existing?.isDone ? 'Completed' : category,
        isRead: existing?.isRead || false,
        isDone: existing?.isDone || false,
        dueDate: expectedDate,
      };

      updatedNotifications.push(notif);
    }
  }

  // Clear obsolete notifications
  await db.notifications.clear();
  if (updatedNotifications.length > 0) {
    await db.notifications.bulkPut(updatedNotifications);
  }

  return updatedNotifications;
}
