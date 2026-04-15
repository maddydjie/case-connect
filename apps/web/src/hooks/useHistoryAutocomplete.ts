import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useCaseStore, type DoctorHistory } from '@/stores/case.store';

interface UseHistoryAutocompleteOptions {
  category: keyof DoctorHistory;
  maxSuggestions?: number;
}

export function useHistoryAutocomplete({ category, maxSuggestions = 8 }: UseHistoryAutocompleteOptions) {
  const searchHistory = useCaseStore((s) => s.searchHistory);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const updateSuggestions = useCallback(
    (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const results = searchHistory(category, q).slice(0, maxSuggestions);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    },
    [category, maxSuggestions, searchHistory],
  );

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => updateSuggestions(value), 100);
    },
    [updateSuggestions],
  );

  const handleSelect = useCallback(
    (value: string) => {
      setQuery(value);
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedIndex(-1);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, suggestions, selectedIndex, handleSelect],
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (query.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [query, suggestions]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    showSuggestions,
    selectedIndex,
    handleChange,
    handleSelect,
    handleKeyDown,
    handleBlur,
    handleFocus,
  };
}
