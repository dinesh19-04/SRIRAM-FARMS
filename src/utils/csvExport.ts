import { Customer, EmployeeWorkLog, PlantingSchedule } from '../types';
import { formatDateDisplay } from './calculations';

export function exportSchedulesToCSV(schedules: PlantingSchedule[], filename: string = 'sriram_farms_schedules.csv') {
  const headers = [
    'Schedule ID',
    'Customer ID',
    'Farmer Name',
    'Village',
    'Mobile',
    'Machinery Type',
    'Scheduled Date',
    'Scheduled Time',
    'Acres',
    'Cents',
    'Total Cents',
    'Rate Per Cent (INR)',
    'Total Amount (INR)',
    'Status',
    'Notes',
    'Created By',
  ];

  const rows = schedules.map(s => [
    `"${s.id}"`,
    `"${s.customerId}"`,
    `"${s.customerName.replace(/"/g, '""')}"`,
    `"${s.village.replace(/"/g, '""')}"`,
    `"${s.mobile}"`,
    `"${s.machineryType}"`,
    formatDateDisplay(s.scheduledDate),
    `"${s.scheduledTime || ''}"`,
    s.acres,
    s.cents,
    s.totalCents,
    s.ratePerCent,
    s.totalAmount,
    `"${s.status}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    `"${s.createdByRole || ''} (${s.createdByName || ''})"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportCustomersToCSV(customers: Customer[], filename: string = 'sriram_farms_customers.csv') {
  const headers = [
    'Customer ID',
    'Farmer Name',
    'Village',
    'Mobile',
    'Acres',
    'Cents',
    'Total Cents',
    'Seed Variety',
    'Machinery Type',
    'Billing Rate Type',
    'Seeding Date',
    'Planting Interval',
    'Expected Planting Date',
    'Actual Planting Date',
    'Booking Status',
    'Base Charge (INR)',
    'Discount (INR)',
    'Total Charge (INR)',
    'Advance Paid (INR)',
    'Total Paid (INR)',
    'Remaining Balance (INR)',
    'Payment Status',
    'Season',
    'Notes',
  ];

  const rows = customers.map(c => [
    `"${c.id}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.village.replace(/"/g, '""')}"`,
    `"${c.mobile}"`,
    c.acres,
    c.cents,
    c.acres * 100 + c.cents,
    `"${(c.seedVariety || '').replace(/"/g, '""')}"`,
    `"${c.machineryType}"`,
    `"${c.rateType}"`,
    formatDateDisplay(c.seedingDate),
    c.plantingIntervalDays,
    formatDateDisplay(c.expectedPlantingDate),
    formatDateDisplay(c.actualPlantingDate),
    `"${c.bookingStatus}"`,
    c.baseCharge,
    c.discountAmount,
    c.totalCharge,
    c.advancePayment,
    c.totalCustomerPaid,
    c.remainingBalance,
    `"${c.paymentStatus}"`,
    `"${c.season}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportEmployeeLogsToCSV(logs: EmployeeWorkLog[], filename: string = 'sriram_farms_wages.csv') {
  const headers = [
    'Log ID',
    'Worker ID',
    'Worker Name',
    'Work Date',
    'Customer ID',
    'Customer Name',
    'Work Type',
    'Amount Earned (INR)',
    'Amount Paid (INR)',
    'Pending Wage (INR)',
    'Notes',
  ];

  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.employeeId}"`,
    `"${l.employeeName.replace(/"/g, '""')}"`,
    formatDateDisplay(l.workDate),
    `"${l.customerId}"`,
    `"${l.customerName.replace(/"/g, '""')}"`,
    `"${l.workType}"`,
    l.amountEarned,
    l.amountPaid,
    l.pendingWage,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
