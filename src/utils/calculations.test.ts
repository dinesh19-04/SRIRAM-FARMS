import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalCents,
  calculateTotalAcres,
  convertCentsToAcres,
  calculateBaseCharge,
  calculateTotalCharge,
  calculateRemainingBalance,
  determinePaymentStatus,
  calculatePlantingDate,
  addDaysToDate,
  getDaysDifference,
  generateCustomerId,
  formatDateDisplay,
} from './calculations';

test('land conversion math matches specification (2 acres 50 cents = 250 cents = 2.5 acres)', () => {
  const cents = calculateTotalCents(2, 50);
  assert.equal(cents, 250);

  const acres = calculateTotalAcres(2, 50);
  assert.equal(acres, 2.5);

  const backConversion = convertCentsToAcres(250);
  assert.equal(backConversion.acres, 2);
  assert.equal(backConversion.cents, 50);
  assert.equal(backConversion.totalAcresDecimal, 2.5);
});

test('machinery pricing for 2.5 acres (2 acres 50 cents)', () => {
  // Small machine: ₹4,000/acre or ₹40/cent -> ₹10,000
  const smallByAcre = calculateBaseCharge(2, 50, 'Small Machine', 'Per Acre');
  assert.equal(smallByAcre, 10000);

  const smallByCent = calculateBaseCharge(2, 50, 'Small Machine', 'Per Cent');
  assert.equal(smallByCent, 10000);

  // Large machine: ₹4,500/acre or ₹45/cent -> ₹11,250
  const largeByAcre = calculateBaseCharge(2, 50, 'Large Machine', 'Per Acre');
  assert.equal(largeByAcre, 11250);

  const largeByCent = calculateBaseCharge(2, 50, 'Large Machine', 'Per Cent');
  assert.equal(largeByCent, 11250);
});

test('pricing with discount and balance calculation', () => {
  const baseCharge = calculateBaseCharge(2, 50, 'Small Machine', 'Per Acre'); // 10,000
  const totalCharge = calculateTotalCharge(baseCharge, 500); // 9,500 with ₹500 discount
  assert.equal(totalCharge, 9500);

  // Advance paid ₹3,000
  const balance = calculateRemainingBalance(totalCharge, 3000);
  assert.equal(balance, 6500);

  // Status check
  assert.equal(determinePaymentStatus(totalCharge, 0), 'Unpaid');
  assert.equal(determinePaymentStatus(totalCharge, 3000), 'Partially Paid');
  assert.equal(determinePaymentStatus(totalCharge, 9500), 'Fully Paid');
  assert.equal(determinePaymentStatus(totalCharge, 10000), 'Fully Paid');
});

test('planting date calculation with intervals (22, 23, 24, 25 days)', () => {
  const seedDate = '2026-10-01';
  assert.equal(calculatePlantingDate(seedDate, 22), '2026-10-23');
  assert.equal(calculatePlantingDate(seedDate, 23), '2026-10-24');
  assert.equal(calculatePlantingDate(seedDate, 24), '2026-10-25');
  assert.equal(calculatePlantingDate(seedDate, 25), '2026-10-26');

  // Month-end leap/wrap handling
  assert.equal(calculatePlantingDate('2026-10-20', 22), '2026-11-11');
});

test('days difference calculation', () => {
  assert.equal(getDaysDifference('2026-10-01', '2026-10-23'), 22);
  assert.equal(getDaysDifference('2026-10-23', '2026-10-20'), -3);
});

test('customer ID generation produces sequential IDs', () => {
  assert.equal(generateCustomerId([]), 'SRF-2026-001');
  assert.equal(generateCustomerId(['SRF-2026-001', 'SRF-2026-002']), 'SRF-2026-003');
  assert.equal(generateCustomerId(['SRF-2026-005', 'SRF-2026-001']), 'SRF-2026-006');
});

test('date display formatting outputs DD-MM-YYYY', () => {
  assert.equal(formatDateDisplay('2026-10-26'), '26-10-2026');
});
