"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState, type TouchEvent } from "react";

const REFRESH_THRESHOLD = 72;
const MAX_PULL = 108;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startYRef = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (refreshing || event.touches.length !== 1 || window.scrollY > 0) return;
    if ((event.target as HTMLElement).closest("dialog")) return;
    startYRef.current = event.touches[0].clientY;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (startYRef.current === null || event.touches.length !== 1 || window.scrollY > 0) return;
    const distance = event.touches[0].clientY - startYRef.current;
    if (distance <= 0) {
      setPull(0);
      return;
    }
    event.preventDefault();
    setPull(Math.min(MAX_PULL, distance * .55));
  }

  function handleTouchEnd() {
    startYRef.current = null;
    if (pull < REFRESH_THRESHOLD) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(54);
    startTransition(() => {
      router.refresh();
      window.setTimeout(() => {
        setRefreshing(false);
        setPull(0);
      }, 650);
    });
  }

  return <div className="pull-refresh" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
    <div className={`pull-refresh-indicator${pull > 0 ? " active" : ""}${refreshing ? " refreshing" : ""}`} style={{ transform: `translate(-50%, ${pull - 48}px)` }} aria-hidden={pull === 0}>
      <RefreshCw size={19} />
      <span>{refreshing ? "Refreshing…" : pull >= REFRESH_THRESHOLD ? "Release to refresh" : "Pull to refresh"}</span>
    </div>
    <div className="pull-refresh-content" style={{ transform: `translateY(${pull}px)` }}>{children}</div>
  </div>;
}
