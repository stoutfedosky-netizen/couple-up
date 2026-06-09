"use client";

import { useState } from "react";
import type { Week, BonusQuestion } from "@/types/database";
import {
  createBonusQuestionAction,
  deleteBonusQuestionAction,
} from "./actions";

export function ManageBonusQuestions({
  bonusQuestions,
  weeks,
}: {
  bonusQuestions: (BonusQuestion & { week_number?: number })[];
  weeks: Week[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  // Group by week
  const grouped = bonusQuestions.reduce<
    Record<number, (BonusQuestion & { week_number?: number })[]>
  >((acc, q) => {
    const wk = q.week_id;
    if (!acc[wk]) acc[wk] = [];
    acc[wk].push(q);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
      >
        {showCreate ? "Cancel" : "+ Add Question"}
      </button>

      {showCreate && (
        <CreateQuestionForm
          weeks={weeks}
          onDone={() => setShowCreate(false)}
        />
      )}

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No bonus questions yet. Add one above.
        </p>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([weekId, questions]) => (
            <div key={weekId} className="space-y-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Week {questions[0]?.week_number ?? weekId}
              </h3>
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{q.question_text}</p>
                    {q.correct_answer !== null && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Answer:{" "}
                        <span
                          className={
                            q.correct_answer
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {q.correct_answer ? "Yes" : "No"}
                        </span>
                      </p>
                    )}
                  </div>
                  <form
                    action={deleteBonusQuestionAction}
                    onSubmit={(e) => {
                      if (!confirm("Delete this question?")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={q.id} />
                    <button
                      type="submit"
                      className="text-red-400 hover:text-red-300 text-xs font-medium ml-3"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ))
      )}
    </div>
  );
}

function CreateQuestionForm({
  weeks,
  onDone,
}: {
  weeks: Week[];
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);

  const placeholders = [
    "Will there be a recoupling?",
    "Will a bombshell enter the villa?",
    "Will any couple break up?",
  ];
  const placeholder =
    placeholders[Math.floor(Math.random() * placeholders.length)];

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await createBonusQuestionAction(formData);
          onDone();
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

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Question (yes/no)
        </label>
        <input
          name="question_text"
          required
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
        />
      </div>

      <div className="sm:col-span-2 flex gap-2 pt-2">
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
