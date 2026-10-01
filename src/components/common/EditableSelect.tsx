import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, X, ListFilter, Trash2, RotateCcw } from 'lucide-react';

export interface OptionItem {
  value: string;
  label?: string;
  isCustom?: boolean;
}

export interface EditableSelectProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: (string | OptionItem)[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  displayLabel?: string;
  allowManageOptions?: boolean;
  storageKey?: string;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید یا بنویسید...',
  className = '',
  required = false,
  disabled = false,
  displayLabel,
  allowManageOptions = true,
  storageKey
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [typedText, setTypedText] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Deterministic storage key for persisting added and deleted options
  const persistentKey = `shoukoh_sel_v2_${storageKey || id || placeholder.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}`;

  // Custom added items & deleted items state
  const [customItems, setCustomItems] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !allowManageOptions) return [];
    try {
      const saved = localStorage.getItem(`${persistentKey}_custom`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedValues, setDeletedValues] = useState<string[]>(() => {
    if (typeof window === 'undefined' || !allowManageOptions) return [];
    try {
      const saved = localStorage.getItem(`${persistentKey}_deleted`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Base normalized options
  const baseNormalized: OptionItem[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Combine with custom added items
  const customNormalized: OptionItem[] = customItems
    .filter(ci => !baseNormalized.some(b => b.value === ci || b.label === ci))
    .map(ci => ({ value: ci, label: ci, isCustom: true }));

  // Filter out deleted values
  const activeOptions: OptionItem[] = [...baseNormalized, ...customNormalized].filter(
    opt => !deletedValues.includes(opt.value) && (!opt.label || !deletedValues.includes(opt.label))
  );

  // Find if current value matches an option
  const matchedOption = activeOptions.find(
    opt => opt.value === value || opt.label === value
  );

  // Display text in input box
  const displayValue = typedText !== null
    ? typedText
    : (displayLabel || matchedOption?.label || value || '');

  // Synchronize typedText when value changes from outside
  useEffect(() => {
    if (typedText !== null && value !== typedText) {
      if (matchedOption && matchedOption.label !== typedText) {
        setTypedText(matchedOption.label || matchedOption.value);
      }
    }
  }, [value, matchedOption]);

  // Query for filtering
  const query = typedText !== null ? typedText.trim().toLowerCase() : '';

  const matchingOptions = query
    ? activeOptions.filter(opt =>
        (opt.label || '').toLowerCase().includes(query) ||
        (opt.value || '').toLowerCase().includes(query)
      )
    : activeOptions;

  const otherOptions = query
    ? activeOptions.filter(opt =>
        !(opt.label || '').toLowerCase().includes(query) &&
        !(opt.value || '').toLowerCase().includes(query)
      )
    : [];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (typedText !== null && matchedOption) {
          setTypedText(matchedOption.label || matchedOption.value);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [typedText, matchedOption]);

  const handleSelect = (opt: OptionItem) => {
    const chosenText = opt.label || opt.value;
    onChange(opt.value);
    setTypedText(chosenText);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setTypedText(text);

    const exact = activeOptions.find(
      opt => (opt.label || '').toLowerCase() === text.toLowerCase() ||
             (opt.value || '').toLowerCase() === text.toLowerCase()
    );
    if (exact) {
      onChange(exact.value);
    } else {
      onChange(text);
    }
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOpen(prev => !prev);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setTypedText('');
    setIsOpen(true);
  };

  // Add custom typed value to dropdown options
  const handleAddCustomOption = (newVal: string) => {
    const trimmed = newVal.trim();
    if (!trimmed) return;

    // Un-delete if it was previously marked deleted
    const updatedDeleted = deletedValues.filter(v => v !== trimmed);
    setDeletedValues(updatedDeleted);
    try {
      localStorage.setItem(`${persistentKey}_deleted`, JSON.stringify(updatedDeleted));
    } catch {}

    // Add to custom items if not already present in base
    if (!customItems.includes(trimmed)) {
      const updatedCustom = [...customItems, trimmed];
      setCustomItems(updatedCustom);
      try {
        localStorage.setItem(`${persistentKey}_custom`, JSON.stringify(updatedCustom));
      } catch {}
    }

    onChange(trimmed);
    setTypedText(trimmed);
  };

  // Delete an option from dropdown options (clean & compact, not in the way)
  const handleDeleteOption = (valToDelete: string) => {
    // Remove from custom items if there
    const updatedCustom = customItems.filter(v => v !== valToDelete);
    setCustomItems(updatedCustom);
    try {
      localStorage.setItem(`${persistentKey}_custom`, JSON.stringify(updatedCustom));
    } catch {}

    // Add to deleted values list to hide base option
    if (!deletedValues.includes(valToDelete)) {
      const updatedDeleted = [...deletedValues, valToDelete];
      setDeletedValues(updatedDeleted);
      try {
        localStorage.setItem(`${persistentKey}_deleted`, JSON.stringify(updatedDeleted));
      } catch {}
    }

    // If active value matches deleted one, clear it
    if (value === valToDelete || displayValue === valToDelete) {
      onChange('');
      setTypedText('');
    }
  };

  // Reset/restore all options back to defaults
  const handleResetToDefaults = () => {
    setCustomItems([]);
    setDeletedValues([]);
    try {
      localStorage.removeItem(`${persistentKey}_custom`);
      localStorage.removeItem(`${persistentKey}_deleted`);
    } catch {}
  };

  // Check if current typed value is already an active option
  const isCurrentValueAnActiveOption = activeOptions.some(
    opt => (opt.value || '').trim().toLowerCase() === (displayValue || '').trim().toLowerCase() ||
           (opt.label || '').trim().toLowerCase() === (displayValue || '').trim().toLowerCase()
  );

  const canAddNewOption = allowManageOptions &&
    displayValue.trim().length > 0 &&
    !isCurrentValueAnActiveOption;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onClick={() => {
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-3 pl-16 outline-none text-slate-800 dark:text-white text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-text"
        />

        <div className="absolute left-2 flex items-center gap-1">
          {displayValue && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              title="پاک کردن متن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={handleChevronClick}
            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
            title="مشاهده تمام گزینه‌ها"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 py-1 text-xs animate-scale-up">
          {/* Top Bar */}
          <div className="sticky top-0 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] z-10">
            <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5 text-blue-500" />
              <span>فهرست گزینه‌ها ({activeOptions.length} مورد)</span>
            </span>

            <div className="flex items-center gap-2">
              {query && (
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    setTypedText('');
                    onChange('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[10px] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded"
                >
                  پاک کردن جستجو
                </button>
              )}
            </div>
          </div>

          {/* Compact "Add Custom Value" Bar: neat, elegant, non-intrusive */}
          {canAddNewOption && (
            <div className="mx-2 my-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0 text-blue-800 dark:text-blue-200">
                <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">افزودن «<strong className="font-bold">{displayValue.trim()}</strong>» به این منو:</span>
              </div>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddCustomOption(displayValue);
                }}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                title="افزودن این مورد برای همیشه به منوی کشویی"
              >
                <span>+ ثبت در گزینه‌ها</span>
              </button>
            </div>
          )}

          {/* Section 1: Matching Options */}
          {matchingOptions.length > 0 && (
            <div className="py-0.5">
              {query && (
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                  گزینه‌های منطبق ({matchingOptions.length})
                </div>
              )}
              {matchingOptions.map((opt, idx) => {
                const isSelected = value === opt.value || value === opt.label || displayValue === opt.label || displayValue === opt.value;
                return (
                  <div
                    key={`match-${opt.value}-${idx}`}
                    className={`group w-full flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/40 ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault();
                        handleSelect(opt);
                      }}
                      className="flex-1 text-right flex items-center justify-between truncate py-0.5"
                    >
                      <span className="truncate">{opt.label || opt.value}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-2" />}
                    </button>

                    {/* Subtle, compact delete icon (hidden until hover over item) */}
                    {allowManageOptions && (
                      <button
                        type="button"
                        tabIndex={-1}
                        title="حذف از این منوی کشویی"
                        onMouseDown={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteOption(opt.value);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 2: Other Options */}
          {otherOptions.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 py-0.5">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <span>سایر گزینه‌ها ({otherOptions.length})</span>
                <span className="text-[9px] text-slate-400 font-normal">کلیک جهت انتخاب</span>
              </div>
              {otherOptions.map((opt, idx) => {
                const isSelected = value === opt.value || value === opt.label || displayValue === opt.label || displayValue === opt.value;
                return (
                  <div
                    key={`other-${opt.value}-${idx}`}
                    className={`group w-full flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/40 ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault();
                        handleSelect(opt);
                      }}
                      className="flex-1 text-right flex items-center justify-between truncate py-0.5"
                    >
                      <span className="truncate">{opt.label || opt.value}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-2" />}
                    </button>

                    {/* Subtle, compact delete icon */}
                    {allowManageOptions && (
                      <button
                        type="button"
                        tabIndex={-1}
                        title="حذف از این منوی کشویی"
                        onMouseDown={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteOption(opt.value);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeOptions.length === 0 && (
            <div className="p-3 text-center text-slate-400 text-xs">
              گزینه‌ای در لیست موجود نیست. می‌توانید متن دلخواه خود را در کادر بالا بنویسید.
            </div>
          )}

          {/* Discreet footer to restore default list if items were modified */}
          {allowManageOptions && (customItems.length > 0 || deletedValues.length > 0) && (
            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  handleResetToDefaults();
                }}
                className="text-[10px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1 mx-auto transition-colors"
                title="بازگرداندن تمام گزینه‌های پیش‌فرض این فیلد"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>بازنشانی گزینه‌های پیش‌فرض</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
