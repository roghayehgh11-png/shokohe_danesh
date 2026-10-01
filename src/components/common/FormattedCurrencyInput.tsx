import React from 'react';
import { formatWithCommas, parseFormattedNumber } from '../../utils/numberUtils';

interface FormattedCurrencyInputProps {
  id?: string;
  value: number | undefined | null;
  onChange: (val: number) => void;
  placeholder?: string;
  unit?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FormattedCurrencyInput: React.FC<FormattedCurrencyInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '۰',
  unit = 'تومان',
  className = '',
  required = false,
  disabled = false
}) => {
  const displayValue = formatWithCommas(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawText = e.target.value;
    const num = parseFormattedNumber(rawText);
    onChange(num);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-3 pl-14 outline-none text-slate-800 dark:text-white text-xs font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-left dir-ltr"
      />
      {unit && (
        <span className="absolute left-3 text-[11px] text-slate-400 dark:text-slate-500 font-semibold pointer-events-none select-none">
          {unit}
        </span>
      )}
    </div>
  );
};
