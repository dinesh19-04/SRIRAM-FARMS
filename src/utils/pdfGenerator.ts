import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, EmployeeWorkLog, PlantingSchedule } from '../types';
import { formatDateDisplay, formatCurrency } from './calculations';

const BRAND_NAME = 'SRIRAM FARMS';
const CONTACT_LINE = 'MOB NO: 8072514712';
const ADDRESS_LINE = 'MALAIMEDU VILLAGE, SHOLINGHUR TALUK, RANIPET DIST - 632505.';
const FOOTER_LEFT = 'Prop: RAJA S | Mngr.: DINESH H';
const GRATITUDE_NOTE =
  'Thank you for choosing SRIRAM FARMS. We sincerely appreciate your trust and support. We look forward to serving you again.';

function addHeaderAndWatermark(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // (Center slanting watermark removed as requested by user)

  // Top header green brand band
  doc.setFillColor(21, 128, 61); // emerald-700
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // Decorative accent line
  doc.setFillColor(234, 179, 8); // amber-500
  doc.rect(14, 4.5, pageWidth - 28, 1, 'F');

  // Interactive Header Badge Lockup
  doc.setFillColor(243, 249, 245);
  doc.setDrawColor(187, 225, 199);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth / 2 - 65, 8, 130, 21, 3, 3, 'FD');

  // Header Title - Interactive / Stylized Font
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 83, 45); // deep emerald
  doc.text(BRAND_NAME, pageWidth / 2, 14.5, { align: 'center' });

  // Contact line with icon-style formatting (no spaces in mobile number)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('MOB: 8072514712', pageWidth / 2, 19.5, { align: 'center' });

  // Address Line in clean legible type
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text(ADDRESS_LINE, pageWidth / 2, 25, { align: 'center' });

  // Stylized double divider line below header
  doc.setDrawColor(209, 231, 217);
  doc.setLineWidth(0.6);
  doc.line(14, 32, pageWidth - 14, 32);

  // Modern Interactive Footer
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, pageHeight - 14, pageWidth - 28, 9, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Prop: RAJA S | Mngr.: DINESH H', 20, pageHeight - 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, pageHeight - 8.5, {
    align: 'right',
  });
}

/**
 * Generate Individual Customer Invoice / Service Receipt PDF
 */
