import React, { useState } from 'react';
import { db, initializeDatabase } from '../db/indexedDB';
import { Language } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  language: Language;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  language,
}) => {
  const t = useTranslation(language);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    setIsProcessing(true);
    try {
      const customers = await db.customers.toArray();
      const employees = await db.employees.toArray();
      const employeeWorkLogs = await db.employeeWorkLogs.toArray();
      const settings = await db.settings.toArray();

      const backupData = {
        app: 'SRIRAM_FARMS_MANAGER',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        customers,
        employees,
        employeeWorkLogs,
        settings,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SRIRAM_FARMS_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMsg({ type: 'success', text: t.backupSuccess });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Backup failed: ${err?.message || 'Storage error'}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.customers || !Array.isArray(parsed.customers)) {
          throw new Error('Invalid backup file structure: missing customer data.');
        }

        setIsProcessing(true);

        // Put into IndexedDB
        await db.transaction('rw', [db.customers, db.employees, db.employeeWorkLogs], async () => {
          if (parsed.customers?.length) {
            await db.customers.bulkPut(parsed.customers);
          }
          if (parsed.employees?.length) {
            await db.employees.bulkPut(parsed.employees);
          }
          if (parsed.employeeWorkLogs?.length) {
            await db.employeeWorkLogs.bulkPut(parsed.employeeWorkLogs);
          }
        });

        await onRefreshData();
        setStatusMsg({ type: 'success', text: t.restoreSuccess });
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: `Restore failed: ${err?.message || 'Invalid file'}` });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    setIsProcessing(true);
    try {
      await db.customers.clear();
      await db.employees.clear();
      await db.employeeWorkLogs.clear();
      await db.notifications.clear();
      await initializeDatabase();
      await onRefreshData();
      setShowConfirmReset(false);
      setStatusMsg({ type: 'success', text: 'Database reset to default seed records.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Reset failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-stone-200">
        <div className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold">{t.navBackup}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Download Backup */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Download JSON Backup</span>
            </h4>
            <p className="text-[11px] text-stone-500">
              Exports all farmers, machinery bookings, payment transactions, labor wages, and attached survey sketches to a file.
            </p>
            <button
              onClick={handleDownloadBackup}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.backupData}</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Restore from Backup File</span>
            </h4>
            <p className="text-[11px] text-stone-500">
              Upload a previously downloaded JSON backup file to import records onto this device.
            </p>
            <label className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{t.restoreData}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-stone-200">
            {showConfirmReset ? (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <p className="text-xs text-red-700 font-medium">
                  Are you sure you want to reload default seed demo data? Existing records will be reset.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetData}
                    className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1.5 bg-stone-200 text-stone-800 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="text-xs text-stone-500 hover:text-red-600 flex items-center gap-1 mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to default sample data</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-stone-100 border-t border-stone-200 flex justify-end">
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
