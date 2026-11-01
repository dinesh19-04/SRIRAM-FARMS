import React, { useState } from 'react';
import { Language } from '../types';
import { useTranslation } from '../i18n/translations';
import {
  calculateTotalCents,
  calculateTotalAcres,
  convertCentsToAcres,
  calculateBaseCharge,
  calculateTotalCharge,
  calculateRemainingBalance,
  calculatePlantingDate,
  formatCurrency,
  formatDateDisplay,
} from '../utils/calculations';
import {
  Calculator as CalcIcon,
  Copy,
  Check,
  RotateCcw,
  Tractor,
  Calendar,
  Layers,
  X,
} from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = useTranslation(language);
  const [calcTab, setCalcTab] = useState<'machinery' | 'land' | 'dates' | 'standard'>('machinery');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Machinery Calculator State
  const [calcAcres, setCalcAcres] = useState<number>(1);
  const [calcCents, setCalcCents] = useState<number>(50);
  const [calcDiscount, setCalcDiscount] = useState<number>(0);
  const [calcAdvance, setCalcAdvance] = useState<number>(0);

  // Land Converter State
  const [inputAcres, setInputAcres] = useState<number>(2);
  const [inputCents, setInputCents] = useState<number>(50);
  const [inputTotalCents, setInputTotalCents] = useState<number>(250);

  // Date Calculator State
  const [calcSeedDate, setCalcSeedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [calcInterval, setCalcInterval] = useState<22 | 23 | 24 | 25>(22);

  // Standard Calculator State
  const [stdDisplay, setStdDisplay] = useState('0');
  const [stdPrevValue, setStdPrevValue] = useState<number | null>(null);
  const [stdOperator, setStdOperator] = useState<string | null>(null);
  const [stdWaitingForOperand, setStdWaitingForOperand] = useState(false);

  if (!isOpen) return null;

  // Machinery Calculations
  const smallBase = calculateBaseCharge(calcAcres, calcCents, 'Small Machine', 'Per Acre');
  const smallTotal = calculateTotalCharge(smallBase, calcDiscount);
  const smallBalance = calculateRemainingBalance(smallTotal, calcAdvance);

  const largeBase = calculateBaseCharge(calcAcres, calcCents, 'Large Machine', 'Per Acre');
  const largeTotal = calculateTotalCharge(largeBase, calcDiscount);
  const largeBalance = calculateRemainingBalance(largeTotal, calcAdvance);

  // Land Converter Calculations
  const calculatedTotalCents = calculateTotalCents(inputAcres, inputCents);
  const calculatedTotalAcres = calculateTotalAcres(inputAcres, inputCents);
  const convertedFromCents = convertCentsToAcres(inputTotalCents);

  // Date Calculation
  const calculatedPlantingDate = calculatePlantingDate(calcSeedDate, calcInterval);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Standard Calc Handlers
  const handleDigit = (digit: string) => {
    if (stdWaitingForOperand) {
      setStdDisplay(digit);
      setStdWaitingForOperand(false);
    } else {
      setStdDisplay(stdDisplay === '0' ? digit : stdDisplay + digit);
    }
  };

  const handleDecimal = () => {
    if (stdWaitingForOperand) {
      setStdDisplay('0.');
      setStdWaitingForOperand(false);
      return;
    }
    if (!stdDisplay.includes('.')) {
      setStdDisplay(stdDisplay + '.');
    }
  };

  const handleOperator = (nextOp: string) => {
    const inputValue = parseFloat(stdDisplay);
    if (stdPrevValue === null) {
      setStdPrevValue(inputValue);
    } else if (stdOperator) {
      const current = stdPrevValue || 0;
      let result = current;
      if (stdOperator === '+') result = current + inputValue;
      if (stdOperator === '-') result = current - inputValue;
      if (stdOperator === '×') result = current * inputValue;
      if (stdOperator === '÷') result = inputValue !== 0 ? current / inputValue : 0;
      setStdPrevValue(result);
      setStdDisplay(String(result));
    }
    setStdWaitingForOperand(true);
    setStdOperator(nextOp);
  };

  const handleEqual = () => {
    const inputValue = parseFloat(stdDisplay);
    if (stdOperator && stdPrevValue !== null) {
      const current = stdPrevValue;
      let result = current;
      if (stdOperator === '+') result = current + inputValue;
      if (stdOperator === '-') result = current - inputValue;
      if (stdOperator === '×') result = current * inputValue;
      if (stdOperator === '÷') result = inputValue !== 0 ? current / inputValue : 0;
      setStdDisplay(String(result));
      setStdPrevValue(null);
      setStdOperator(null);
      setStdWaitingForOperand(true);
    }
  };

  const handleClearStd = () => {
    setStdDisplay('0');
    setStdPrevValue(null);
    setStdOperator(null);
    setStdWaitingForOperand(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-stone-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalcIcon className="w-5 h-5 text-amber-300" />
            <h3 className="text-base font-bold">Agricultural Machinery Calculator</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 p-1.5 bg-stone-100 border-b border-stone-200 gap-1 text-xs font-bold">
          <button
            onClick={() => setCalcTab('machinery')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              calcTab === 'machinery' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => setCalcTab('land')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              calcTab === 'land' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'
            }`}
          >
            Land Area
          </button>
          <button
            onClick={() => setCalcTab('dates')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              calcTab === 'dates' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'
            }`}
          >
            Dates
          </button>
          <button
            onClick={() => setCalcTab('standard')}
            className={`py-2 px-1 rounded-lg text-center transition ${
              calcTab === 'standard' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600'
            }`}
          >
            Math Calc
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: MACHINERY PRICING */}
          {calcTab === 'machinery' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Acres</label>
                    <input
                      type="number"
                      min="0"
                      value={calcAcres}
                      onChange={e => setCalcAcres(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Cents</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={calcCents}
                      onChange={e => setCalcCents(Math.min(99, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                      className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={calcDiscount}
                      onChange={e => setCalcDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={calcAdvance}
                      onChange={e => setCalcAdvance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Side-by-side Machine comparison cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Small Machine */}
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">Small Machine</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      ₹45/Cent (₹4,500/Ac)
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-800 bg-emerald-100/60 p-1.5 rounded">
                    {calcAcres * 100 + calcCents} Cts × ₹45 = ₹{((calcAcres * 100 + calcCents) * 45).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-stone-600">Base: {formatCurrency(smallBase)}</div>
                  <div className="text-sm font-bold text-stone-900">Total: {formatCurrency(smallTotal)}</div>
                  <div className="text-base font-black text-emerald-900 pt-1 border-t border-emerald-200">
                    Bal: {formatCurrency(smallBalance)}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`Small Machine (${calcAcres * 100 + calcCents} cents @ ₹45): Total ${formatCurrency(smallTotal)}, Bal ${formatCurrency(smallBalance)}`, 'small')}
                    className="w-full mt-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-900 flex items-center justify-center gap-1"
                  >
                    {copiedText === 'small' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'small' ? 'Copied' : 'Copy Quote'}</span>
                  </button>
                </div>

                {/* Large Machine */}
                <div className="p-3.5 bg-stone-900 text-white rounded-2xl border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Large Machine</span>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-400 px-1.5 py-0.5 rounded">
                      ₹40/Cent (₹4,000/Ac)
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-amber-300 bg-stone-800 p-1.5 rounded">
                    {calcAcres * 100 + calcCents} Cts × ₹40 = ₹{((calcAcres * 100 + calcCents) * 40).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-stone-400">Base: {formatCurrency(largeBase)}</div>
                  <div className="text-sm font-bold text-white">Total: {formatCurrency(largeTotal)}</div>
                  <div className="text-base font-black text-amber-400 pt-1 border-t border-stone-800">
                    Bal: {formatCurrency(largeBalance)}
                  </div>
                  <button
                    onClick={() => copyToClipboard(`Large Machine (${calcAcres * 100 + calcCents} cents @ ₹40): Total ${formatCurrency(largeTotal)}, Bal ${formatCurrency(largeBalance)}`, 'large')}
                    className="w-full mt-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-[11px] font-bold text-stone-200 flex items-center justify-center gap-1"
                  >
                    {copiedText === 'large' ? <Check className="w-3 h-3 text-amber-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === 'large' ? 'Copied' : 'Copy Quote'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAND CONVERTER */}
          {calcTab === 'land' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Acres & Cents → Total Cents & Decimals
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1">Acres</label>
                    <input
                      type="number"
                      min="0"
                      value={inputAcres}
                      onChange={e => setInputAcres(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2 text-sm font-bold rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1">Cents</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={inputCents}
                      onChange={e => setInputCents(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2 text-sm font-bold rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 flex justify-between text-xs">
                  <div>Total Cents: <strong className="text-emerald-800 text-sm">{calculatedTotalCents} Cts</strong></div>
                  <div>Decimal Acres: <strong className="text-emerald-800 text-sm">{calculatedTotalAcres} Ac</strong></div>
                </div>
              </div>

              {/* Reverse conversion: Cents to Acres */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Total Cents → Acres + Cents
                </h4>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Enter Total Cents</label>
                  <input
                    type="number"
                    min="0"
                    value={inputTotalCents}
                    onChange={e => setInputTotalCents(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 text-sm font-bold rounded-lg border border-stone-300 bg-white"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs">
                  Result: <strong className="text-emerald-800 text-sm">{convertedFromCents.acres} Acres and {convertedFromCents.cents} Cents</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATES CALCULATOR */}
          {calcTab === 'dates' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Seeding Date to Expected Planting Date
                </h4>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Seeding Date</label>
                  <input
                    type="date"
                    value={calcSeedDate}
                    onChange={e => setCalcSeedDate(e.target.value)}
                    className="w-full p-2 text-sm font-mono rounded-lg border border-stone-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Planting Interval (Days)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([22, 23, 24, 25] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setCalcInterval(d)}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          calcInterval === d
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white border border-stone-300 text-stone-700'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-800 text-white rounded-xl text-center">
                  <div className="text-[11px] text-emerald-200 uppercase font-medium">Expected Planting Date</div>
                  <div className="text-xl font-bold font-mono mt-1 text-amber-300">
                    {formatDateDisplay(calculatedPlantingDate)}
                  </div>
                  <div className="text-xs text-emerald-100 mt-1">
                    ({calcInterval} days after {formatDateDisplay(calcSeedDate)})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STANDARD MATH CALCULATOR */}
          {calcTab === 'standard' && (
            <div className="space-y-3 max-w-xs mx-auto">
              <div className="bg-stone-900 text-white p-3.5 rounded-2xl text-right font-mono text-2xl font-bold tracking-wider overflow-x-auto min-h-[52px] flex items-center justify-end">
                {stdDisplay}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleClearStd}
                  className="p-3 rounded-xl bg-stone-200 text-stone-800 font-bold text-sm hover:bg-stone-300"
                >
                  AC
                </button>
                <button
                  onClick={() => setStdDisplay(String(parseFloat(stdDisplay) * -1))}
                  className="p-3 rounded-xl bg-stone-200 text-stone-800 font-bold text-sm hover:bg-stone-300"
                >
                  ±
                </button>
                <button
                  onClick={() => setStdDisplay(String(parseFloat(stdDisplay) / 100))}
                  className="p-3 rounded-xl bg-stone-200 text-stone-800 font-bold text-sm hover:bg-stone-300"
                >
                  %
                </button>
                <button
                  onClick={() => handleOperator('÷')}
                  className="p-3 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-600"
                >
                  ÷
                </button>

                {['7', '8', '9'].map(d => (
                  <button
                    key={d}
                    onClick={() => handleDigit(d)}
                    className="p-3 rounded-xl bg-stone-100 text-stone-900 font-bold text-base hover:bg-stone-200"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => handleOperator('×')}
                  className="p-3 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-600"
                >
                  ×
                </button>

                {['4', '5', '6'].map(d => (
                  <button
                    key={d}
                    onClick={() => handleDigit(d)}
                    className="p-3 rounded-xl bg-stone-100 text-stone-900 font-bold text-base hover:bg-stone-200"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => handleOperator('-')}
                  className="p-3 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-600"
                >
                  -
                </button>

                {['1', '2', '3'].map(d => (
                  <button
                    key={d}
                    onClick={() => handleDigit(d)}
                    className="p-3 rounded-xl bg-stone-100 text-stone-900 font-bold text-base hover:bg-stone-200"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => handleOperator('+')}
                  className="p-3 rounded-xl bg-amber-500 text-white font-bold text-lg hover:bg-amber-600"
                >
                  +
                </button>

                <button
                  onClick={() => handleDigit('0')}
                  className="col-span-2 p-3 rounded-xl bg-stone-100 text-stone-900 font-bold text-base hover:bg-stone-200 text-left pl-5"
                >
                  0
                </button>
                <button
                  onClick={handleDecimal}
                  className="p-3 rounded-xl bg-stone-100 text-stone-900 font-bold text-base hover:bg-stone-200"
                >
                  .
                </button>
                <button
                  onClick={handleEqual}
                  className="p-3 rounded-xl bg-emerald-700 text-white font-bold text-lg hover:bg-emerald-800"
                >
                  =
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
