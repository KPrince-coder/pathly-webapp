import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: SelectOption;
  onChange: (value: SelectOption) => void;
  options: SelectOption[];
  label?: string;
  error?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  error,
  className,
}: SelectProps) {
  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="relative">
          {label && (
            <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </Listbox.Label>
          )}
          <div className="relative">
            <Listbox.Button
              className={cn(
                'relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                className
              )}
            >
              <span className="block truncate">{value.label}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <FiChevronDown
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    className={({ active }) =>
                      cn(
                        'relative cursor-default select-none py-2 pl-3 pr-9',
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      )
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={cn(
                            'block truncate',
                            selected ? 'font-semibold' : 'font-normal'
                          )}
                        >
                          {option.label}
                        </span>

                        {selected ? (
                          <span
                            className={cn(
                              'absolute inset-y-0 right-0 flex items-center pr-4',
                              active ? 'text-white' : 'text-blue-600'
                            )}
                          >
                            <FiCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </div>
      )}
    </Listbox>
  );
}
