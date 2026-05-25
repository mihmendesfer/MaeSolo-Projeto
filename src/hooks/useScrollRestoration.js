import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Saves and restores window scroll position per route pathname.
 * Call this once inside a layout component that wraps <Outlet />.
 */
export default function useScrollRestoration() {
  const { pathname } = useLocation();
  const positions = useRef({});

  useEffect(() => {
    // Restore saved position for this path
    const saved = positions.current[pathname] ?? 0;
    window.scrollTo({ top: saved, behavior: "instant" });

    return () => {
      // Save current position before navigating away
      positions.current[pathname] = window.scrollY;
    };
  }, [pathname]);
}