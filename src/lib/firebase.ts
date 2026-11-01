import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  query,
  where,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Customer, Employee, EmployeeWorkLog, UserProfile, AppSettings, PlantingSchedule } from '../types';
import { DEFAULT_SETTINGS } from '../db/indexedDB';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const firestore = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Default UIDs for Owner and Manager accounts
export const OWNER_DEFAULT_UID = 'owner_raja_s_8072514712';
export const MANAGER_DEFAULT_UID = 'manager_dinesh_h_9840123456';

// Test server connection as per guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice:', error.message);
      return false;
    }
    return true;
  }
}

// -------------------------------------------------------------
// Authentication Helpers
// -------------------------------------------------------------

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-In failed:', err);
    throw err;
  }
}

export async function signOutAuth(): Promise<void> {
  await signOut(auth);
}

// -------------------------------------------------------------
// User Profile Operations (Isolated per UID in users/{uid})
// -------------------------------------------------------------

/**
 * Real-time listener for the signed-in user's OWN profile document.
 * Guarantees zero cross-contamination between Owner and Manager accounts.
 */
export function subscribeUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(firestore, 'users', uid);
  return onSnapshot(
    docRef,
    snap => {
      if (snap.exists()) {
        const d = snap.data();
        const role = d.role || (uid.includes('manager') ? 'Manager' : 'Owner');
        const prof: UserProfile = {
          uid: snap.id,
          id: role === 'Manager' ? 'manager' : 'owner',
          name: d.name || (role === 'Manager' ? 'DINESH H' : 'RAJA S'),
          email: d.email || '',
          phone: d.phone || d.mobile || '',
          mobile: (d.mobile || d.phone || '').replace(/\s+/g, ''),
          photoURL: d.photoURL || d.photoUrl,
          photoUrl: d.photoUrl || d.photoURL,
          role,
          age: d.age,
          education: d.education,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        };
        onUpdate(prof);
      }
    },
    err => {
      console.error(`Error in subscribeUserProfile for ${uid}:`, err);
      onError?.(err);
    }
  );
}

/**
 * Fetch a single user profile from users/{uid}
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(firestore, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    const role = d.role || (uid.includes('manager') ? 'Manager' : 'Owner');
    return {
      uid: snap.id,
      id: role === 'Manager' ? 'manager' : 'owner',
      name: d.name || (role === 'Manager' ? 'DINESH H' : 'RAJA S'),
      email: d.email || '',
      phone: d.phone || d.mobile || '',
      mobile: (d.mobile || d.phone || '').replace(/\s+/g, ''),
      photoURL: d.photoURL || d.photoUrl,
      photoUrl: d.photoUrl || d.photoURL,
      role,
      age: d.age,
      education: d.education,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

/**
 * Saves or updates ONLY the user's own profile document in users/{uid}.
 * Does not touch any global profile object or the other user's profile.
 */
