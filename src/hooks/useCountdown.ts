"use client";

import { useEffect, useState } from "react";

const drawDate = new Date("2026-07-31T20:00:00+05:30").getTime();

export function useCountdown() {
  const [remaining, setRemaining] = useState(drawDate - Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(drawDate - Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const safe = Math.max(remaining, 0);
  const days = Math.floor(safe / 86400000);
  const hours = Math.floor((safe % 86400000) / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);

  return { days, hours, minutes, seconds };
}

