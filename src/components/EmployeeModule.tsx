import React, { useState } from 'react';
import { Employee, EmployeeWorkLog, Customer, Language } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  formatCurrency,
  formatDateDisplay,
  cleanMobileNumber,
  generateEmployeeId,
} from '../utils/calculations';
import { exportEmployeeLogsToCSV } from '../utils/csvExport';
import {
  HardHat,
  UserPlus,
  Plus,
  Phone,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Briefcase,
  X,
  Check,
  ChevronRight,
  Trash2,
} from 'lucide-react';

interface EmployeeModuleProps {
  employees: Employee[];
  workLogs: EmployeeWorkLog[];
  customers: Customer[];
  language: Language;
  onAddEmployee: (emp: Employee) => Promise<void>;
  onLogWork: (log: EmployeeWorkLog) => Promise<void>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
  onDeleteWorkLog?: (logId: string) => Promise<void>;
}

export const EmployeeModule: React.FC<EmployeeModuleProps> = ({
  employees,
  workLogs,
  customers,
  language,
  onAddEmployee,
  onLogWork,
  onDeleteEmployee,
  onDeleteWorkLog,
}) => {
  const t = useTranslation(language);
  const today = new Date().toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState<'logs' | 'workers' | 'summary'>('logs');

  // Delete Employee State
  const [employeePendingDelete, setEmployeePendingDelete] = useState<Employee | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);

  // Delete Work Log State
  const [logPendingDelete, setLogPendingDelete] = useState<EmployeeWorkLog | null>(null);
  const [isDeletingLog, setIsDeletingLog] = useState(false);

  const handleConfirmDeleteEmployee = async () => {
    if (!employeePendingDelete) return;
    setIsDeletingEmployee(true);
    try {
      await onDeleteEmployee(employeePendingDelete.id);
      setEmployeePendingDelete(null);
    } catch (err) {
      console.error('Delete employee error:', err);
    } finally {
      setIsDeletingEmployee(false);
    }
  };

  const handleConfirmDeleteLog = async () => {
    if (!logPendingDelete || !onDeleteWorkLog) return;
    setIsDeletingLog(true);
    try {
      await onDeleteWorkLog(logPendingDelete.id);
      setLogPendingDelete(null);
    } catch (err) {
      console.error('Delete work log error:', err);
    } finally {
      setIsDeletingLog(false);
    }
  };

  // New Employee Modal
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpMobile, setNewEmpMobile] = useState('');
  const [newEmpVillage, setNewEmpVillage] = useState('');
  const [newEmpNotes, setNewEmpNotes] = useState('');

  // New Work Log Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logWorkerId, setLogWorkerId] = useState(employees[0]?.id || '');
  const [logCustomerId, setLogCustomerId] = useState(customers[0]?.id || '');
  const [logWorkType, setLogWorkType] = useState<'Seeding' | 'Planting'>('Seeding');
  const [logDate, setLogDate] = useState(today);
  const [logEarned, setLogEarned] = useState<number | ''>('');
  const [logPaid, setLogPaid] = useState<number | ''>('');
  const [logNotes, setLogNotes] = useState('');

  // Metrics
  const totalEarned = workLogs.reduce((sum, l) => sum + l.amountEarned, 0);
  const totalPaid = workLogs.reduce((sum, l) => sum + l.amountPaid, 0);
  const totalPending = workLogs.reduce((sum, l) => sum + l.pendingWage, 0);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;

    const existingIds = employees.map(e => e.id);
    const nextId = generateEmployeeId(existingIds);

    const emp: Employee = {
      id: nextId,
      name: newEmpName.trim(),
      mobile: cleanMobileNumber(newEmpMobile),
      village: newEmpVillage.trim(),
      status: 'Active',
      notes: newEmpNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    await onAddEmployee(emp);
    setNewEmpName('');
    setNewEmpMobile('');
    setNewEmpVillage('');
    setNewEmpNotes('');
    setShowAddEmployeeModal(false);
  };

  const handleCreateWorkLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const worker = employees.find(e => e.id === logWorkerId);
    const cust = customers.find(c => c.id === logCustomerId);
    const earnedNum = logEarned === '' ? 0 : Math.max(0, Number(logEarned) || 0);
    const paidNum = logPaid === '' ? 0 : Math.max(0, Number(logPaid) || 0);

    const log: EmployeeWorkLog = {
      id: `LOG-${Date.now()}`,
      employeeId: logWorkerId,
      employeeName: worker?.name || 'Worker',
      mobile: worker?.mobile,
      village: worker?.village,
      workDate: logDate,
      customerId: logCustomerId,
      customerName: cust?.name || 'Farm Work',
      workType: logWorkType,
      amountEarned: earnedNum,
      amountPaid: paidNum,
      pendingWage: Math.max(0, earnedNum - paidNum),
      notes: logNotes.trim(),
    };

    await onLogWork(log);
    setLogEarned('');
    setLogPaid('');
    setLogNotes('');
    setShowLogModal(false);
  };

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto px-3 sm:px-6 pt-2">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            {t.employeesTitle}
          </h2>
          <p className="text-xs text-stone-500">
            Nursery labor, planting machine operators, and wage disbursements
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportEmployeeLogsToCSV(workLogs)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition min-h-[44px]"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>{t.addEmployee}</span>
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.logWork}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Wages Earned</span>
          <div className="text-lg sm:text-xl font-black text-stone-900 mt-1 tabular-nums">
            {formatCurrency(totalEarned)}
          </div>
          <span className="text-[10px] text-stone-500">{workLogs.length} work entries</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-purple-900 block">{t.employeeWagesPaid}</span>
          <div className="text-lg sm:text-xl font-black text-purple-800 mt-1 tabular-nums">
            {formatCurrency(totalPaid)}
          </div>
          <span className="text-[10px] text-stone-500">Disbursed cash</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-900 block">{t.pendingWages}</span>
          <div className="text-lg sm:text-xl font-black text-amber-700 mt-1 tabular-nums">
            {formatCurrency(totalPending)}
          </div>
          <span className="text-[10px] text-stone-500">Balance to pay</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-1 text-xs font-bold transition border-b-2 ${
            activeTab === 'logs' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500'
          }`}
        >
          {t.workLogs} ({workLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`pb-1 text-xs font-bold transition border-b-2 ${
            activeTab === 'workers' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500'
          }`}
        >
          {t.activeEmployees} ({employees.length})
        </button>
      </div>

      {/* TAB 1: WORK LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-2.5">
          {workLogs.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
              No employee work logs recorded yet.
            </div>
          ) : (
            workLogs.map(log => (
              <div
                key={log.id}
                className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-emerald-200 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-stone-900">{log.employeeName}</span>
                    {log.employeeId && (
                      <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {log.employeeId}
                      </span>
                    )}
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                      {log.workType === 'Seeding' ? 'Seeding / Nursery' : 'Machine Planting'}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600 flex items-center gap-2 flex-wrap">
                    <span>
                      Farm / Customer: <strong className="text-stone-900">{log.customerName}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Work Date: <span className="font-mono font-medium text-stone-800">{formatDateDisplay(log.workDate)}</span>
                    </span>
                  </div>

                  {log.notes && (
                    <div className="text-[11px] text-stone-500 italic">
                      Note: {log.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-stone-500">
                      Earned: <strong className="text-stone-900 font-mono">{formatCurrency(log.amountEarned)}</strong>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800 font-mono">
                      Paid: {formatCurrency(log.amountPaid)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-stone-400">Balance</div>
                    {log.pendingWage > 0 ? (
                      <span className="inline-block text-[11px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                        {formatCurrency(log.pendingWage)}
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Settled
                      </span>
                    )}
                  </div>

                  {onDeleteWorkLog && (
                    <button
                      type="button"
                      onClick={() => setLogPendingDelete(log)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70 flex items-center justify-center transition active:scale-95 shrink-0"
                      title={`Delete wage record for ${log.employeeName}`}
                      aria-label={`Delete wage record for ${log.employeeName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE WORKERS */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {employees.length === 0 ? (
            <div className="col-span-full p-8 bg-white rounded-2xl border border-stone-200 text-center shadow-xs">
              <HardHat className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-900">No employees found. Add your first employee.</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Add machine operators, helpers, nursery specialists, and labor records.
              </p>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                + Add Worker
              </button>
            </div>
          ) : (
            employees.map(emp => (
              <div key={emp.id} className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 block">{emp.id}</span>
                      <h4 className="text-sm font-bold text-stone-900">{emp.name}</h4>
                      <span className="text-xs text-stone-500">{emp.village}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {emp.mobile && (
                        <a
                          href={`tel:${cleanMobileNumber(emp.mobile)}`}
                          className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
                          title="Call Worker"
                          aria-label={`Call ${emp.name}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setEmployeePendingDelete(emp)}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70 flex items-center justify-center transition active:scale-95"
                        title={`Delete ${emp.name}`}
                        aria-label={`Delete ${emp.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {emp.notes && <p className="text-[11px] text-stone-500 italic mt-2">{emp.notes}</p>}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">Status: <strong className="text-emerald-700 font-bold">{emp.status}</strong></span>
                  <button
                    type="button"
                    onClick={() => setEmployeePendingDelete(emp)}
                    className="text-red-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Worker</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Modal: Delete Work Log */}
      {logPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Confirm Wage Log Deletion</h4>
                <p className="text-xs text-red-600 font-bold">Are you sure you want to permanently delete this wage record?</p>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1 my-3">
              <div><strong>Worker:</strong> {logPendingDelete.employeeName}</div>
              <div><strong>Customer / Farm:</strong> {logPendingDelete.customerName}</div>
              <div><strong>Work Date:</strong> {formatDateDisplay(logPendingDelete.workDate)}</div>
              <div><strong>Wage Earned:</strong> {formatCurrency(logPendingDelete.amountEarned)}</div>
              <div><strong>Amount Paid:</strong> {formatCurrency(logPendingDelete.amountPaid)}</div>
              {logPendingDelete.pendingWage > 0 && (
                <div><strong>Outstanding Balance:</strong> {formatCurrency(logPendingDelete.pendingWage)}</div>
              )}
            </div>

            <p className="text-[11px] text-stone-500 mb-4">
              This wage log will be permanently deleted from the shared Cloud Firestore database.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeletingLog}
                onClick={() => setLogPendingDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingLog}
                onClick={handleConfirmDeleteLog}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingLog ? 'Deleting...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Employee */}
      {employeePendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Confirm Worker Deletion</h4>
                <p className="text-xs text-red-600 font-bold">Are you sure you want to permanently delete this employee?</p>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1 my-3">
              <div><strong>Name:</strong> {employeePendingDelete.name}</div>
              <div><strong>ID:</strong> {employeePendingDelete.id}</div>
              {employeePendingDelete.village && <div><strong>Village:</strong> {employeePendingDelete.village}</div>}
              {employeePendingDelete.mobile && <div><strong>Mobile:</strong> {employeePendingDelete.mobile}</div>}
            </div>

            <p className="text-[11px] text-stone-500 mb-4">
              This employee record will be permanently deleted from the shared Firestore database.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeletingEmployee}
                onClick={() => setEmployeePendingDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingEmployee}
                onClick={handleConfirmDeleteEmployee}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingEmployee ? 'Deleting...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">{t.addEmployee}</h3>
            <form onSubmit={handleCreateEmployee} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Worker Name *</label>
                <input
                  type="text"
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  placeholder="e.g. Murugan K"
                  className="w-full p-2 text-xs rounded-lg border border-stone-300"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={newEmpMobile}
                  onChange={e => setNewEmpMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full p-2 text-xs rounded-lg border border-stone-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Village</label>
                <input
                  type="text"
                  value={newEmpVillage}
                  onChange={e => setNewEmpVillage(e.target.value)}
                  placeholder="e.g. Malaimedu"
                  className="w-full p-2 text-xs rounded-lg border border-stone-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Notes / Skill</label>
                <input
                  type="text"
                  value={newEmpNotes}
                  onChange={e => setNewEmpNotes(e.target.value)}
                  placeholder="Planting operator / Nursery specialist"
                  className="w-full p-2 text-xs rounded-lg border border-stone-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Work Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">Record Work & Wage</h3>
            <form onSubmit={handleCreateWorkLog} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Select Worker</label>
                <select
                  value={logWorkerId}
                  onChange={e => setLogWorkerId(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.village})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Select Customer / Farm</label>
                <select
                  value={logCustomerId}
                  onChange={e => setLogCustomerId(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.village} ({c.acres} Ac)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Work Type</label>
                  <select
                    value={logWorkType}
                    onChange={e => setLogWorkType(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Seeding">Seeding / Nursery</option>
                    <option value="Planting">Machine Planting</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Work Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Wage Earned (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={logEarned}
                    onChange={e => setLogEarned(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="e.g. ₹375, ₹425, ₹675"
                    className="w-full p-2 text-xs font-bold rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={logPaid}
                    onChange={e => setLogPaid(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="e.g. ₹375, ₹425"
                    className="w-full p-2 text-xs font-bold rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Calculated Outstanding Balance preview */}
              <div className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-lg border border-stone-200">
                <span className="text-stone-600 font-medium">Outstanding Balance:</span>
                <span className="font-bold text-amber-800 font-mono">
                  {formatCurrency(Math.max(0, (Number(logEarned) || 0) - (Number(logPaid) || 0)))}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Notes</label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="Tray preparation / field planting"
                  className="w-full p-2 text-xs rounded-lg border border-stone-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800"
                >
                  Record Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
