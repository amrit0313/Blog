// components/ui/search-box.tsx
"use client";

import { useEffect, useState } from "react";
import { HiMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { useDebounce } from "../../app/hooks/useDebounce";

interface SearchBoxProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export default function SearchBox({
  initialValue = "",
  onSearch,
  placeholder = "Search...",
  delay = 1000,
  className = "",
}: SearchBoxProps) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);


  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (debouncedValue === initialValue) return;
    onSearch(debouncedValue.trim());
  }, [debouncedValue]);

  return (
    <div className={`relative w-full sm:w-64 ${className}`}>
      <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-card py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
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