export async function saveUserProfileToFirestore(
  uid: string,
  profileData: Partial<UserProfile>
): Promise<void> {
  try {
    const docRef = doc(firestore, 'users', uid);
    const sanitizedMobile = (profileData.mobile || profileData.phone || '').replace(/\s+/g, '');
    const dataToSave: Record<string, any> = {
      ...profileData,
      uid,
      mobile: sanitizedMobile,
      phone: sanitizedMobile,
      updatedAt: new Date().toISOString(),
    };
    if (profileData.photoUrl) {
      dataToSave.photoURL = profileData.photoUrl;
    }
    if (profileData.photoURL) {
      dataToSave.photoUrl = profileData.photoURL;
    }
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

/**
 * Initialize / Seed individual user profile documents in users/{uid}
 * Also migrates any legacy profiles from app_settings/config without data loss.
 */
export async function initializeUserProfilesInFirestore(): Promise<void> {
  try {
    // 1. Check legacy app_settings/config for any existing profile fields
    const configSnap = await getDoc(doc(firestore, 'app_settings', 'config'));
    const legacyOwner = configSnap.exists() ? configSnap.data()?.userProfiles?.owner : null;
    const legacyManager = configSnap.exists() ? configSnap.data()?.userProfiles?.manager : null;

    // 2. Initialize Owner Profile in users/{OWNER_DEFAULT_UID}
    const ownerSnap = await getDoc(doc(firestore, 'users', OWNER_DEFAULT_UID));
    if (!ownerSnap.exists()) {
      const defaultOwner = DEFAULT_SETTINGS.userProfiles.owner;
      await setDoc(doc(firestore, 'users', OWNER_DEFAULT_UID), {
        uid: OWNER_DEFAULT_UID,
        name: legacyOwner?.name || defaultOwner.name,
        role: 'Owner',
        mobile: (legacyOwner?.mobile || defaultOwner.mobile).replace(/\s+/g, ''),
        phone: (legacyOwner?.mobile || defaultOwner.mobile).replace(/\s+/g, ''),
        age: legacyOwner?.age || defaultOwner.age || 48,
        education: legacyOwner?.education || defaultOwner.education || 'B.A. (Farm Machinery Specialist)',
        photoUrl: legacyOwner?.photoUrl || defaultOwner.photoUrl,
        photoURL: legacyOwner?.photoUrl || defaultOwner.photoUrl,
        email: 'raja.owner@sriramfarms.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Initialize Manager Profile in users/{MANAGER_DEFAULT_UID}
    const managerSnap = await getDoc(doc(firestore, 'users', MANAGER_DEFAULT_UID));
    if (!managerSnap.exists()) {
      const defaultManager = DEFAULT_SETTINGS.userProfiles.manager;
      await setDoc(doc(firestore, 'users', MANAGER_DEFAULT_UID), {
        uid: MANAGER_DEFAULT_UID,
        name: legacyManager?.name || defaultManager.name,
        role: 'Manager',
        mobile: (legacyManager?.mobile || defaultManager.mobile).replace(/\s+/g, ''),
        phone: (legacyManager?.mobile || defaultManager.mobile).replace(/\s+/g, ''),
        age: legacyManager?.age || defaultManager.age || 22,
        education: legacyManager?.education || defaultManager.education || 'B.E. Agricultural Engineering',
        photoUrl: legacyManager?.photoUrl || defaultManager.photoUrl,
        photoURL: legacyManager?.photoUrl || defaultManager.photoUrl,
        email: 'dinesh.manager@sriramfarms.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('initializeUserProfilesInFirestore notice:', err);
  }
}

// -------------------------------------------------------------
// Shared Business Collections: Real-time Subscriptions
// -------------------------------------------------------------

export function subscribeCustomers(
  onUpdate: (customers: Customer[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(firestore, 'customers');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: Customer[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Customer);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(list);
    },
    err => {
      console.error('Error in subscribeCustomers:', err);
      onError?.(err);
    }
  );
}

export function subscribeEmployees(
  onUpdate: (employees: Employee[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(firestore, 'employees');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: Employee[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Employee);
      });
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(list);
    },
    err => {
      console.error('Error in subscribeEmployees:', err);
      onError?.(err);
    }
  );
}

export function subscribeWorkLogs(
  onUpdate: (logs: EmployeeWorkLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(firestore, 'workLogs');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: EmployeeWorkLog[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as EmployeeWorkLog);
      });
      list.sort((a, b) => (b.workDate || '').localeCompare(a.workDate || ''));
      onUpdate(list);
    },
    err => {
      console.error('Error in subscribeWorkLogs:', err);
      onError?.(err);
    }
  );
}

export function subscribeSchedules(
  onUpdate: (schedules: PlantingSchedule[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(firestore, 'schedules');
  return onSnapshot(
    colRef,
    snapshot => {
      const list: PlantingSchedule[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as PlantingSchedule);
      });
      list.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
      onUpdate(list);
    },
    err => {
      console.error('Error in subscribeSchedules:', err);
      onError?.(err);
    }
  );
}

/**
 * Shared Application Settings & Rates (Only machine rates, NOT user profiles)
 */
export function subscribeAppSettings(
  onUpdate: (settings: {
    rates?: {
      smallCent: number;
      smallAcre: number;
      largeCent: number;
      largeAcre: number;
    };
  }) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(firestore, 'app_settings', 'config');
  return onSnapshot(
    docRef,
    snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.rates) {
          onUpdate({ rates: data.rates });
        }
      } else {
        initializeFirestoreDefaults();
      }
    },
    err => {
      console.error('Error in subscribeAppSettings:', err);
      onError?.(err);
    }
  );
}

// -------------------------------------------------------------
// CRUD Operations with undefined-safe Sanitization
// -------------------------------------------------------------

