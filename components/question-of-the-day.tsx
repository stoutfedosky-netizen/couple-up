"use client";

import { useState, useEffect } from "react";
import { submitDailyBonusAnswer } from "@/app/(protected)/bracket/daily-bonus-actions";
import type { DailyBonusQuestion, DailyBonusAnswer } from "@/types/database";

function getTimeUntilDeadline(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Locked";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export function QuestionOfTheDay({
  question,
  existingAnswer,
}: {
  question: DailyBonusQuestion;
  existingAnswer: DailyBonusAnswer | null;
}) {
  const [selected, setSelected] = useState<boolean | null>(
    existingAnswer?.user_answer ?? null
  );
  const [submitted, setSubmitted] = useState(!!existingAnswer);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(
    getTimeUntilDeadline(question.deadline)
  );

  const isPastDeadline = new Date(question.deadline) < new Date();
  const isResolved = question.correct_answer !== null;

  // Update countdown every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilDeadline(question.deadline));
    }, 60000);
    return () => clearInterval(timer);
  }, [question.deadline]);

  async function handleSubmit() {
    if (selected === null || pending) return;
    setPending(true);
    setError(null);

    const result = await submitDailyBonusAnswer(question.id, selected);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Failed to submit");
    }
    setPending(false);
  }

  // Determine result state
  const gotItRight =
    isResolved && submitted && selected === question.correct_answer;
  const gotItWrong =
    isResolved && submitted && selected !== question.correct_answer;

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <h2 className="text-sm font-bold text-white">Question of the Day</h2>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPastDeadline
              ? "bg-white/10 text-white/50"
              : "bg-pink-500/20 text-pink-300"
          }`}
        >
          {isPastDeadline ? "Locked" : timeLeft}
        </span>
      </div>

      {/* Question */}
      <p className="text-white font-medium text-base leading-relaxed">
        {question.question_text}
      </p>

      {/* Answer buttons */}
      {!submitted && !isPastDeadline ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => setSelected(true)}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                selected === true
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setSelected(false)}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                selected === false
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-[1.02]"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              No
            </button>
          </div>

          {selected !== null && (
            <button
              onClick={handleSubmit}
              disabled={pending}
              className="w-full rounded-xl bg-pink-500 py-3 text-sm font-bold text-white hover:bg-pink-400 disabled:opacity-50 transition-all"
            >
              {pending ? "Submitting..." : "Lock In Answer"}
            </button>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Submitted state */}
          <div
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ${
              gotItRight
                ? "bg-emerald-500/20 text-emerald-300"
                : gotItWrong
                  ? "bg-red-500/20 text-red-300"
                  : submitted
                    ? "bg-white/10 text-white/70"
                    : "bg-white/5 text-white/40"
            }`}
          >
            {gotItRight && <span>✅ Correct! +5 pts</span>}
            {gotItWrong && (
              <span>
                ❌ Wrong — answer was{" "}
                {question.correct_answer ? "Yes" : "No"}
              </span>
            )}
            {submitted && !isResolved && (
              <span>
                ✅ Locked in: {selected ? "Yes" : "No"} — results after the
                episode!
              </span>
            )}
            {!submitted && isPastDeadline && (
              <span>⏰ Deadline passed — you didn&apos;t answer</span>
            )}
          </div>

          {/* Show point value hint */}
          {!isResolved && submitted && (
            <p className="text-[10px] text-white/40 text-center">
              Worth 5 pts if correct
            </p>
          )}
        </div>
      )}
    </div>
  );
}
