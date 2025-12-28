"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ClientSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function ClientSearch({ onSearch, placeholder = "ابحث بالاسم..." }: ClientSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
        <svg
          className="w-5 h-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <Input
        type="search"
        className="w-full ps-12 pe-4 py-6 text-lg glass border-0 rounded-2xl focus:ring-2 focus:ring-primary/50 transition-all"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
}
