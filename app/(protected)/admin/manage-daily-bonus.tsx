"use client";

import { useState } from "react";
import type { Week, DailyBonusQuestion } from "@/types/database";
import {
  createDailyBonusAction,
  deleteDailyBonusAction,
  resolveDailyBonusAction,
} from "./actions";

export function ManageDailyBonus({
  questions,
  weeks,
}: {
  questions: (DailyBonusQuestion & { week_number?: number })[];
  weeks: Week[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
      >
        {showCreate ? "Cancel" : "+ Add Daily Question"}
      </button>

      {showCreate && (
        <CreateDailyForm
          weeks={weeks}
          onDone={() => setShowCreate(false)}
        />
      )}

      {/* Question list */}
      {questions.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No daily bonus questions yet. Add one above.
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <DailyQuestionRow key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function DailyQuestionRow({
  question: q,
}: {
  question: DailyBonusQuestion & { week_number?: number };
}) {
  const [resolving, setResolving] = useState(false);

  const isPast = new Date(q.deadline) < new Date();
  const isResolved = q.correct_answer !== null;

  async function handleResolve(answer: boolean) {
    setResolving(true);
    try {
      await resolveDailyBonusAction(q.id, answer);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm text-gray-200">{q.question_text}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">
              Week {q.week_number ?? "?"} · {q.episode_date}
            </span>
            <span
              className={`text-xs font-medium ${
                isResolved
                  ? "text-emerald-400"
                  : isPast
                    ? "text-amber-400"
                    : "text-gray-500"
              }`}
            >
              {isResolved
                ? `Answer: ${q.correct_answer ? "Yes" : "No"}`
                : isPast
                  ? "Needs resolution"
                  : "Open"}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm("Delete this daily question?")) {
              const formData = new FormData();
              formData.set("id", String(q.id));
              deleteDailyBonusAction(formData);
            }
          }}
          className="text-red-400 hover:text-red-300 text-xs font-medium"
        >
          Delete
        </button>
      </div>

      {/* Resolve buttons — show when past deadline but not yet resolved */}
      {isPast && !isResolved && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handleResolve(true)}
            disabled={resolving}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Answer: Yes
          </button>
          <button
            onClick={() => handleResolve(false)}
            disabled={resolving}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
          >
            Answer: No
          </button>
        </div>
      )}
    </div>
  );
}

function CreateDailyForm({
  weeks,
  onDone,
}: {
  weeks: Week[];
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);

  // Default date to today
  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await createDailyBonusAction(formData);
          onDone();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed");
        } finally {
          setPending(false);
        }
      }}
      className="grid grid-cols-1 gap-3 rounded-lg bg-gray-900 p-4 sm:grid-cols-2"
    >
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Week
        </label>
        <select
          name="week_id"
          required
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
        >
          <option value="">Select week...</option>
          {weeks.map((w) => (
            <option key={w.id} value={w.id}>
              Week {w.week_number}
              {w.is_resolved ? " (resolved)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Episode Date
        </label>
        <input
          name="episode_date"
          type="date"
          required
          defaultValue={today}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Question (yes/no)
        </label>
        <input
          name="question_text"
          required
          placeholder="e.g., Will someone get dumped tonight?"
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
        />
      </div>

      <div className="sm:col-span-2">
        <p className="text-xs text-gray-500 mb-2">
          Deadline auto-set to 8:00 PM CT on the episode date. Users must answer before the show starts.
        </p>
      </div>

      <div className="sm:col-span-2 flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Question"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
