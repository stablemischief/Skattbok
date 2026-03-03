"use client";

import { useRef, useState } from "react";

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const isSwiping = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    isSwiping.current = true;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping.current) return;
    const diff = startX.current - e.touches[0].clientX;
    // Only allow swiping left (positive diff)
    if (diff > 0) {
      setOffset(Math.min(diff, 100));
    } else {
      setOffset(0);
    }
  }

  function handleTouchEnd() {
    isSwiping.current = false;
    if (offset > 60) {
      setOffset(100);
    } else {
      setOffset(0);
    }
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 flex w-[100px] items-center justify-center bg-norse-danger">
        <button onClick={onDelete} className="font-semibold text-white">
          Delete
        </button>
      </div>

      {/* Content */}
      <div
        className="relative bg-norse-card transition-transform"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
