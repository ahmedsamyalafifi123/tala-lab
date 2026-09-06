"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchableFilterProps {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function SearchableFilter({ id, label, value, onValueChange, options }: SearchableFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const visibleOptions = options.filter((option) => option.label.toLowerCase().includes(query));
  const selectedLabel = value === "all" ? "الكل" : options.find((option) => option.value === value)?.label || "الكل";

  const selectValue = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) setSearch("");
    }}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" aria-label={`${label}: ${selectedLabel}`}
          className="h-10 w-full min-w-0 justify-between gap-2 px-3 font-normal">
          <span className="min-w-0 truncate">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={12} dir="rtl"
        aria-label={label} className="w-[min(320px,calc(100vw-1.5rem))] p-2">
        <div className="relative mb-2">
          <Search className="absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder={`بحث في ${label}...`} aria-label={`بحث في ${label}`} className="h-9 ps-8" />
        </div>
        <div className="max-h-[35vh] overflow-y-auto overscroll-contain space-y-1">
          {[{ value: "all", label: "الكل" }, ...visibleOptions].map((option) => (
            <button key={option.value} type="button" aria-pressed={value === option.value}
              onClick={() => selectValue(option.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-start text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
              <Check aria-hidden="true" className={`h-4 w-4 shrink-0 ${value === option.value ? "opacity-100" : "opacity-0"}`} />
              <span className="min-w-0 break-words">{option.label}</span>
            </button>
          ))}
          {visibleOptions.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">لا توجد خيارات مطابقة</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
