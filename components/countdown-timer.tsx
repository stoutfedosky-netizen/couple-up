"use client";

import { useState, useEffect } from "react";

function getTimeRemaining(deadline: string) {
  const total = new Date(deadline).getTime() - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer({
  deadline,
  compact = false,
  onExpired,
}: {
  deadline: string;
  compact?: boolean;
  onExpired?: () => void;
}) {
  const [time, setTime] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeRemaining(deadline);
      setTime(t);
      if (t.total <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  if (time.total <= 0) {
    return (
      <span className="text-red-500 font-semibold text-sm">
        Locked
      </span>
    );
  }

  if (compact) {
    return (
      <span className="font-mono text-sm font-semibold tabular-nums">
        {time.days > 0 && `${time.days}d `}
        {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {time.days > 0 && (
        <TimeBlock value={time.days} label="days" />
      )}
      <TimeBlock value={time.hours} label="hrs" />
      <span className="text-rose-300 font-bold text-lg">:</span>
      <TimeBlock value={time.minutes} label="min" />
      <span className="text-rose-300 font-bold text-lg">:</span>
      <TimeBlock value={time.seconds} label="sec" />
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="rounded-lg bg-white/20 px-2.5 py-1 font-mono text-xl font-bold tabular-nums text-white">
        {pad(value)}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-white/60 mt-0.5">
        {label}
      </span>
    </div>
  );
}
