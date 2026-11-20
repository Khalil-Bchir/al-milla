'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MillaPickerOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
}

interface MillaPickerProps {
  value: string;
  options: MillaPickerOption[];
  onChange: (value: string) => void;
  title: string;
  ariaLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  triggerClassName?: string;
  compact?: boolean;
}

export function MillaPicker({
  value,
  options,
  onChange,
  title,
  ariaLabel,
  searchable = false,
  searchPlaceholder = 'ابحث بالاسم أو الرقم...',
  icon,
  triggerClassName,
  compact = false,
}: MillaPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const hay = `${opt.value} ${opt.label} ${opt.description ?? ''} ${opt.keywords ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-xl border border-border bg-background text-start font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring',
          compact ? 'min-h-[44px] px-3 text-xs' : 'min-h-[48px] px-3.5 text-sm',
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon && <span className="shrink-0 text-primary">{icon}</span>}
          <span className="truncate">{selectedOption?.label ?? ''}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Search */}
            {(searchable || options.length > 8) && (
              <div className="border-b border-border px-4 py-3">
                <div className="relative flex items-center">
                  <Search
                    className="pointer-events-none absolute start-3.5 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    autoFocus
                    className="min-h-[46px] w-full rounded-xl border border-border bg-background pe-3 ps-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
              {filteredOptions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  لا توجد نتائج مطابقة لبحثك.
                </p>
              ) : (
                filteredOptions.map((opt) => {
                  const selected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex min-h-[54px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-start transition-colors',
                        selected
                          ? 'border-primary bg-secondary text-foreground'
                          : 'border-transparent bg-background text-foreground hover:bg-muted/70',
                      )}
                    >
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm', selected ? 'font-bold text-primary' : 'font-semibold')}>
                          {opt.label}
                        </p>
                        {opt.description && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {opt.description}
                          </p>
                        )}
                      </div>
                      {selected && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
