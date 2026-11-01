import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlantingPriceByCents,
  calculateTotalCents,
  convertCentsToAcres,
  cleanMobileNumber,
  formatCurrency,
  determinePaymentStatus,
  calculateSeedBags,
  DEFAULT_RATES,
} from '../src/utils/calculations';

describe('SRIRAM FARMS Machine Rates and Pricing Calculations', () => {
  it('should have correct default rates: Small=₹45/cent, Large=₹40/cent', () => {
    assert.equal(DEFAULT_RATES.smallCent, 45);
    assert.equal(DEFAULT_RATES.smallAcre, 4500);
    assert.equal(DEFAULT_RATES.largeCent, 40);
    assert.equal(DEFAULT_RATES.largeAcre, 4000);
  });

  it('calculates Small Machine correctly: 10 cents = 450, 25 cents = 1125', () => {
    const calc10 = calculatePlantingPriceByCents('Small Machine', 10);
    assert.equal(calc10.ratePerCent, 45);
    assert.equal(calc10.totalCents, 10);
    assert.equal(calc10.totalPrice, 450);
    assert.equal(calc10.formula, '10 cents × ₹45 = ₹450');

    const calc25 = calculatePlantingPriceByCents('Small Machine', 25);
    assert.equal(calc25.totalPrice, 1125);
    assert.equal(calc25.formula, '25 cents × ₹45 = ₹1,125');
  });

  it('calculates Large Machine correctly: 10 cents = 400, 25 cents = 1000', () => {
    const calc10 = calculatePlantingPriceByCents('Large Machine', 10);
    assert.equal(calc10.ratePerCent, 40);
    assert.equal(calc10.totalCents, 10);
    assert.equal(calc10.totalPrice, 400);
    assert.equal(calc10.formula, '10 cents × ₹40 = ₹400');

    const calc25 = calculatePlantingPriceByCents('Large Machine', 25);
    assert.equal(calc25.totalPrice, 1000);
    assert.equal(calc25.formula, '25 cents × ₹40 = ₹1,000');
  });

  it('correctly converts acres into cents: 1 acre = 100 cents', () => {
    // 1 acre = 100 cents
    const totalCents = calculateTotalCents(1, 0);
    assert.equal(totalCents, 100);

    const calc1AcreSmall = calculatePlantingPriceByCents('Small Machine', totalCents);
    assert.equal(calc1AcreSmall.totalCents, 100);
    assert.equal(calc1AcreSmall.totalPrice, 4500);

    const calc1AcreLarge = calculatePlantingPriceByCents('Large Machine', totalCents);
    assert.equal(calc1AcreLarge.totalCents, 100);
    assert.equal(calc1AcreLarge.totalPrice, 4000);

    // 2.5 acres = 250 cents
    const totalCents2_5 = calculateTotalCents(2, 50);
    assert.equal(totalCents2_5, 250);

    // reverse conversion
    const converted = convertCentsToAcres(250);
    assert.equal(converted.acres, 2);
    assert.equal(converted.cents, 50);
  });

  it('sanitizes mobile numbers without spaces or invalid chars', () => {
    assert.equal(cleanMobileNumber('80725 14712'), '8072514712');
    assert.equal(cleanMobileNumber('+91 80725 14712'), '8072514712');
    assert.equal(cleanMobileNumber('9840 123 456'), '9840123456');
  });

  it('formats initial payments with 0 correctly', () => {
    assert.equal(formatCurrency(0), '₹0');
    assert.equal(determinePaymentStatus(0, 0), 'Fully Paid');
    assert.equal(determinePaymentStatus(5000, 0), 'Unpaid');
    assert.equal(determinePaymentStatus(5000, 2000), 'Partially Paid');
    assert.equal(determinePaymentStatus(5000, 5000), 'Fully Paid');
  });

  it('calculates seed bag requirements correctly (30 kg standard)', () => {
    // 75 kg -> 2.5 bags, 3 whole bags required
    const seed75 = calculateSeedBags(75);
    assert.ok(seed75);
    assert.equal(seed75.seedUsedKg, 75);
    assert.equal(seed75.seedBags, 2.5);
    assert.equal(seed75.wholeBagsRequired, 3);
    assert.equal(seed75.isFractional, true);
    assert.equal(seed75.displayText, '2.5 bags; 3 whole bags required');

    // 60 kg -> exactly 2 bags
    const seed60 = calculateSeedBags(60);
    assert.ok(seed60);
    assert.equal(seed60.seedUsedKg, 60);
    assert.equal(seed60.seedBags, 2);
    assert.equal(seed60.wholeBagsRequired, 2);
    assert.equal(seed60.isFractional, false);
    assert.equal(seed60.displayText, '2 bags');

    // 25 kg -> 0.84 bags, 1 whole bag required
    const seed25 = calculateSeedBags(25);
    assert.ok(seed25);
    assert.equal(seed25.seedUsedKg, 25);
    assert.equal(seed25.seedBags, 0.84);
    assert.equal(seed25.wholeBagsRequired, 1);
    assert.equal(seed25.isFractional, true);
    assert.equal(seed25.displayText, '0.84 bags; 1 whole bag required');

    // 30 kg -> exactly 1 bag
    const seed30 = calculateSeedBags(30);
    assert.ok(seed30);
    assert.equal(seed30.seedBags, 1);
    assert.equal(seed30.wholeBagsRequired, 1);
    assert.equal(seed30.isFractional, false);
    assert.equal(seed30.displayText, '1 bag');

    // 0 or empty/negative/undefined -> null (Not recorded)
    assert.equal(calculateSeedBags(0), null);
    assert.equal(calculateSeedBags(-15), null);
    assert.equal(calculateSeedBags(undefined), null);
    assert.equal(calculateSeedBags(null), null);
    assert.equal(calculateSeedBags(NaN), null);
  });
});
