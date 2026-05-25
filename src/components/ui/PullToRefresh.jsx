import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

/**
 * PullToRefresh — wraps scrollable content with a pull-down-to-refresh gesture.
 * Props:
 *   onRefresh  — async () => void  called when user pulls down far enough
 *   children   — React node(s) to render inside the scrollable area
 *   threshold  — px of pull needed to trigger (default 80)
 */
export default function PullToRefresh({ onRefresh, children, threshold = 80 }) {
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const wrapperRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(async (e) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    const atTop = !wrapperRef.current || wrapperRef.current.scrollTop === 0;
    if (delta > threshold && atTop && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  }, [refreshing, onRefresh, threshold]);

  return (
    <div
      ref={wrapperRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {refreshing && (
        <div className="flex justify-center py-1 mb-2">
          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
        </div>
      )}
      {children}
    </div>
  );
}