/**
 * Recursively strips undefined values so Firestore setDoc/updateDoc never fails
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value);
    } else if (Array.isArray(value)) {
      result[key] = value
        .filter(item => item !== undefined)
        .map(item =>
          item !== null && typeof item === 'object' && !(item instanceof Date)
            ? sanitizeForFirestore(item)
            : item
        );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function getCustomersFromFirestore(): Promise<Customer[]> {
  try {
    const colRef = collection(firestore, 'customers');
    const snap = await getDocs(colRef);
    const list: Customer[] = [];
    snap.forEach(docSnap => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Customer);
    });
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  } catch (err) {
    console.error('Error fetching customers from Firestore:', err);
    throw err;
  }
}

export async function getSchedulesFromFirestore(): Promise<PlantingSchedule[]> {
  try {
    const colRef = collection(firestore, 'schedules');
    const snap = await getDocs(colRef);
    const list: PlantingSchedule[] = [];
    snap.forEach(docSnap => {
      list.push({ ...docSnap.data(), id: docSnap.id } as PlantingSchedule);
    });
    list.sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
    return list;
  } catch (err) {
    console.error('Error fetching schedules from Firestore:', err);
    throw err;
  }
}

export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  const docRef = doc(firestore, 'customers', customer.id);
  const data = sanitizeForFirestore({
    ...customer,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, data, { merge: true });

  // Cascade name, mobile, and village to any existing linked schedules
  try {
    const schedulesRef = collection(firestore, 'schedules');
    const q = query(schedulesRef, where('customerId', '==', customer.id));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(firestore);
      snap.forEach(docSnap => {
        batch.update(docSnap.ref, {
          customerName: customer.name,
          village: customer.village,
          mobile: customer.mobile,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Could not cascade customer update to schedules:', err);
  }
}

export async function deleteCustomerFromFirestore(
  customerId: string,
  deleteLinkedSchedules: boolean = true
): Promise<{ deletedSchedulesCount: number }> {
  const docRef = doc(firestore, 'customers', customerId);
  await deleteDoc(docRef);

  let deletedSchedulesCount = 0;
  if (deleteLinkedSchedules) {
    try {
      const schedulesRef = collection(firestore, 'schedules');
      const q = query(schedulesRef, where('customerId', '==', customerId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(firestore);
        snap.forEach(docSnap => {
          batch.delete(docSnap.ref);
          deletedSchedulesCount++;
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Could not delete linked schedules for customer:', err);
    }
  }
  return { deletedSchedulesCount };
}

export async function saveScheduleToFirestore(schedule: PlantingSchedule): Promise<void> {
  const docRef = doc(firestore, 'schedules', schedule.id);
  const data = sanitizeForFirestore({
    ...schedule,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(docRef, data, { merge: true });
}

export async function deleteScheduleFromFirestore(scheduleId: string): Promise<void> {
  const docRef = doc(firestore, 'schedules', scheduleId);
  await deleteDoc(docRef);
}

export async function saveEmployeeToFirestore(employee: Employee): Promise<void> {
  const docRef = doc(firestore, 'employees', employee.id);
  const data = sanitizeForFirestore(employee);
  await setDoc(docRef, data, { merge: true });
}

export async function deleteEmployeeFromFirestore(employeeId: string): Promise<void> {
  const docRef = doc(firestore, 'employees', employeeId);
  await deleteDoc(docRef);
}

export async function saveWorkLogToFirestore(log: EmployeeWorkLog): Promise<void> {
  const docRef = doc(firestore, 'workLogs', log.id);
  const data = sanitizeForFirestore(log);
  await setDoc(docRef, data, { merge: true });
}

export async function deleteWorkLogFromFirestore(logId: string): Promise<void> {
  const docRef = doc(firestore, 'workLogs', logId);
  await deleteDoc(docRef);
}

export async function saveRatesToFirestore(rates: {
  smallCent: number;
  smallAcre: number;
  largeCent: number;
  largeAcre: number;
}): Promise<void> {
  const docRef = doc(firestore, 'app_settings', 'config');
  await setDoc(docRef, { rates }, { merge: true });
}

export async function initializeFirestoreDefaults(): Promise<void> {
  const docRef = doc(firestore, 'app_settings', 'config');
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, {
      rates: {
        smallCent: 45,
        smallAcre: 4500,
        largeCent: 40,
        largeAcre: 4000,
      },
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Reset Dashboard / Start Fresh
 * Completely deletes all customers, employees, workLogs, and schedules from Firestore.
 * Preserves independent user profiles in /users/{uid} and machine rates.
 */
export async function resetDashboardSharedDatabase(): Promise<{
  deletedCustomers: number;
  deletedSchedules: number;
  deletedEmployees: number;
  deletedWorkLogs: number;
}> {
  let deletedCustomers = 0;
  let deletedSchedules = 0;
  let deletedEmployees = 0;
  let deletedWorkLogs = 0;

  // 1. Delete all customers
  const custSnap = await getDocs(collection(firestore, 'customers'));
  if (!custSnap.empty) {
    const batch = writeBatch(firestore);
    custSnap.forEach(d => {
      batch.delete(d.ref);
      deletedCustomers++;
    });
    await batch.commit();
  }

  // 2. Delete all schedules
  const schSnap = await getDocs(collection(firestore, 'schedules'));
  if (!schSnap.empty) {
    const batch = writeBatch(firestore);
    schSnap.forEach(d => {
      batch.delete(d.ref);
      deletedSchedules++;
    });
    await batch.commit();
  }

  // 3. Delete all employees
  const empSnap = await getDocs(collection(firestore, 'employees'));
  if (!empSnap.empty) {
    const batch = writeBatch(firestore);
    empSnap.forEach(d => {
      batch.delete(d.ref);
      deletedEmployees++;
    });
    await batch.commit();
  }

  // 4. Delete all work logs
  const logsSnap = await getDocs(collection(firestore, 'workLogs'));
  if (!logsSnap.empty) {
    const batch = writeBatch(firestore);
    logsSnap.forEach(d => {
      batch.delete(d.ref);
      deletedWorkLogs++;
    });
    await batch.commit();
  }

  return { deletedCustomers, deletedSchedules, deletedEmployees, deletedWorkLogs };
}
