"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Islander, SeasonWinnerPrediction } from "@/types/database";
import { saveSeasonWinner } from "@/app/(protected)/bracket/actions";

export function SeasonWinnerPicker({
  islanders,
  existingPick,
  isLocked,
}: {
  islanders: Islander[];
  existingPick: SeasonWinnerPrediction | null;
  isLocked: boolean;
}) {
  const [selected1, setSelected1] = useState<number | null>(
    existingPick?.islander_1_id ?? null
  );
  const [selected2, setSelected2] = useState<number | null>(
    existingPick?.islander_2_id ?? null
  );
  const [picking, setPicking] = useState<1 | 2 | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const getName = (id: number | null) =>
    id ? islanders.find((i) => i.id === id)?.name ?? "" : "";

  async function handleSave() {
    if (!selected1 || !selected2) return;
    setSaving(true);
    try {
      await saveSeasonWinner({
        islander_1_id: selected1,
        islander_2_id: selected2,
      });
      setSaved(true);
      setPicking(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Show existing pick in locked/display mode
  if (isLocked && existingPick) {
    return (
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">&#127942;</span>
          <h2 className="font-bold text-amber-900">Your Season Winners</h2>
          <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Locked
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 py-2">
          <span className="text-lg font-bold text-gray-900">
            {getName(existingPick.islander_1_id)}
          </span>
          <span className="text-amber-500 text-xl">&hearts;</span>
          <span className="text-lg font-bold text-gray-900">
            {getName(existingPick.islander_2_id)}
          </span>
        </div>
      </div>
    );
  }

  // Editable/display mode
  if (existingPick && !picking && !saved) {
    return (
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">&#127942;</span>
          <h2 className="font-bold text-amber-900">Your Season Winners</h2>
        </div>
        <div className="flex items-center justify-center gap-3 py-2">
          <span className="text-lg font-bold text-gray-900">
            {getName(existingPick.islander_1_id)}
          </span>
          <span className="text-amber-500 text-xl">&hearts;</span>
          <span className="text-lg font-bold text-gray-900">
            {getName(existingPick.islander_2_id)}
          </span>
        </div>
        {!isLocked && (
          <button
            onClick={() => setPicking(1)}
            className="mt-3 w-full rounded-lg border border-amber-300 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            Change Pick
          </button>
        )}
      </div>
    );
  }

  // Picker mode
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">&#127942;</span>
        <h2 className="font-bold text-amber-900">Pick Your Winners</h2>
      </div>
      <p className="text-sm text-amber-700 mb-4">
        Which couple will win Love Island Season 8? Locks after Week 4.
      </p>

      {/* Selected display */}
      <div className="flex items-center justify-center gap-3 mb-4 py-3 rounded-lg bg-white/50">
        <button
          onClick={() => setPicking(1)}
          className={`rounded-lg border-2 border-dashed px-4 py-2 text-sm font-semibold transition-all ${
            picking === 1
              ? "border-cyan-400 bg-cyan-50 text-cyan-700"
              : selected1
                ? "border-amber-300 bg-amber-50 text-gray-900"
                : "border-gray-300 text-gray-400 hover:border-amber-400"
          }`}
        >
          {selected1 ? getName(selected1) : "Islander 1"}
        </button>
        <span className="text-amber-500 text-xl">&hearts;</span>
        <button
          onClick={() => setPicking(2)}
          className={`rounded-lg border-2 border-dashed px-4 py-2 text-sm font-semibold transition-all ${
            picking === 2
              ? "border-cyan-400 bg-cyan-50 text-cyan-700"
              : selected2
                ? "border-amber-300 bg-amber-50 text-gray-900"
                : "border-gray-300 text-gray-400 hover:border-amber-400"
          }`}
        >
          {selected2 ? getName(selected2) : "Islander 2"}
        </button>
      </div>

      {/* Islander grid for picking */}
      {picking && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {islanders
            .filter((i) => i.status === "active" || i.status === "bombshell")
            .map((islander) => {
              const isOtherSelected =
                picking === 1
                  ? islander.id === selected2
                  : islander.id === selected1;
              return (
                <button
                  key={islander.id}
                  disabled={isOtherSelected}
                  onClick={() => {
                    if (picking === 1) {
                      setSelected1(islander.id);
                      if (!selected2) setPicking(2);
                      else setPicking(null);
                    } else {
                      setSelected2(islander.id);
                      setPicking(null);
                    }
                  }}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                    isOtherSelected
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : (picking === 1 && islander.id === selected1) ||
                          (picking === 2 && islander.id === selected2)
                        ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-amber-400"
                  }`}
                >
                  {islander.name.split(" ")[0]}
                </button>
              );
            })}
        </div>
      )}

      {/* Save button */}
      {selected1 && selected2 && !picking && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-400 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : saved
              ? "Saved!"
              : existingPick
                ? "Update Pick"
                : "Lock in Winners"}
        </button>
      )}
    </div>
  );
}
