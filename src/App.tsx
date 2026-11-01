import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Customer,
  Employee,
  EmployeeWorkLog,
  AppNotification,
  AppSettings,
  UserProfile,
  Language,
  DashboardMetrics,
  PaymentRecord,
  PlantingSchedule,
} from './types';
import {
  db,
  initializeDatabase,
  syncPlantingNotifications,
  DEFAULT_SETTINGS,
} from './db/indexedDB';
import {
  saveCustomerToFirestore,
  deleteCustomerFromFirestore,
  getCustomersFromFirestore,
  getSchedulesFromFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveWorkLogToFirestore,
  deleteWorkLogFromFirestore,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  resetDashboardSharedDatabase,
  subscribeCustomers,
  subscribeEmployees,
  subscribeWorkLogs,
  subscribeSchedules,
  subscribeAppSettings,
  testFirestoreConnection,
  getUserProfile,
  subscribeUserProfile,
  saveUserProfileToFirestore,
  initializeUserProfilesInFirestore,
  signInWithGoogle,
  signOutAuth,
  OWNER_DEFAULT_UID,
  MANAGER_DEFAULT_UID,
  auth,
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { exportToGoogleSheetsFormat } from './utils/googleSheetsExport';
import {
  calculateTotalAcres,
  calculateTotalCents,
} from './utils/calculations';
import {
  generateCustomerPdf,
  generateSeasonalReportPdf,
  generatePlantingSchedulePdf,
  downloadPdfFile,
  sharePdfFile,
} from './utils/pdfGenerator';
import { Header } from './components/Header';
import { BottomNav, TabKey } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { CustomerFormModal } from './components/CustomerFormModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { ScheduleView } from './components/ScheduleView';
import { CalculatorModal } from './components/CalculatorModal';
import { EmployeeModule } from './components/EmployeeModule';
import { ReportsView } from './components/ReportsView';
import { MoreMenu } from './components/MoreMenu';
import { ProfileModal } from './components/ProfileModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { HelpModal } from './components/HelpModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // App Business Data States (Shared across all accounts & devices)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workLogs, setWorkLogs] = useState<EmployeeWorkLog[]>([]);
  const [schedules, setSchedules] = useState<PlantingSchedule[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Active Session & Isolated User Profile State
  const [activeUserUid, setActiveUserUid] = useState<string>(() => {
    return localStorage.getItem('sriram_farms_active_uid') || OWNER_DEFAULT_UID;
  });

  const [activeProfile, setActiveProfile] = useState<UserProfile>(() => {
    const isManager = activeUserUid === MANAGER_DEFAULT_UID;
    return isManager ? DEFAULT_SETTINGS.userProfiles.manager : DEFAULT_SETTINGS.userProfiles.owner;
  });

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [moreSubView, setMoreSubView] = useState<'menu' | 'employees' | 'reports' | 'backup' | 'profile' | 'help' | 'settings'>('menu');

  // Modals
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Toast alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // -------------------------------------------------------------
  // Load Shared Database Records
  // -------------------------------------------------------------
  const loadDatabaseRecords = useCallback(async (fetchFromFirestore: boolean = false) => {
    try {
      if (fetchFromFirestore) {
        try {
          const [remoteCusts, remoteScheds] = await Promise.all([
            getCustomersFromFirestore(),
            getSchedulesFromFirestore(),
          ]);
          if (remoteCusts) {
            setCustomers(remoteCusts);
            await db.customers.clear();
            if (remoteCusts.length > 0) {
              await db.customers.bulkPut(remoteCusts);
            }
          }
          if (remoteScheds) {
            setSchedules(remoteScheds);
            await db.schedules.clear();
            if (remoteScheds.length > 0) {
              await db.schedules.bulkPut(remoteScheds);
            }
          }
        } catch (fErr) {
          console.warn('Direct Firestore fetch notice:', fErr);
        }
      }

      const custList = await db.customers.toArray();
      const empList = await db.employees.toArray();
      const logsList = await db.employeeWorkLogs.toArray();
      const schedList = await db.schedules.toArray();
      const notifsList = await syncPlantingNotifications();

      const settingsRow = await db.settings.get('appSettings');
      if (settingsRow?.value) {
        const rawSettings = settingsRow.value;
        const sanitizedSettings: AppSettings = {
          ...rawSettings,
          defaultSmallRateCent: 45,
          defaultSmallRateAcre: 4500,
          defaultLargeRateCent: 40,
          defaultLargeRateAcre: 4000,
        };
        setSettings(sanitizedSettings);
      }

      setCustomers(custList);
      setEmployees(empList);
      setWorkLogs(logsList);
      setSchedules(schedList);
      setNotifications(notifsList);
    } catch (err) {
      console.error('Error reading records from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------
  // Real-time Subscriptions for Shared Business Data
  // -------------------------------------------------------------
  useEffect(() => {
    let unsubCustomers: (() => void) | undefined;
    let unsubEmployees: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;
    let unsubSchedules: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const init = async () => {
      await initializeDatabase();
      await loadDatabaseRecords();
      await testFirestoreConnection();

      // Shared Customers (Firestore authoritative)
      unsubCustomers = subscribeCustomers(async remoteCustomers => {
        try {
          setCustomers(remoteCustomers);
          await db.customers.clear();
          if (remoteCustomers.length > 0) {
            await db.customers.bulkPut(remoteCustomers);
          }
          const notifs = await syncPlantingNotifications();
          setNotifications(notifs);
        } catch (e) {
          console.error('Error handling customer sync:', e);
        } finally {
          setIsLoading(false);
        }
      });

      // Shared Employees (Firestore authoritative)
      unsubEmployees = subscribeEmployees(async remoteEmployees => {
        try {
          setEmployees(remoteEmployees);
          await db.employees.clear();
          if (remoteEmployees.length > 0) {
            await db.employees.bulkPut(remoteEmployees);
          }
        } catch (e) {
          console.error('Error handling employee sync:', e);
        }
      });

      // Shared Work Logs (Firestore authoritative)
      unsubLogs = subscribeWorkLogs(async remoteLogs => {
        try {
          setWorkLogs(remoteLogs);
          await db.employeeWorkLogs.clear();
          if (remoteLogs.length > 0) {
            await db.employeeWorkLogs.bulkPut(remoteLogs);
          }
        } catch (e) {
          console.error('Error handling workLog sync:', e);
        }
      });

      // Shared Schedules (Firestore authoritative)
      unsubSchedules = subscribeSchedules(async remoteSchedules => {
        try {
          setSchedules(remoteSchedules);
          await db.schedules.clear();
          if (remoteSchedules.length > 0) {
            await db.schedules.bulkPut(remoteSchedules);
          }
        } catch (e) {
          console.error('Error handling schedule sync:', e);
        }
      });

      // Shared Rates from app_settings
      unsubSettings = subscribeAppSettings(async remoteConfig => {
        if (remoteConfig?.rates) {
          setSettings(prev => ({
            ...prev,
            defaultSmallRateCent: remoteConfig.rates?.smallCent ?? 45,
            defaultSmallRateAcre: remoteConfig.rates?.smallAcre ?? 4500,
            defaultLargeRateCent: remoteConfig.rates?.largeCent ?? 40,
            defaultLargeRateAcre: remoteConfig.rates?.largeAcre ?? 4000,
          }));
        }
      });
    };
    init();

    // Query params navigation
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const tab = params.get('tab');

      if (action === 'new') {
        setIsCustomerFormOpen(true);
        setEditingCustomer(null);
      } else if (action === 'calculator') {
        setIsCalculatorOpen(true);
      }

      if (tab === 'schedule') {
        setCurrentTab('schedule');
      } else if (tab === 'customers') {
        setCurrentTab('customers');
      } else if (tab === 'employees') {
        setCurrentTab('more');
        setMoreSubView('employees');
      } else if (tab === 'reports') {
        setCurrentTab('more');
        setMoreSubView('reports');
      }
    } catch (e) {
      console.warn('Error reading shortcut query parameters:', e);
    }

    return () => {
      unsubCustomers?.();
      unsubEmployees?.();
      unsubLogs?.();
      unsubSchedules?.();
      unsubSettings?.();
    };
  }, [loadDatabaseRecords]);

  // -------------------------------------------------------------
  // Dedicated Real-time Subscription for Authenticated User Profile (users/{uid})
  // Completely isolated from the other user's profile
  // -------------------------------------------------------------
  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let isMounted = true;

    const setupProfileSubscription = async () => {
      try {
        await initializeUserProfilesInFirestore();

        // 1. Fetch current document for activeUserUid
        const initial = await getUserProfile(activeUserUid);
        if (initial && isMounted) {
          setActiveProfile(initial);
        }

        // 2. Unsubscribe any prior listener before attaching
        unsubProfile?.();

        // 3. Attach real-time listener strictly to users/{activeUserUid}
        unsubProfile = subscribeUserProfile(
          activeUserUid,
          remoteProfile => {
            if (isMounted && remoteProfile) {
              setActiveProfile(remoteProfile);
            }
          },
          err => {
            console.warn(`Profile sync listener error for ${activeUserUid}:`, err);
          }
        );
      } catch (err) {
        console.error('Failed to setup profile subscription:', err);
      }
    };

    setupProfileSubscription();

    // Listen to Firebase Auth state for automatic Google user UID linking
    const unsubAuth = onAuthStateChanged(auth, async fbUser => {
      if (fbUser && isMounted) {
        if (fbUser.uid !== activeUserUid) {
          localStorage.setItem('sriram_farms_active_uid', fbUser.uid);
          setActiveUserUid(fbUser.uid);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubProfile?.();
      unsubAuth?.();
    };
  }, [activeUserUid]);

  // -------------------------------------------------------------
  // Profile Management Handlers (Strictly modifying users/{uid})
  // -------------------------------------------------------------
  const handleUpdateProfile = async (uid: string, partial: Partial<UserProfile>) => {
    try {
      // 1. Update only that user's Firestore document
      await saveUserProfileToFirestore(uid, partial);

      // 2. Update current user's UI immediately
      setActiveProfile(prev => ({
        ...prev,
        ...partial,
        uid,
        updatedAt: new Date().toISOString(),
      }));

      showToast(`${activeProfile.role} profile saved & synchronized across all ${activeProfile.role} devices!`, 'success');
    } catch (err) {
      console.error('Error saving user profile to Firestore:', err);
      showToast('Could not save profile to cloud. Please check network.', 'error');
    }
  };

  const handleSwitchAccount = async (targetRole: 'Owner' | 'Manager') => {
    const newUid = targetRole === 'Owner' ? OWNER_DEFAULT_UID : MANAGER_DEFAULT_UID;
    localStorage.setItem('sriram_farms_active_uid', newUid);

    // Pre-load targeted profile
    const targetProf = await getUserProfile(newUid);
    if (targetProf) {
      setActiveProfile(targetProf);
    } else {
      setActiveProfile(
        targetRole === 'Owner' ? DEFAULT_SETTINGS.userProfiles.owner : DEFAULT_SETTINGS.userProfiles.manager
      );
    }

    // Changing state triggers the profile subscription useEffect, which unsubscribes from the previous account
    setActiveUserUid(newUid);
    showToast(`Switched session to ${targetRole} (${targetRole === 'Owner' ? 'RAJA S' : 'DINESH H'})`);
  };

  const handleSignInWithGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        localStorage.setItem('sriram_farms_active_uid', user.uid);
        const existing = await getUserProfile(user.uid);
        if (existing) {
          setActiveProfile(existing);
        } else {
          const initialGoogleProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || 'SRIRAM FARMS Collaborator',
            email: user.email || '',
            mobile: user.phoneNumber || '8072514712',
            phone: user.phoneNumber || '8072514712',
            photoUrl: user.photoURL || undefined,
            photoURL: user.photoURL || undefined,
            role: 'Manager',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await saveUserProfileToFirestore(user.uid, initialGoogleProfile);
          setActiveProfile(initialGoogleProfile);
        }
        setActiveUserUid(user.uid);
        showToast(`Signed in with Google as ${user.displayName || user.email}!`);
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      showToast('Google Sign-In canceled or failed', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOutAuth();
    localStorage.setItem('sriram_farms_active_uid', OWNER_DEFAULT_UID);
    setActiveUserUid(OWNER_DEFAULT_UID);
    const ownerProf = await getUserProfile(OWNER_DEFAULT_UID);
    if (ownerProf) setActiveProfile(ownerProf);
    showToast('Signed out from Google. Active session reset to Owner account.');
  };

  // Language handler
  const handleLanguageToggle = async (newLang: Language) => {
    const updated = { ...settings, language: newLang };
    setSettings(updated);
    await db.settings.put({ key: 'appSettings', value: updated });
  };

  // -------------------------------------------------------------
  // Shared Customer CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveCustomer = async (cust: Customer) => {
    try {
      // 1. Authoritative write to Firestore FIRST
      await saveCustomerToFirestore(cust);

      // 2. Local cache in Dexie
      await db.customers.put(cust);

      // Cascade update to any linked schedules in local Dexie database
      const linked = schedules.filter(s => s.customerId === cust.id);
      for (const s of linked) {
        const updatedS: PlantingSchedule = {
          ...s,
          customerName: cust.name,
          village: cust.village,
          mobile: cust.mobile,
          updatedAt: new Date().toISOString(),
        };
        await db.schedules.put(updatedS);
      }

      // 3. Immediate local React state update
      setCustomers(prev => {
        const idx = prev.findIndex(c => c.id === cust.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = cust;
          return next;
        }
        return [cust, ...prev];
      });

      await loadDatabaseRecords();
      showToast(`Farmer record ${cust.id} (${cust.name}) saved permanently in Cloud Firestore!`, 'success');
    } catch (err: any) {
      console.error('Save customer error:', err);
      showToast(`Database write failed: ${err?.message || 'Check connection'}. Form retained for retry.`, 'error');
      // Rethrow so the form modal stays open and allows retry without losing input
      throw err;
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      // 1. Immediate optimistic UI removal
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      setSchedules(prev => prev.filter(s => s.customerId !== customerId));

      // 2. Permanently delete from Firestore (cascades to linked schedules)
      await deleteCustomerFromFirestore(customerId, true);

      // 3. Delete from local Dexie database
      await db.customers.delete(customerId);
      const linked = schedules.filter(s => s.customerId === customerId);
      for (const s of linked) {
        await db.schedules.delete(s.id);
      }

      await loadDatabaseRecords();
      setIsCustomerDetailOpen(false);
      setIsCustomerFormOpen(false);
      showToast('Customer record permanently deleted from database.', 'success');
    } catch (err: any) {
      console.error('Delete customer error:', err);
      showToast(`Delete failed: ${err?.message || 'Permission denied or network error'}`, 'error');
      await loadDatabaseRecords(true);
      throw err;
    }
  };

  const handleAddPayment = async (customerId: string, payment: PaymentRecord) => {
    const cust = customers.find(c => c.id === customerId) || (await db.customers.get(customerId));
    if (!cust) return;

    const updatedHistory = [...(cust.paymentHistory || []), payment];
    const totalPaid = updatedHistory.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, cust.totalCharge - totalPaid);
    const paymentStatus = balance === 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid';

    const updatedCustomer: Customer = {
      ...cust,
      totalCustomerPaid: totalPaid,
      remainingBalance: balance,
      paymentStatus,
      paymentHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
      updatedByRole: activeProfile.role,
      updatedByName: activeProfile.name,
    };

    await saveCustomerToFirestore(updatedCustomer);
    await db.customers.put(updatedCustomer);
    setSelectedCustomer(updatedCustomer);
    await loadDatabaseRecords();
    showToast(`Payment of ₹${payment.amount.toLocaleString('en-IN')} recorded permanently!`);
  };

  // -------------------------------------------------------------
  // Shared Schedule CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveSchedule = async (schedule: PlantingSchedule) => {
    try {
      await saveScheduleToFirestore(schedule);
      await db.schedules.put(schedule);
      setSchedules(prev => {
        const idx = prev.findIndex(s => s.id === schedule.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = schedule;
          return next;
        }
        return [...prev, schedule];
      });
      await loadDatabaseRecords();
      showToast(`Schedule for ${schedule.customerName} saved permanently in Cloud Firestore!`, 'success');
    } catch (err: any) {
      console.error('Save schedule error:', err);
      showToast(`Schedule save failed: ${err?.message || 'Check connection'}. Form retained for retry.`, 'error');
      throw err;
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteScheduleFromFirestore(scheduleId);
      await db.schedules.delete(scheduleId);
      await loadDatabaseRecords();
      showToast('Planting schedule permanently deleted.', 'success');
    } catch (err) {
      console.error('Delete schedule error:', err);
      await db.schedules.delete(scheduleId);
      await loadDatabaseRecords();
      showToast('Schedule deleted locally.', 'error');
    }
  };

  // -------------------------------------------------------------
  // Shared Employee Handlers
  // -------------------------------------------------------------
  const handleAddEmployee = async (emp: Employee) => {
    try {
      await saveEmployeeToFirestore(emp);
      await db.employees.put(emp);
      await loadDatabaseRecords();
      showToast(`Employee ${emp.name} saved permanently!`);
    } catch (err) {
      console.error('Add employee error:', err);
      await db.employees.put(emp);
      await loadDatabaseRecords();
      showToast(`Employee ${emp.name} saved locally`);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await deleteEmployeeFromFirestore(employeeId);
      await db.employees.delete(employeeId);
      await loadDatabaseRecords();
      showToast('Employee permanently deleted from database.', 'success');
    } catch (err) {
      console.error('Delete employee error:', err);
      await db.employees.delete(employeeId);
      await loadDatabaseRecords();
      showToast('Employee deleted from local device', 'error');
    }
  };

  const handleLogWork = async (log: EmployeeWorkLog) => {
    try {
      await saveWorkLogToFirestore(log);
      await db.employeeWorkLogs.put(log);
      await loadDatabaseRecords();
      showToast(`Work and wage logged permanently for ${log.employeeName}!`);
    } catch (err) {
      console.error('Log work error:', err);
      await db.employeeWorkLogs.put(log);
      await loadDatabaseRecords();
      showToast(`Work logged for ${log.employeeName}!`);
    }
  };

  // -------------------------------------------------------------
  // Reset Dashboard / Start Fresh Handler
  // -------------------------------------------------------------
  const handleResetDashboard = async () => {
    try {
      showToast('Resetting database and starting fresh...');
      const result = await resetDashboardSharedDatabase();
      await db.customers.clear();
      await db.employees.clear();
      await db.employeeWorkLogs.clear();
      await db.schedules.clear();
      await db.notifications.clear();

      setCustomers([]);
      setEmployees([]);
      setWorkLogs([]);
      setSchedules([]);
      setNotifications([]);

      showToast(
        `Reset complete! Removed ${result.deletedCustomers} customers, ${result.deletedEmployees} employees & schedules. Clean slate ready.`
      );
    } catch (err) {
      console.error('Dashboard reset error:', err);
      showToast('Failed to reset shared database. Please check connection.', 'error');
    }
  };

  // Google Sheets Export Handler
  const handleExportGoogleSheets = () => {
    try {
      exportToGoogleSheetsFormat(customers, employees, workLogs);
      showToast('Google Sheets ledger generated and exported successfully!');
    } catch (err) {
      console.error('Google Sheets export error:', err);
      showToast('Could not generate Google Sheets file', 'error');
    }
  };

  // PDF Download and Share Handlers
  const handleDownloadCustomerPdf = async (customer: Customer) => {
    try {
      showToast('Downloading official PDF receipt...');
      const doc = await generateCustomerPdf(customer, true);
      const filename = `SRIRAM_FARMS_${customer.id}_${customer.name.replace(/\s+/g, '_')}.pdf`;
      downloadPdfFile(doc, filename);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('Download customer PDF failed:', err);
      showToast('Could not download PDF', 'error');
    }
  };

  const handleShareCustomerPdf = async (customer: Customer) => {
    try {
      showToast('Preparing PDF to share...');
      const doc = await generateCustomerPdf(customer, true);
      const filename = `SRIRAM_FARMS_${customer.id}_${customer.name.replace(/\s+/g, '_')}.pdf`;
      const shared = await sharePdfFile(
        doc,
        filename,
        `SRIRAM FARMS Bill - ${customer.name}`,
        `SRIRAM FARMS Paddy Transplanter bill for ${customer.name} (${customer.village}). Total: ₹${customer.totalCharge}, Balance: ₹${customer.remainingBalance}.`
      );
      if (shared) showToast('Share dialog opened / document sent');
    } catch (err) {
      console.error('Share customer PDF failed:', err);
      showToast('Could not share PDF', 'error');
    }
  };

  const handleDownloadSeasonalReport = async () => {
    try {
      showToast('Downloading seasonal performance report...');
      const doc = await generateSeasonalReportPdf(customers, workLogs);
      const filename = `SRIRAM_FARMS_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      downloadPdfFile(doc, filename);
      showToast('Report downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Could not download report', 'error');
    }
  };

  const handleShareSeasonalReport = async () => {
    try {
      showToast('Preparing report to share...');
      const doc = await generateSeasonalReportPdf(customers, workLogs);
      const filename = `SRIRAM_FARMS_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      await sharePdfFile(doc, filename, 'SRIRAM FARMS Seasonal Performance Report');
    } catch (err) {
      console.error(err);
      showToast('Could not share report', 'error');
    }
  };

  const handleDownloadSchedulePdf = async (targetSchedules: PlantingSchedule[]) => {
    try {
      showToast('Downloading planting schedule PDF...');
      const doc = await generatePlantingSchedulePdf(targetSchedules);
      const filename = `SRIRAM_FARMS_Planting_Schedule_${new Date().toISOString().slice(0, 10)}.pdf`;
      downloadPdfFile(doc, filename);
      showToast('Schedule PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Could not download schedule PDF', 'error');
    }
  };

  const handleShareSchedulePdf = async (targetSchedules: PlantingSchedule[]) => {
    try {
      showToast('Preparing planting schedule to share...');
      const doc = await generatePlantingSchedulePdf(targetSchedules);
      const filename = `SRIRAM_FARMS_Planting_Schedule_${new Date().toISOString().slice(0, 10)}.pdf`;
      await sharePdfFile(
        doc,
        filename,
        'SRIRAM FARMS Planting Schedule',
        'Planting schedule and machinery booking plan from SRIRAM FARMS.'
      );
    } catch (err) {
      console.error(err);
      showToast('Could not share schedule PDF', 'error');
    }
  };

  // Compute live dashboard metrics
  const dashboardMetrics: DashboardMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const totalCustomers = customers.length;
    const totalAcres = customers.reduce((sum, c) => sum + (c.acres + c.cents / 100), 0);
    const totalCents = customers.reduce((sum, c) => sum + (c.acres * 100 + c.cents), 0);
    const smallMachineBookings = customers.filter(c => c.machineryType === 'Small Machine').length;
    const largeMachineBookings = customers.filter(c => c.machineryType === 'Large Machine').length;

    const totalCustomerCharges = customers.reduce((sum, c) => sum + c.totalCharge, 0);
    const totalAdvanceCollected = customers.reduce((sum, c) => sum + c.advancePayment, 0);
    const totalPaymentsCollected = customers.reduce((sum, c) => sum + c.totalCustomerPaid, 0);
    const totalRemainingBalance = customers.reduce((sum, c) => sum + c.remainingBalance, 0);

    const totalEmployeePayments = workLogs.reduce((sum, l) => sum + l.amountPaid, 0);
    const totalPendingEmployeeWages = workLogs.reduce((sum, l) => sum + l.pendingWage, 0);
    const netCashCollected = totalPaymentsCollected - totalEmployeePayments;

    const todaySeedingCount = customers.filter(c => c.seedingDate === todayStr).length;
    const todayPlantingCount =
      schedules.filter(s => s.scheduledDate === todayStr && s.status !== 'Completed').length ||
      customers.filter(
        c =>
          c.expectedPlantingDate === todayStr &&
          c.bookingStatus !== 'Planting Completed' &&
          c.bookingStatus !== 'Cancelled'
      ).length;

    const upcomingPlantingCount =
      schedules.filter(s => s.scheduledDate > todayStr && s.status !== 'Completed').length ||
      customers.filter(c => {
        if (c.bookingStatus === 'Planting Completed' || c.bookingStatus === 'Cancelled') return false;
        return c.expectedPlantingDate > todayStr;
      }).length;

    const overduePaymentCount = customers.filter(c => c.remainingBalance > 0).length;

    return {
      totalCustomers,
      totalAcres,
      totalCents,
      smallMachineBookings,
      largeMachineBookings,
      totalCustomerCharges,
      totalAdvanceCollected,
      totalPaymentsCollected,
      totalRemainingBalance,
      totalEmployeePayments,
      totalPendingEmployeeWages,
      netCashCollected,
      todaySeedingCount,
      todayPlantingCount,
      upcomingPlantingCount,
      overduePaymentCount,
    };
  }, [customers, workLogs, schedules]);

  // Schedule badge count (active schedules or reminders for today)
  const scheduleBadgeCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeScheduleToday = schedules.filter(
      s => s.scheduledDate === todayStr && s.status !== 'Completed'
    ).length;
    const notifCount = notifications.filter(
      n => (n.category === 'Today' || n.category === 'Overdue') && !n.isDone
    ).length;
    return activeScheduleToday || notifCount;
  }, [schedules, notifications]);

  // Navigation handlers
  const handleNavSelect = (tab: TabKey) => {
    setCurrentTab(tab);
    if (tab === 'calculator') {
      setIsCalculatorOpen(true);
    } else if (tab === 'more') {
      setMoreSubView('menu');
    }
  };

  const handleDashboardNavigate = (
    tab: 'customers' | 'schedule' | 'calculator' | 'more',
    subview?: string
  ) => {
    setCurrentTab(tab);
    if (tab === 'calculator') {
      setIsCalculatorOpen(true);
    } else if (tab === 'more' && subview) {
      setMoreSubView(subview as any);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center font-black text-amber-300 text-lg shadow-md animate-pulse">
          SF
        </div>
        <div className="mt-4 text-sm font-bold text-stone-800">SRIRAM FARMS</div>
        <p className="text-xs text-stone-500 mt-1">Connecting to shared cloud database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top App Bar */}
      <Header
        activeProfile={activeProfile}
        language={settings.language}
        onLanguageToggle={handleLanguageToggle}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        todayTasksCount={scheduleBadgeCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        {currentTab === 'home' && (
          <Dashboard
            metrics={dashboardMetrics}
            customers={customers}
            activeProfile={activeProfile}
            language={settings.language}
            onNavigate={handleDashboardNavigate}
            onAddCustomer={() => {
              setEditingCustomer(null);
              setIsCustomerFormOpen(true);
            }}
            onSelectCustomer={cust => {
              setSelectedCustomer(cust);
              setIsCustomerDetailOpen(true);
            }}
            onDownloadReport={handleDownloadSeasonalReport}
            onShareReport={handleShareSeasonalReport}
            onExportGoogleSheets={handleExportGoogleSheets}
            onResetDashboard={handleResetDashboard}
          />
        )}

        {currentTab === 'customers' && (
          <CustomerList
            customers={customers}
            schedules={schedules}
            language={settings.language}
            onRefreshData={() => loadDatabaseRecords(true)}
            onAddCustomer={() => {
              setEditingCustomer(null);
              setIsCustomerFormOpen(true);
            }}
            onSelectCustomer={cust => {
              setSelectedCustomer(cust);
              setIsCustomerDetailOpen(true);
            }}
            onEditCustomer={cust => {
              setEditingCustomer(cust);
              setIsCustomerFormOpen(true);
            }}
            onGeneratePdf={handleDownloadCustomerPdf}
            onDownloadPdf={handleDownloadCustomerPdf}
            onSharePdf={handleShareCustomerPdf}
            onDeleteCustomer={handleDeleteCustomer}
            onViewSchedules={() => setCurrentTab('schedule')}
          />
        )}

        {currentTab === 'schedule' && (
          <ScheduleView
            schedules={schedules}
            customers={customers}
            language={settings.language}
            activeProfile={activeProfile}
            onSelectCustomer={cust => {
              setSelectedCustomer(cust);
              setIsCustomerDetailOpen(true);
            }}
            onSaveSchedule={handleSaveSchedule}
            onSaveCustomer={handleSaveCustomer}
            onDeleteSchedule={handleDeleteSchedule}
            onDownloadSchedulePdf={handleDownloadSchedulePdf}
            onShareSchedulePdf={handleShareSchedulePdf}
          />
        )}

        {currentTab === 'more' && (
          <div>
            {moreSubView === 'menu' && (
              <MoreMenu
                activeProfile={activeProfile}
                language={settings.language}
                onLanguageToggle={handleLanguageToggle}
                onOpenSubView={sub => {
                  if (sub === 'profile') setIsProfileModalOpen(true);
                  else if (sub === 'backup') setIsBackupModalOpen(true);
                  else if (sub === 'help') setIsHelpModalOpen(true);
                  else setMoreSubView(sub);
                }}
                onExportGoogleSheets={handleExportGoogleSheets}
                onResetDashboard={handleResetDashboard}
              />
            )}

            {moreSubView === 'employees' && (
              <div>
                <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2">
                  <button
                    onClick={() => setMoreSubView('menu')}
                    className="text-xs font-bold text-emerald-800 hover:underline mb-2 inline-flex items-center gap-1"
                  >
                    ← Back to More Menu
                  </button>
                </div>
                <EmployeeModule
                  employees={employees}
                  workLogs={workLogs}
                  customers={customers}
                  language={settings.language}
                  onAddEmployee={handleAddEmployee}
                  onLogWork={handleLogWork}
                  onDeleteEmployee={handleDeleteEmployee}
                />
              </div>
            )}

            {moreSubView === 'reports' && (
              <div>
                <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2">
                  <button
                    onClick={() => setMoreSubView('menu')}
                    className="text-xs font-bold text-emerald-800 hover:underline mb-2 inline-flex items-center gap-1"
                  >
                    ← Back to More Menu
                  </button>
                </div>
                <ReportsView
                  customers={customers}
                  workLogs={workLogs}
                  language={settings.language}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleNavSelect}
        language={settings.language}
        scheduleBadgeCount={scheduleBadgeCount}
      />

      {/* Customer Registration & Edit Modal */}
      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => setIsCustomerFormOpen(false)}
        onSave={handleSaveCustomer}
        onDelete={handleDeleteCustomer}
        initialCustomer={editingCustomer}
        existingCustomerIds={customers.map(c => c.id)}
        employeesList={employees}
        language={settings.language}
        activeProfile={activeProfile}
      />

      {/* Customer Full Detail Modal */}
      <CustomerDetailModal
        customer={selectedCustomer}
        schedules={schedules}
        isOpen={isCustomerDetailOpen}
        onClose={() => setIsCustomerDetailOpen(false)}
        onEdit={cust => {
          setIsCustomerDetailOpen(false);
          setEditingCustomer(cust);
          setIsCustomerFormOpen(true);
        }}
        onAddPayment={handleAddPayment}
        onDownloadPdf={handleDownloadCustomerPdf}
        onSharePdf={handleShareCustomerPdf}
        onDeleteCustomer={handleDeleteCustomer}
        language={settings.language}
        activeProfile={activeProfile}
      />

      {/* Dedicated Calculator Modal */}
      <CalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        language={settings.language}
      />

      {/* Isolated Profile Management & Authentication Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        activeProfile={activeProfile}
        onUpdateProfile={handleUpdateProfile}
        onSwitchAccount={handleSwitchAccount}
        onSignInWithGoogle={handleSignInWithGoogle}
        onSignOut={handleSignOut}
        language={settings.language}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshData={loadDatabaseRecords}
        language={settings.language}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        language={settings.language}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold text-white transition-all bg-stone-900 border border-stone-800">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
