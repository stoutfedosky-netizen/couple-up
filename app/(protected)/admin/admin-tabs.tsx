"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Islander, Week, BonusQuestion, DailyBonusQuestion } from "@/types/database";
import { ManageIslanders } from "./manage-islanders";
import { ManageWeeks } from "./manage-weeks";
import { ManageBonusQuestions } from "./manage-bonus-questions";
import { ManageDailyBonus } from "./manage-daily-bonus";

const tabs = [
  { key: "islanders", label: "Islanders" },
  { key: "weeks", label: "Weeks" },
  { key: "bonus", label: "Bonus Qs" },
  { key: "daily", label: "Daily Qs" },
];

export function AdminTabs({
  activeTab,
  islanders,
  activeIslanders,
  weeks,
  bonusQuestions,
  dailyBonusQuestions,
  resolveWeekId,
  resolveWeekBonusQuestions,
}: {
  activeTab: string;
  islanders: Islander[];
  activeIslanders: Islander[];
  weeks: Week[];
  bonusQuestions: (BonusQuestion & { week_number?: number })[];
  dailyBonusQuestions: (DailyBonusQuestion & { week_number?: number })[];
  resolveWeekId: number | null;
  resolveWeekBonusQuestions: BonusQuestion[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    params.delete("resolve");
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-gray-900 p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-rose-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "islanders" && (
        <ManageIslanders islanders={islanders} />
      )}
      {activeTab === "weeks" && (
        <ManageWeeks
          weeks={weeks}
          activeIslanders={activeIslanders}
          resolveWeekId={resolveWeekId}
          resolveWeekBonusQuestions={resolveWeekBonusQuestions}
        />
      )}
      {activeTab === "bonus" && (
        <ManageBonusQuestions
          bonusQuestions={bonusQuestions}
          weeks={weeks}
        />
      )}
      {activeTab === "daily" && (
        <ManageDailyBonus
          questions={dailyBonusQuestions}
          weeks={weeks}
        />
      )}
    </div>
  );
}
