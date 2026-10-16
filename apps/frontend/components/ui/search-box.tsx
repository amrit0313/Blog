"use client";

import { useEffect, useRef, useState } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { useDebounce } from "../../app/hooks/useDebounce"; // keep your existing path

interface SearchBoxProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchBox({
  initialValue = "",
  onSearch,
  placeholder = "Search...",
  delay = 400,
  className = "sm:w-64",
  autoFocus = false,
}: SearchBoxProps) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);
  const initialValueRef = useRef(initialValue);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    initialValueRef.current = initialValue;
    setValue((current) =>
      current.trim() === initialValue ? current : initialValue,
    );
  }, [initialValue]);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    const next = debouncedValue.trim();
    if (next === initialValueRef.current) return;
    onSearchRef.current(next);
  }, [debouncedValue]);

  return (
    <div className={`relative w-full ${className}`}>
      <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-card py-2 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
        >
          <HiXMark className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}