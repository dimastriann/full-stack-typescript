import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  alwaysDark?: boolean;
  error?: boolean;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  alwaysDark = false,
  error = false,
}: SelectProps) {
  const selected = options.find((opt) => opt.id === value);

  const baseStyles = alwaysDark
    ? `bg-slate-900 ${error ? 'border-red-500' : 'border-slate-800'} text-white`
    : `bg-white dark:bg-slate-900 ${error ? 'border-red-500' : 'border-surface-200 dark:border-slate-800'} text-gray-900 dark:text-gray-100`;

  const menuStyles = alwaysDark
    ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50'
    : 'bg-white dark:bg-slate-900 border-surface-200 dark:border-slate-800 shadow-xl';

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton
            className={`
              relative w-full cursor-pointer rounded-xl border py-2.5 pl-4 pr-10 text-left text-sm font-medium
              transition-all duration-200 focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/20' : 'focus:ring-primary-500/20'}
              ${baseStyles}
            `}
          >
            <span className="block truncate">
              {selected ? (
                selected.label
              ) : (
                <span className="text-gray-400 dark:text-gray-500">
                  {placeholder}
                </span>
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${alwaysDark ? 'text-slate-500' : 'text-gray-400'}`}
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <ListboxOptions
            anchor="bottom start"
            transition
            className={`
              z-[60] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-xl border py-1.5 text-sm shadow-xl focus:outline-none
              transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 data-[leave]:opacity-100
              ${menuStyles}
            `}
          >
            {options.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 italic">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <ListboxOption
                  key={option.id}
                  value={option.id}
                  className={({ active }) => `
                    relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-all
                    ${
                      active
                        ? alwaysDark
                          ? 'bg-slate-800 text-white'
                          : 'bg-surface-50 dark:bg-slate-800/50 text-primary-600 dark:text-primary-400'
                        : alwaysDark
                          ? 'text-slate-300'
                          : 'text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span
                        className={`block truncate ${isSelected ? 'font-bold' : 'font-medium'}`}
                      >
                        {option.label}
                      </span>
                      {isSelected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))
            )}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}
