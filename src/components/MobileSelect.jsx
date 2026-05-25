import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ChevronDown, Check } from "lucide-react";

/**
 * Responsive select:
 * - Mobile (≤768px): Bottom Sheet Drawer
 * - Desktop: Radix Select
 *
 * Props:
 *   value        — current selected value (string)
 *   onValueChange — (value: string) => void
 *   options      — [{ value: string, label: string }]
 *   placeholder  — string shown when nothing is selected
 *   emptyOption  — optional { value: "", label: string } prepended to the list
 */
export default function MobileSelect({ value, onValueChange, options, placeholder, emptyOption }) {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const NONE_SENTINEL = "__none__";
  const normalizedEmptyOption = emptyOption ? { ...emptyOption, value: NONE_SENTINEL } : null;
  const allOptions = normalizedEmptyOption ? [normalizedEmptyOption, ...options] : options;
  const radixValue = value === "" ? NONE_SENTINEL : value;
  const resolveValue = (v) => (v === NONE_SENTINEL ? "" : v);
  const selectedLabel = allOptions.find((o) => (o.value === NONE_SENTINEL ? "" : o.value) === value)?.label;

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span className={selectedLabel ? "text-foreground font-body" : "text-muted-foreground font-body"}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="pb-2">
              <DrawerTitle className="font-heading">{placeholder}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-1 max-h-72 overflow-y-auto">
              {allOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onValueChange(opt.value);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl text-sm font-body transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Radix Select
  return (
    <Select value={radixValue} onValueChange={(v) => onValueChange(resolveValue(v))}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}