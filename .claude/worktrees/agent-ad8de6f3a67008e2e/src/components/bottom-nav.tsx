"use client";

import { Button } from "@/components/ui/button";

interface BottomNavProps {
  onAddClick: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 p-4 pb-6 pointer-events-none z-50">
      <div className="flex justify-center">
        <Button
          onClick={onAddClick}
          className="pointer-events-auto w-16 h-16 rounded-full gradient-btn border-0 shadow-2xl pulse-ring relative"
          size="icon"
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
