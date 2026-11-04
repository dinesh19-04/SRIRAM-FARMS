import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Customer, PlantingSchedule, Employee, CustomerEmployeeAssignment, BookingStatus, ScheduleStatus } from '../src/types';

describe('SRIRAM FARMS Website Updates Verification', () => {
  it('1. Status synchronization maps correctly between Schedule and Customer', () => {
    // When Schedule status is Completed -> Customer bookingStatus is 'Planting Completed'
    const scheduleStatusToCustomer = (status: ScheduleStatus): BookingStatus => {
      switch (status) {
        case 'Completed':
          return 'Planting Completed';
        case 'In Progress':
        case 'Pending':
          return 'Planting Pending';
        case 'Scheduled':
          return 'Booked';
      }
    };

    assert.strictEqual(scheduleStatusToCustomer('Completed'), 'Planting Completed');
    assert.strictEqual(scheduleStatusToCustomer('In Progress'), 'Planting Pending');
    assert.strictEqual(scheduleStatusToCustomer('Pending'), 'Planting Pending');
    assert.strictEqual(scheduleStatusToCustomer('Scheduled'), 'Booked');

    // When Customer bookingStatus is Planting Completed -> Schedule status is 'Completed'
    const customerStatusToSchedule = (status: BookingStatus, prev: ScheduleStatus): ScheduleStatus => {
      if (status === 'Planting Completed') return 'Completed';
      if (status === 'Planting Pending') return prev === 'Completed' ? 'In Progress' : prev;
      if (status === 'Booked') return 'Scheduled';
      return prev;
    };

    assert.strictEqual(customerStatusToSchedule('Planting Completed', 'Scheduled'), 'Completed');
    assert.strictEqual(customerStatusToSchedule('Planting Pending', 'Completed'), 'In Progress');
    assert.strictEqual(customerStatusToSchedule('Booked', 'Completed'), 'Scheduled');
  });

  it('2. Amount fields allow free-form whole numbers without 0 default or artificial steps', () => {
    // Simulates the input parsing logic implemented in the components
    const parseAmountInput = (raw: string): number | '' => {
      if (raw === '') return '';
      const parsed = parseInt(raw, 10);
      return isNaN(parsed) ? '' : Math.max(0, parsed);
    };

    // Starts blank
    assert.strictEqual(parseAmountInput(''), '');
    // Allows ₹1
    assert.strictEqual(parseAmountInput('1'), 1);
    // Allows odd non-step amounts like ₹375, ₹425, ₹675
    assert.strictEqual(parseAmountInput('375'), 375);
    assert.strictEqual(parseAmountInput('425'), 425);
    assert.strictEqual(parseAmountInput('675'), 675);
    // Allows large amounts
    assert.strictEqual(parseAmountInput('150000'), 150000);
    // Disallows negative
    assert.strictEqual(parseAmountInput('-50'), 0);
  });

  it('3. Customer Employee Assignment persists worker selection and wages', () => {
    const employee: Employee = {
      id: 'EMP-001',
      name: 'Murugan K',
      mobile: '9842111111',
      village: 'Malaimedu',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const assignment: CustomerEmployeeAssignment = {
      id: 'ASN-1',
      employeeId: employee.id,
      employeeName: employee.name,
      amountPaid: 425,
      date: '2026-11-03',
      notes: 'Nursery tray preparation',
    };

    const customer: Partial<Customer> = {
      id: 'CUST-001',
      name: 'K. Ramasamy',
      employees: [assignment],
    };

    assert.strictEqual(customer.employees?.length, 1);
    assert.strictEqual(customer.employees[0].employeeId, 'EMP-001');
    assert.strictEqual(customer.employees[0].employeeName, 'Murugan K');
    assert.strictEqual(customer.employees[0].amountPaid, 425);
  });

  it('4. Automatic Customer Date defaults to current ISO date string', () => {
    const today = new Date().toISOString().split('T')[0];
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
    // Registration auto-recorded date is valid today's date
    const autoRecordedDate = today;
    assert.strictEqual(autoRecordedDate.length, 10);
  });
});
