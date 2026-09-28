import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';

interface FetchResult {
  rows: any[];
  pagination: { page: number; totalPages: number; total: number };
}

interface SearchableDropdownProps {
  // Single-select (default mode) — ignored when `multiple` is true.
  value?: string;
  onChange?: (value: string) => void;
  // Multi-select — set `multiple` and use `values`/`onChangeValues` instead of `value`/`onChange`.
  multiple?: boolean;
  values?: string[];
  onChangeValues?: (values: string[]) => void;
  fetchFn: (params: { search: string; page: number; limit: number }) => Promise<FetchResult>;
  getOptionValue: (item: any) => string;
  getOptionLabel: (item: any) => string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableDropdown({
  value = '',
  onChange,
  multiple = false,
  values,
  onChangeValues,
  fetchFn,
  getOptionValue,
  getOptionLabel,
  placeholder = 'Search...',
  disabled = false,
  className = '',
}: SearchableDropdownProps) {
  const selectedValues = values || [];
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  // Multi-select: label cache keyed by id, so the trigger can show the single selected item's
  // name (not just "1 selected") without waiting on the options list to happen to include it.
  const [selectedLabelsMap, setSelectedLabelsMap] = useState<Record<string, string>>({});
  const [highlightIdx, setHighlightIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async (searchTerm: string, pageNum: number, append = false) => {
    setLoading(true);
    try {
      const result = await fetchFn({ search: searchTerm, page: pageNum, limit: 20 });
      if (append) {
        setItems((prev) => [...prev, ...result.rows]);
      } else {
        setItems(result.rows);
      }
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  // Load initial items when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setItems([]);
      setPage(1);
      setHighlightIdx(-1);
      fetchItems('', 1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, fetchItems]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setItems([]);
      setPage(1);
      fetchItems(search, 1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Resolve selected label (single-select mode)
  useEffect(() => {
    if (multiple) return;
    if (!value) {
      setSelectedLabel('');
      return;
    }
    // Check if value is in current items
    const found = items.find((item) => getOptionValue(item) === value);
    if (found) {
      setSelectedLabel(getOptionLabel(found));
    } else if (!selectedLabel) {
      // Fetch the specific item
      fetchFn({ search: '', page: 1, limit: 100 }).then((result) => {
        const match = result.rows.find((item: any) => getOptionValue(item) === value);
        if (match) setSelectedLabel(getOptionLabel(match));
      }).catch(() => {});
    }
  }, [value, items, multiple]);

  // Resolve selected labels (multi-select mode) — fetch labels for any selected ids we haven't seen yet
  useEffect(() => {
    if (!multiple) return;
    const unresolved = selectedValues.filter((v) => !selectedLabelsMap[v]);
    if (unresolved.length === 0) return;

    const fromItems: Record<string, string> = {};
    const stillUnresolved: string[] = [];
    unresolved.forEach((v) => {
      const found = items.find((item) => getOptionValue(item) === v);
      if (found) fromItems[v] = getOptionLabel(found);
      else stillUnresolved.push(v);
    });
    if (Object.keys(fromItems).length > 0) {
      setSelectedLabelsMap((prev) => ({ ...prev, ...fromItems }));
    }
    if (stillUnresolved.length > 0) {
      fetchFn({ search: '', page: 1, limit: 100 }).then((result) => {
        const found: Record<string, string> = {};
        stillUnresolved.forEach((v) => {
          const match = result.rows.find((item: any) => getOptionValue(item) === v);
          if (match) found[v] = getOptionLabel(match);
        });
        if (Object.keys(found).length > 0) setSelectedLabelsMap((prev) => ({ ...prev, ...found }));
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValues.join(','), items, multiple]);

  // Scroll pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && !loading && page < totalPages) {
      fetchItems(search, page + 1, true);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0 && highlightIdx < items.length) {
      e.preventDefault();
      handleSelect(items[highlightIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIdx]) {
        (items[highlightIdx] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIdx]);

  const handleSelect = (item: any) => {
    const val = getOptionValue(item);
    if (multiple) {
      const next = selectedValues.includes(val)
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val];
      onChangeValues?.(next);
      setSelectedLabelsMap((prev) => ({ ...prev, [val]: getOptionLabel(item) }));
      // Stay open — multi-select is meant for picking several in one go.
      return;
    }
    onChange?.(val);
    setSelectedLabel(getOptionLabel(item));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onChangeValues?.([]);
      return;
    }
    onChange?.('');
    setSelectedLabel('');
  };

  // Auto-position: open upward if not enough space below
  const [openUpward, setOpenUpward] = useState(false);
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 340 && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  const hasSelection = multiple ? selectedValues.length > 0 : !!value;
  const displayLabel = multiple
    ? selectedValues.length === 0
      ? ''
      : selectedValues.length === 1
      ? selectedLabelsMap[selectedValues[0]] || ''
      : `${selectedValues.length} selected`
    : selectedLabel;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-left px-3 pr-8 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:border-brand-400/50"
      >
        <span className={`flex-1 truncate ${displayLabel ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          {displayLabel || placeholder}
        </span>
        {hasSelection && (
          <X
            className="w-3.5 h-3.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer absolute right-8 top-1/2 -translate-y-1/2"
            onClick={handleClear}
          />
        )}
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={`absolute z-50 ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 w-full min-w-[240px] bg-[var(--card-bg)] border border-[var(--border-secondary)] rounded-xl shadow-xl overflow-hidden`}
          style={{ maxHeight: 320 }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-[var(--border-secondary)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          {/* Options list */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ maxHeight: 240 }}
          >
            {items.length === 0 && !loading ? (
              <div className="px-3 py-6 text-center text-sm text-[var(--text-tertiary)]">
                No results found
              </div>
            ) : (
              items.map((item, idx) => {
                const val = getOptionValue(item);
                const label = getOptionLabel(item);
                const isSelected = multiple ? selectedValues.includes(val) : val === value;
                const isHighlighted = idx === highlightIdx;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                      isSelected
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                        : isHighlighted
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {multiple && (
                      <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                        isSelected ? 'bg-brand-500 border-brand-500' : 'border-[var(--input-border)]'
                      }`}>
                        {isSelected && <span className="text-white text-[10px] leading-none">✓</span>}
                      </span>
                    )}
                    <span className="truncate">{label}</span>
                    {!multiple && isSelected && <span className="ml-auto text-brand-500">✓</span>}
                  </button>
                );
              })
            )}

            {loading && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                <span className="ml-2 text-xs text-[var(--text-tertiary)]">Loading...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
