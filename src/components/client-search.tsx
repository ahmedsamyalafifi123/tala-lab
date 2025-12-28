"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        className="w-full ps-10 h-12 text-lg"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
}
