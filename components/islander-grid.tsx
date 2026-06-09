"use client";

import { useState } from "react";
import type { Islander } from "@/types/database";
import { IslanderCard } from "./islander-card";

type Filter = "all" | "active" | "dumped";

export function IslanderGrid({ islanders }: { islanders: Islander[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = islanders.filter((i) => {
    if (filter === "all") return true;
    if (filter === "active") return i.status === "active" || i.status === "bombshell";
    return i.status === "dumped";
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "dumped", label: "Dumped" },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === tab.key
                ? "bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-md"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No islanders match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((islander) => (
            <IslanderCard key={islander.id} islander={islander} />
          ))}
        </div>
      )}
    </div>
  );
}
