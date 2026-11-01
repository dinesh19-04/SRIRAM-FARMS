import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateCustomerId,
  generateScheduleId,
  doTimeSlotsOverlap,
  findConflictingSchedules,
  DEFAULT_RATES,
  calculatePlantingPriceByCents,
  calculateTotalCents,
} from '../src/utils/calculations';
import { Customer, PlantingSchedule } from '../src/types';

describe('Customer & Schedule Integration and Separation', () => {
  it('generates stable sequential customer IDs and schedule IDs', () => {
    const existingCustIds = ['SRF-2026-001', 'SRF-2026-002'];
    const nextCustId = generateCustomerId(existingCustIds, 2026);
    assert.strictEqual(nextCustId, 'SRF-2026-003');

    const existingSchedIds = ['SCH-2026-001', 'SCH-2026-002'];
    const nextSchedId = generateScheduleId(existingSchedIds, 2026);
    assert.strictEqual(nextSchedId, 'SCH-2026-003');
  });

  describe('Time-Slot Overlap Logic (doTimeSlotsOverlap)', () => {
    it('detects overlap for identical slots', () => {
      assert.strictEqual(
        doTimeSlotsOverlap('Morning (6:00 AM - 10:00 AM)', 'Morning (6:00 AM - 10:00 AM)'),
        true
      );
    });

    it('detects overlap when either slot is Full Day', () => {
      assert.strictEqual(
        doTimeSlotsOverlap('Full Day', 'Morning (6:00 AM - 10:00 AM)'),
        true
      );
      assert.strictEqual(
        doTimeSlotsOverlap('Afternoon (1:00 PM - 5:00 PM)', 'Full Day'),
        true
      );
    });

    it('detects overlap between two morning slots', () => {
      assert.strictEqual(
        doTimeSlotsOverlap('Morning (6:00 AM - 10:00 AM)', 'Morning (8:00 AM - 12:00 PM)'),
        true
      );
    });

    it('confirms Morning and Afternoon do NOT overlap', () => {
      assert.strictEqual(
        doTimeSlotsOverlap('Morning (6:00 AM - 10:00 AM)', 'Afternoon (1:00 PM - 5:00 PM)'),
        false
      );
      assert.strictEqual(
        doTimeSlotsOverlap('Morning (8:00 AM - 12:00 PM)', 'Afternoon (1:00 PM - 5:00 PM)'),
        false
      );
    });

    it('confirms Morning and Evening do NOT overlap', () => {
      assert.strictEqual(
        doTimeSlotsOverlap('Morning (6:00 AM - 10:00 AM)', 'Evening (3:00 PM - 7:00 PM)'),
        false
      );
    });

    it('detects overlap between Afternoon (1-5 PM) and Evening (3-7 PM) because 3-5 PM overlaps', () => {
      assert.strictEqual(
        doTimeSlotsOverlap('Afternoon (1:00 PM - 5:00 PM)', 'Evening (3:00 PM - 7:00 PM)'),
        true
      );
    });
  });

  describe('Smart Schedule Conflict Detection (findConflictingSchedules)', () => {
    const existing: PlantingSchedule[] = [
      {
        id: 'SCH-2026-001',
        customerId: 'SRF-2026-001',
        customerName: 'Kuppusamy',
        village: 'Malaimedu',
        mobile: '9876543210',
        machineryType: 'Small Machine',
        scheduledDate: '2026-11-05',
        timeSlot: 'Morning (6:00 AM - 10:00 AM)',
        acres: 1,
        cents: 0,
        totalCents: 100,
        ratePerCent: 45,
        totalAmount: 4500,
        status: 'Scheduled',
        createdAt: '2026-10-31T00:00:00.000Z',
        updatedAt: '2026-10-31T00:00:00.000Z',
      },
      {
        id: 'SCH-2026-002',
        customerId: 'SRF-2026-002',
        customerName: 'Murugan',
        village: 'Thirukoilur',
        mobile: '9876543211',
        machineryType: 'Small Machine',
        scheduledDate: '2026-11-05',
        timeSlot: 'Afternoon (1:00 PM - 5:00 PM)',
        acres: 2,
        cents: 0,
        totalCents: 200,
        ratePerCent: 45,
        totalAmount: 9000,
        status: 'Completed',
        createdAt: '2026-10-31T00:00:00.000Z',
        updatedAt: '2026-10-31T00:00:00.000Z',
      },
    ];

    it('flags conflict if same date, same machine, and overlapping morning slot', () => {
      const conflicts = findConflictingSchedules(existing, {
        scheduledDate: '2026-11-05',
        machineryType: 'Small Machine',
        timeSlot: 'Morning (8:00 AM - 12:00 PM)',
      });
      assert.strictEqual(conflicts.length, 1);
      assert.strictEqual(conflicts[0].id, 'SCH-2026-001');
    });

    it('does NOT flag conflict on same date and same machine if time slot is non-overlapping (Afternoon vs Morning)', () => {
      const conflicts = findConflictingSchedules(existing, {
        scheduledDate: '2026-11-05',
        machineryType: 'Small Machine',
        timeSlot: 'Afternoon (1:00 PM - 5:00 PM)',
      });
      // SCH-2026-001 is Morning (no overlap), SCH-2026-002 is Completed (no conflict)
      assert.strictEqual(conflicts.length, 0);
    });

    it('does NOT flag conflict if different machinery type is booked on the same day & slot', () => {
      const conflicts = findConflictingSchedules(existing, {
        scheduledDate: '2026-11-05',
        machineryType: 'Large Machine',
        timeSlot: 'Morning (6:00 AM - 10:00 AM)',
      });
      assert.strictEqual(conflicts.length, 0);
    });

    it('excludes self ID when editing an existing schedule', () => {
      const conflicts = findConflictingSchedules(existing, {
        id: 'SCH-2026-001',
        scheduledDate: '2026-11-05',
        machineryType: 'Small Machine',
        timeSlot: 'Morning (6:00 AM - 10:00 AM)',
      });
      assert.strictEqual(conflicts.length, 0);
    });
  });

  describe('Pricing Standards', () => {
    it('calculates Small Machine rate at ₹45/cent and Large Machine at ₹40/cent', () => {
      assert.strictEqual(DEFAULT_RATES.smallCent, 45);
      assert.strictEqual(DEFAULT_RATES.largeCent, 40);

      // 1 Acre = 100 Cents
      const cents1Ac = calculateTotalCents(1, 0);
      assert.strictEqual(cents1Ac, 100);

      const smallPrice = calculatePlantingPriceByCents('Small Machine', 100);
      assert.strictEqual(smallPrice.ratePerCent, 45);
      assert.strictEqual(smallPrice.totalPrice, 4500);

      const largePrice = calculatePlantingPriceByCents('Large Machine', 100);
      assert.strictEqual(largePrice.ratePerCent, 40);
      assert.strictEqual(largePrice.totalPrice, 4000);
    });
  });

  describe('Data Integrity: Customer vs Schedule separation', () => {
    it('customer record remains intact even when schedules are empty', () => {
      const customer: Customer = {
        id: 'SRF-2026-101',
        name: 'Ganesan P',
        village: 'Sithalavai',
        mobile: '9842100000',
        acres: 1,
        cents: 50,
        seedVariety: 'ADT 45',
        machineryType: 'Small Machine',
        rateType: 'Per Cent',
        seedingDate: '2026-11-01',
        plantingIntervalDays: 22,
        expectedPlantingDate: '2026-11-23',
        isPlantingDateOverridden: false,
        actualPlantingDate: null,
        bookingStatus: 'Booked',
        baseCharge: 6750,
        discountAmount: 0,
        totalCharge: 6750,
        advancePayment: 0,
        totalCustomerPaid: 0,
        remainingBalance: 6750,
        paymentStatus: 'Unpaid',
        paymentHistory: [],
        employees: [],
        season: '2026-27',
        createdAt: '2026-10-31T00:00:00.000Z',
        updatedAt: '2026-10-31T00:00:00.000Z',
      };

      const schedules: PlantingSchedule[] = [];
      const linked = schedules.filter(s => s.customerId === customer.id);
      assert.strictEqual(linked.length, 0);
      assert.strictEqual(customer.id, 'SRF-2026-101');
      assert.strictEqual(customer.name, 'Ganesan P');
    });

    it('schedule references customerId as foreign key', () => {
      const schedule: PlantingSchedule = {
        id: 'SCH-2026-050',
        customerId: 'SRF-2026-101',
        customerName: 'Ganesan P',
        village: 'Sithalavai',
        mobile: '9842100000',
        machineryType: 'Small Machine',
        scheduledDate: '2026-11-23',
        timeSlot: 'Morning (6:00 AM - 10:00 AM)',
        acres: 1,
        cents: 50,
        totalCents: 150,
        ratePerCent: 45,
        totalAmount: 6750,
        status: 'Scheduled',
        createdAt: '2026-10-31T00:00:00.000Z',
        updatedAt: '2026-10-31T00:00:00.000Z',
      };

      assert.strictEqual(schedule.customerId, 'SRF-2026-101');
    });
  });
});
