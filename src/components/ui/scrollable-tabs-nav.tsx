"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScrollableTabsNavProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function ScrollableTabsNav({
  children,
  className,
  "aria-label": ariaLabel,
}: ScrollableTabsNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, children]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.6 : el.clientWidth * 0.6,
      behavior: "smooth",
    });
  };

  return (
    <nav
      className={cn("relative mt-4 border-b border-border pb-3", className)}
      aria-label={ariaLabel}
    >
      <div className="relative min-w-0">
        {canScrollLeft ? (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-background to-transparent"
              aria-hidden
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-md border-border bg-background shadow-xs"
              onClick={() => scroll("left")}
              aria-label="Scroll tabs left"
            >
              <ChevronLeft />
            </Button>
          </>
        ) : null}
        {canScrollRight ? (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-background to-transparent"
              aria-hidden
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-md border-border bg-background shadow-xs"
              onClick={() => scroll("right")}
              aria-label="Scroll tabs right"
            >
              <ChevronRight />
            </Button>
          </>
        ) : null}
        <div
          ref={scrollRef}
          className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    </nav>
  );
}
