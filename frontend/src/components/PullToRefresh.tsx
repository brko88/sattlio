import { useState, useRef, type ReactNode, type TouchEvent } from "react";

const PULL_THRESHOLD = 70;
const MAX_PULL = 100;

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

/**
 * Rucni pull-to-refresh (touch gest) - potreban jer se native browser gest
 * gubi kad je app instalirana kao PWA (standalone mod, bez browser chrome-a).
 */
function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (refreshing || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(delta * 0.5, MAX_PULL));
    }
  };

  const handleTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance }}
      >
        <div
          className={`w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full ${
            refreshing ? "animate-spin" : ""
          }`}
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${pullDistance * 3}deg)`, opacity: pullDistance / PULL_THRESHOLD }
          }
        />
      </div>
      {children}
    </div>
  );
}

export default PullToRefresh;
