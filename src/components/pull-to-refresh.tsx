"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 128; // px to pull to trigger refresh
  const maxPull = 200; // max px to pull visual limit

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        setStartY(e.touches[0].clientY);
        setPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling || isRefreshing) return;
      
      const y = e.touches[0].clientY;
      const delta = y - startY;

      // Only allow pulling down if we started at top and are moving down
      if (delta > 0 && window.scrollY === 0) {
        // Add resistance/damping
        const dampenedDelta = Math.min(delta * 0.5, maxPull);
        
        // Prevent default only if we are effectively pulling (scrolling up/refresh gesture)
        // This prevents the native browser refresh or scroll bouncing in some cases
        if (dampenedDelta > 10) {
           e.preventDefault(); 
        }
        
        setCurrentY(dampenedDelta);
      } else {
        setPulling(false); // Stop pulling if we scroll down
        setCurrentY(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling || isRefreshing) return;
      
      setPulling(false);
      
      if (currentY > threshold) {
        setIsRefreshing(true);
        setCurrentY(64); // Snap to loading position
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setCurrentY(0);
        }
      } else {
        setCurrentY(0); // Snap back to 0
      }
    };

    // Passive false needed to use preventDefault
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, isRefreshing, startY, currentY, onRefresh]);

  return (
    <div ref={containerRef} className="min-h-screen relative">
      {/* Refresh Indicator */}
      <div 
        className={cn(
          "fixed left-0 right-0 flex justify-center items-center z-50 pointer-events-none transition-transform duration-200 ease-out",
          isRefreshing ? "translate-y-4" : ""
        )}
        style={{ 
          top: 0, 
          transform: isRefreshing 
            ? `translateY(16px)` // approximate header height or spacing
            : `translateY(${currentY - 40}px)` 
        }}
      >
        <div className="bg-background border shadow-md rounded-full p-2">
          <Loader2 
            className={cn(
              "h-6 w-6 text-primary",
              isRefreshing ? "animate-spin" : "transform",
            )} 
            style={{
              transform: !isRefreshing ? `rotate(${currentY * 2}deg)` : undefined
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${currentY}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
