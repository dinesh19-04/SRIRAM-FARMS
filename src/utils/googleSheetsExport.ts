import { Customer, Employee, EmployeeWorkLog } from '../types';
import { formatCurrency, formatDateDisplay } from './calculations';

/**
 * Creates and downloads a Google Sheets compatible TSV/CSV format or opens Google Sheets with formatted data
 */
export function exportToGoogleSheetsFormat(
  customers: Customer[],
  employees: Employee[],
  workLogs: EmployeeWorkLog[]
): void {
  // Construct multi-section CSV with UTF-8 BOM so Google Sheets opens special characters and Indian Rupee symbols cleanly
  let csvContent = '\uFEFF';

  // 1. Title Banner
  csvContent += 'SRIRAM FARMS - AGRICULTURAL MACHINERY & FARMER LEDGER\n';
  csvContent += `Generated On: ${new Date().toLocaleString('en-IN')}\n`;
  csvContent += 'Current Machine Rates: Small Machine = ₹45 per cent | Large Machine = ₹40 per cent | (1 Acre = 100 Cents)\n\n';

  // 2. Customers Table
  csvContent += '--- FARMER BOOKINGS & PLANTING SCHEDULE ---\n';
  const customerHeaders = [
    'Customer ID',
    'Farmer Name',
    'Village',
    'Mobile',
    'Acres',
    'Cents',
    'Total Cents',
    'Machinery Type',
    'Rate per Cent / Acre',
    'Base Charge (INR)',
    'Discount (INR)',
    'Total Charge (INR)',
    'Advance Paid (INR)',
    'Total Paid (INR)',
    'Remaining Balance (INR)',
    'Payment Status',
    'Seed Variety',
    'Seeding Date',
    'Expected Planting Date',
    'Booking Status',
    'Notes',
  ];
  csvContent += customerHeaders.map(h => `"${h}"`).join(',') + '\n';

  customers.forEach(c => {
    const totalCents = Math.round(c.acres * 100 + c.cents);
    const rateText = c.machineryType === 'Small Machine' ? '₹45/Cent (₹4,500/Ac)' : '₹40/Cent (₹4,000/Ac)';
    const row = [
      c.id,
      c.name,
      c.village,
      c.mobile,
      c.acres,
      c.cents,
      totalCents,
      c.machineryType,
      rateText,
      c.baseCharge,
      c.discountAmount || 0,
      c.totalCharge,
      c.advancePayment || 0,
      c.totalCustomerPaid,
      c.remainingBalance,
      c.paymentStatus,
      c.seedVariety || '',
      c.seedingDate,
      c.expectedPlantingDate,
      c.bookingStatus,
      (c.notes || '').replace(/"/g, '""'),
    ];
    csvContent += row.map(v => `"${v}"`).join(',') + '\n';
  });

  csvContent += '\n--- EMPLOYEES & WORKERS ---\n';
  const employeeHeaders = ['Employee ID', 'Name', 'Mobile', 'Village', 'Status', 'Notes'];
  csvContent += employeeHeaders.map(h => `"${h}"`).join(',') + '\n';

  employees.forEach(e => {
    const row = [e.id, e.name, e.mobile, e.village, e.status, (e.notes || '').replace(/"/g, '""')];
    csvContent += row.map(v => `"${v}"`).join(',') + '\n';
  });

  csvContent += '\n--- EMPLOYEE WORK & WAGE LOGS ---\n';
  const logHeaders = ['Log ID', 'Date', 'Worker Name', 'Farmer / Customer', 'Work Type', 'Earned (INR)', 'Paid (INR)', 'Pending Wage (INR)', 'Notes'];
  csvContent += logHeaders.map(h => `"${h}"`).join(',') + '\n';

  workLogs.forEach(l => {
    const row = [
      l.id,
      l.workDate,
      l.employeeName,
      l.customerName,
      l.workType,
      l.amountEarned,
      l.amountPaid,
      l.pendingWage,
      (l.notes || '').replace(/"/g, '""'),
    ];
    csvContent += row.map(v => `"${v}"`).join(',') + '\n';
  });

  // Create downloadable Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `SRIRAM_FARMS_GoogleSheets_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
