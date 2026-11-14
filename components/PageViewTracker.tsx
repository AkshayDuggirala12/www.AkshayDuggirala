"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "../lib/api";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `portfolio-view:${today}:${pathname}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");
    void api.post("/analytics/view", { page_path: pathname }).catch((error: unknown) => {
      sessionStorage.removeItem(key);
      console.error("Unable to record aggregate page view:", error);
    });
  }, [pathname]);

  return null;
}