export async function generateCustomerPdf(
  customer: Customer,
  includeLandImage: boolean = true
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 38;

  // Receipt / Booking Title Banner
  doc.setFillColor(240, 248, 242);
  doc.roundedRect(14, currentY, pageWidth - 28, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text('PLANTING & SEEDING SERVICE RECEIPT', 20, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Date: ${formatDateDisplay(new Date().toISOString().slice(0, 10))}`, pageWidth - 20, currentY + 6.5, {
    align: 'right',
  });

  currentY += 16;

  // Farmer & Machinery Information Two-Column Grid
  const leftColX = 14;
  const rightColX = pageWidth / 2 + 3;
  const colWidth = pageWidth / 2 - 17;

  // Farmer Details Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 220, 215);
  doc.roundedRect(leftColX, currentY, colWidth, 42, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(21, 128, 61);
  doc.text('FARMER DETAILS', leftColX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Customer ID:`, leftColX + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.id, leftColX + 32, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Name:`, leftColX + 4, currentY + 18);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.name, leftColX + 32, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.text(`Village:`, leftColX + 4, currentY + 24);
  doc.text(customer.village, leftColX + 32, currentY + 24);

  doc.text(`Mobile:`, leftColX + 4, currentY + 30);
  doc.text(customer.mobile, leftColX + 32, currentY + 30);

  doc.text(`Season:`, leftColX + 4, currentY + 36);
  doc.text(customer.season || '2026-27', leftColX + 32, currentY + 36);

  // Machinery & Schedule Box
  doc.roundedRect(rightColX, currentY, colWidth, 42, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(21, 128, 61);
  doc.text('MACHINERY & SCHEDULE', rightColX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  doc.text(`Machinery:`, rightColX + 4, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.machineryType, rightColX + 32, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Land Area:`, rightColX + 4, currentY + 18);
  doc.setFont('helvetica', 'bold');
  const centsText = customer.cents > 0 ? ` & ${customer.cents} Cents` : '';
  doc.text(`${customer.acres} Acres${centsText} (${(customer.acres * 100 + customer.cents)} Cts)`, rightColX + 32, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.text(`Seed Variety:`, rightColX + 4, currentY + 24);
  doc.text(customer.seedVariety || 'Paddy', rightColX + 32, currentY + 24);

  doc.text(`Seeding Date:`, rightColX + 4, currentY + 30);
  doc.text(formatDateDisplay(customer.seedingDate), rightColX + 32, currentY + 30);

  doc.text(`Planting Date:`, rightColX + 4, currentY + 36);
  doc.setFont('helvetica', 'bold');
  const actualDone = customer.actualPlantingDate ? ` (Done: ${formatDateDisplay(customer.actualPlantingDate)})` : '';
  doc.text(`${formatDateDisplay(customer.expectedPlantingDate)}${actualDone}`, rightColX + 32, currentY + 36);

  currentY += 48;

  // Billing & Payment Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61);
  doc.text('FINANCIAL & PAYMENT BREAKDOWN', 14, currentY);
  currentY += 3;

  const unitRateText =
    customer.rateType === 'Per Acre'
      ? `${customer.machineryType === 'Small Machine' ? 'Rs. 4,000' : 'Rs. 4,500'} / Acre`
      : `${customer.machineryType === 'Small Machine' ? 'Rs. 40' : 'Rs. 45'} / Cent`;

  const paymentTableRows = [
    ['Billing Rate Basis', `${customer.rateType} (${unitRateText})`],
    ['Calculated Base Machinery Charge', `Rs. ${customer.baseCharge.toLocaleString('en-IN')}`],
    ['Discount / Concession', customer.discountAmount > 0 ? `- Rs. ${customer.discountAmount.toLocaleString('en-IN')} (${customer.discountReason || 'Courtesy'})` : 'Rs. 0'],
    ['Final Total Charge', `Rs. ${customer.totalCharge.toLocaleString('en-IN')}`],
    ['Advance Payment Received', `Rs. ${customer.advancePayment.toLocaleString('en-IN')}`],
    ['Total Customer Payments Received', `Rs. ${customer.totalCustomerPaid.toLocaleString('en-IN')}`],
    ['Remaining Outstanding Balance', `Rs. ${customer.remainingBalance.toLocaleString('en-IN')}`],
    ['Payment Status', customer.paymentStatus],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Item Description', 'Details / Amount']],
    body: paymentTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Payment History Sub-table if payments exist
  if (customer.paymentHistory && customer.paymentHistory.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(21, 128, 61);
    doc.text('PAYMENT TRANSACTIONS HISTORY', 14, currentY);
    currentY += 3;

    const histRows = customer.paymentHistory.map((p, idx) => [
      String(idx + 1),
      formatDateDisplay(p.date),
      `Rs. ${p.amount.toLocaleString('en-IN')}`,
      p.method,
      p.recordedBy || 'RAJA S',
      p.notes || '-',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Date', 'Amount', 'Payment Mode', 'Recorded By', 'Notes']],
      body: histRows,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 245, 240],
        textColor: [30, 80, 40],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Seeding Employees Table
  if (customer.employees && customer.employees.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(21, 128, 61);
    doc.text('SEEDING & NURSERY LABOR RECORD', 14, currentY);
    currentY += 3;

    const empRows = customer.employees.map((e, idx) => [
      String(idx + 1),
      e.employeeName,
      formatDateDisplay(e.date),
      `Rs. ${e.amountPaid.toLocaleString('en-IN')}`,
      e.notes || 'Tray preparation',
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Worker Name', 'Work Date', 'Wage Paid', 'Notes']],
      body: empRows,
      theme: 'plain',
      headStyles: {
        fillColor: [235, 243, 238],
        textColor: [20, 60, 30],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Field Notes
  if (customer.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text('Field & Landmark Notes:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(customer.notes, 14, currentY + 4, { maxWidth: pageWidth - 28 });
    currentY += 12;
  }

  // Land measurement screenshot / G Land Image if present and selected
  if (includeLandImage && customer.landImage?.dataUrl) {
    // Check if enough space on current page, else add page
    if (currentY > 210) {
      doc.addPage();
      currentY = 38;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(21, 128, 61);
    doc.text('LAND MEASUREMENT / G LAND REFERENCE', 14, currentY);
    currentY += 4;

    try {
      doc.addImage(customer.landImage.dataUrl, 'JPEG', 14, currentY, 80, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Recorded Date: ${formatDateDisplay(customer.landImage.capturedDate)}`, 98, currentY + 10);
      if (customer.landImage.notes) {
        doc.text(`Notes: ${customer.landImage.notes}`, 98, currentY + 16, { maxWidth: pageWidth - 105 });
      }
      currentY += 56;
    } catch {
      // If image format fails, write reference text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('(Image attached in system record)', 14, currentY + 6);
      currentY += 12;
    }
  }

  // Gratitude note at bottom of last page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 95, 75);
  doc.text(`"${GRATITUDE_NOTE}"`, pageWidth / 2, pageHeight - 20, {
    align: 'center',
    maxWidth: pageWidth - 28,
  });

  // Apply repeated header and watermarks across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndWatermark(doc, i, totalPages);
  }

  return doc;
}

/**
 * Generate Filtered Seasonal Summary Report PDF
 */
export async function generateSeasonalReportPdf(
  customers: Customer[],
  employeeLogs: EmployeeWorkLog[],
  seasonTitle: string = 'Samba / Thaladi 2026-27',
  filterSummary?: string
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 38;

  // Title Banner
  doc.setFillColor(240, 248, 242);
  doc.roundedRect(14, currentY, pageWidth - 28, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(21, 128, 61);
  doc.text(`SEASONAL MACHINERY PERFORMANCE & FINANCIAL REPORT`, 20, currentY + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Season: ${seasonTitle}  |  Generated: ${formatDateDisplay(new Date().toISOString().slice(0, 10))}`, pageWidth - 20, currentY + 7.5, {
    align: 'right',
  });

  currentY += 16;

  // Calculate Metrics
  const totalFarmers = customers.length;
  const totalAcres = customers.reduce((sum, c) => sum + (c.acres + c.cents / 100), 0);
  const smallAcres = customers.filter(c => c.machineryType === 'Small Machine').reduce((sum, c) => sum + (c.acres + c.cents / 100), 0);
  const largeAcres = customers.filter(c => c.machineryType === 'Large Machine').reduce((sum, c) => sum + (c.acres + c.cents / 100), 0);
  const totalBilled = customers.reduce((sum, c) => sum + c.totalCharge, 0);
  const totalCollected = customers.reduce((sum, c) => sum + c.totalCustomerPaid, 0);
  const totalBalance = customers.reduce((sum, c) => sum + c.remainingBalance, 0);
  const totalWagesPaid = employeeLogs.reduce((sum, l) => sum + l.amountPaid, 0);
  const netCashInHand = totalCollected - totalWagesPaid;

  // KPI Summary Strip
  const kpiData = [
    ['Total Farmers', `${totalFarmers}`],
    ['Total Land Area', `${totalAcres.toFixed(2)} Acres`],
    ['Small Machine Area', `${smallAcres.toFixed(2)} Ac`],
    ['Large Machine Area', `${largeAcres.toFixed(2)} Ac`],
    ['Gross Revenue', `Rs. ${totalBilled.toLocaleString('en-IN')}`],
    ['Collected Cash', `Rs. ${totalCollected.toLocaleString('en-IN')}`],
    ['Customer Balances', `Rs. ${totalBalance.toLocaleString('en-IN')}`],
    ['Wages Disbursed', `Rs. ${totalWagesPaid.toLocaleString('en-IN')}`],
    ['Net Cash in Hand', `Rs. ${netCashInHand.toLocaleString('en-IN')}`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [kpiData.map(k => k[0])],
    body: [kpiData.map(k => k[1])],
    theme: 'grid',
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      fontStyle: 'bold',
      textColor: [30, 30, 30],
      halign: 'center',
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Customer Records Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(21, 128, 61);
  doc.text('CUSTOMER-WISE SEEDING & PLANTING REGISTER', 14, currentY);
  currentY += 3;

  const tableRows = customers.map((c, i) => [
    String(i + 1),
    c.id,
    c.name,
    c.village,
    c.mobile,
    `${c.acres} Ac ${c.cents > 0 ? `${c.cents} C` : ''}`,
    c.machineryType === 'Small Machine' ? 'Small' : 'Large',
    formatDateDisplay(c.seedingDate),
    formatDateDisplay(c.expectedPlantingDate),
    c.actualPlantingDate ? formatDateDisplay(c.actualPlantingDate) : 'Pending',
    `Rs. ${c.totalCharge.toLocaleString('en-IN')}`,
    `Rs. ${c.totalCustomerPaid.toLocaleString('en-IN')}`,
    `Rs. ${c.remainingBalance.toLocaleString('en-IN')}`,
    c.paymentStatus,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [[
      '#',
      'ID',
      'Farmer Name',
      'Village',
      'Mobile',
      'Area',
      'Machine',
      'Seeding',
      'Exp. Plant',
      'Act. Plant',
      'Total (Rs)',
      'Paid (Rs)',
      'Balance (Rs)',
      'Status',
    ]],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 18 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 16 },
      6: { cellWidth: 16 },
      7: { cellWidth: 18 },
      8: { cellWidth: 18 },
      9: { cellWidth: 18 },
      10: { halign: 'right', cellWidth: 20 },
      11: { halign: 'right', cellWidth: 20 },
      12: { halign: 'right', cellWidth: 20 },
      13: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 95, 75);
  doc.text(`"${GRATITUDE_NOTE}"`, pageWidth / 2, pageHeight - 20, {
    align: 'center',
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndWatermark(doc, i, totalPages);
  }

  return doc;
}

/**
 * Generate Planting Schedule Report PDF
 */
export async function generatePlantingSchedulePdf(schedules: PlantingSchedule[]): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 38;

  // Title Banner
  doc.setFillColor(240, 248, 242);
  doc.roundedRect(14, currentY, pageWidth - 28, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text('PLANTING & SEEDING SCHEDULE REPORT', 20, currentY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Generated: ${formatDateDisplay(new Date().toISOString().slice(0, 10))}`, pageWidth - 20, currentY + 6.5, {
    align: 'right',
  });

  currentY += 15;

  const tableData = schedules.map((s, idx) => [
    (idx + 1).toString(),
    formatDateDisplay(s.scheduledDate),
    s.scheduledTime || '-',
    s.customerName,
    s.village,
    s.mobile,
    s.machineryType,
    `${s.acres > 0 ? `${s.acres} Ac ` : ''}${s.cents > 0 ? `${s.cents} Cts` : ''}`.trim() || `${s.totalCents} Cts`,
    `Rs.${s.ratePerCent}/ct`,
    `Rs.${s.totalAmount.toLocaleString('en-IN')}`,
    s.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date', 'Time', 'Farmer', 'Village', 'Mobile', 'Machine', 'Area', 'Rate', 'Total', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [21, 128, 61],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 16 },
      3: { cellWidth: 24 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 16 },
      8: { cellWidth: 14 },
      9: { halign: 'right', cellWidth: 18 },
      10: { halign: 'center', cellWidth: 16 },
    },
    margin: { left: 14, right: 14 },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndWatermark(doc, i, totalPages);
  }

  return doc;
}

/**
 * BUTTON 1: DIRECT PDF DOWNLOAD
 * Strictly generates/downloads the PDF file to the user's device directly.
 * NEVER opens WhatsApp, email, or OS share sheets.
 */
export function downloadPdfFile(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * BUTTON 2: NATIVE SHARE OR FALLBACK
 * Invokes the operating system's native share dialog (WhatsApp, Email, etc.)
 * If native sharing is not available or rejected, provides direct download and copies text.
 */
export async function sharePdfFile(
  doc: jsPDF,
  filename: string,
  title: string = 'SRIRAM FARMS Document',
  text: string = 'Sharing document from SRIRAM FARMS'
): Promise<boolean> {
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return true;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return false;
      }
      // If user canceled or failed, fallback to direct download
    }
  }

  // Fallback download if share not supported or failed
  downloadPdfFile(doc, filename);
  return true;
}

/**
 * Backward compatibility helper
 */
export async function shareOrDownloadPdf(doc: jsPDF, filename: string): Promise<boolean> {
  downloadPdfFile(doc, filename);
  return true;
}
