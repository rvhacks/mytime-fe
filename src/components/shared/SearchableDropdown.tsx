import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';

interface FetchResult {
  rows: any[];
  pagination: { page: number; totalPages: number; total: number };
}

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  fetchFn: (params: { search: string; page: number; limit: number }) => Promise<FetchResult>;
  getOptionValue: (item: any) => string;
  getOptionLabel: (item: any) => string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableDropdown({
  value,
  onChange,
  fetchFn,
  getOptionValue,
  getOptionLabel,
  placeholder = 'Search...',
  disabled = false,
  className = '',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setItems([]);
      setPage(1);
      fetchItems(search, 1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
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

  // Resolve selected label
  useEffect(() => {
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
  }, [value, items]);

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
      const item = items[highlightIdx];
      onChange(getOptionValue(item));
      setSelectedLabel(getOptionLabel(item));
      setIsOpen(false);
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
    onChange(getOptionValue(item));
    setSelectedLabel(getOptionLabel(item));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-left px-3 pr-8 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:border-brand-400/50"
      >
        <span className={`flex-1 truncate ${selectedLabel ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          {selectedLabel || placeholder}
        </span>
        {value && (
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
                const isSelected = val === value;
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
                    <span className="truncate">{label}</span>
                    {isSelected && <span className="ml-auto text-brand-500">✓</span>}
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
