"use client";

import { useState } from "react";
import type { Islander } from "@/types/database";
import type { WeekPredictionView } from "@/lib/queries/predictions";
import { SharePredictionButton } from "@/components/share-prediction";

interface ScoreRow {
  week_id: number;
  total: number;
  couple_pts: number;
  dump_pts: number;
  bonus_pts: number;
  perfect_bonus: number;
  streak_bonus: number;
}

export function PredictionHistory({
  weekPredictions,
  islanders,
  scores,
}: {
  weekPredictions: WeekPredictionView[];
  islanders: Islander[];
  scores: ScoreRow[];
}) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const getName = (id: number) =>
    islanders.find((i) => i.id === id)?.name ?? `#${id}`;

  const getScore = (weekId: number) =>
    scores.find((s) => s.week_id === weekId);

  if (weekPredictions.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">
        No weeks available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {weekPredictions.map((wp) => {
        const isExpanded = expandedWeek === wp.week.id;
        const score = getScore(wp.week.id);
        const hasPrediction = !!wp.prediction;

        return (
          <div key={wp.week.id} className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Header — always visible */}
            <button
              onClick={() =>
                setExpandedWeek(isExpanded ? null : wp.week.id)
              }
              className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  Week {wp.week.week_number}
                </p>
                <p className="text-xs text-gray-400">
                  {hasPrediction
                    ? `Submitted ${new Date(
                        wp.prediction!.prediction.submitted_at
                      ).toLocaleDateString()}`
                    : "No prediction"}
                </p>
              </div>

              {/* Score or status */}
              {wp.week.is_resolved && score ? (
                <div className="text-right">
                  <p className="text-lg font-extrabold text-rose-600">
                    {score.total}
                  </p>
                  <p className="text-xs text-gray-400">pts</p>
                </div>
              ) : wp.week.is_resolved ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Resolved
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Open
                </span>
              )}

              {/* Chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
                {!hasPrediction ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No prediction submitted for this week.
                  </p>
                ) : (
                  <>
                    {/* Score breakdown */}
                    {score && (
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {[
                          { label: "Couples", val: score.couple_pts },
                          { label: "Dumps", val: score.dump_pts },
                          { label: "Bonus", val: score.bonus_pts },
                          { label: "Perfect", val: score.perfect_bonus },
                          { label: "Streak", val: score.streak_bonus },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="rounded-lg bg-white p-2 border border-gray-100"
                          >
                            <p className="text-sm font-bold text-gray-900">
                              {s.val}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {s.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Couples */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Couples
                      </h4>
                      <div className="space-y-1.5">
                        {wp.prediction!.couples.map((c, i) => {
                          const isCorrect = wp.week.is_resolved
                            ? wp.actualCouples.some(
                                (ac) =>
                                  (ac.islander_1_id === c.islander_1_id &&
                                    ac.islander_2_id === c.islander_2_id) ||
                                  (ac.islander_1_id === c.islander_2_id &&
                                    ac.islander_2_id === c.islander_1_id)
                              )
                            : null;

                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                isCorrect === true
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : isCorrect === false
                                    ? "bg-red-50 border border-red-200"
                                    : "bg-white border border-gray-200"
                              }`}
                            >
                              {isCorrect === true && (
                                <span className="text-emerald-500">&#10003;</span>
                              )}
                              {isCorrect === false && (
                                <span className="text-red-500">&#10007;</span>
                              )}
                              <span className="font-medium text-gray-900">
                                {getName(c.islander_1_id)}
                              </span>
                              <span className="text-rose-400">&hearts;</span>
                              <span className="font-medium text-gray-900">
                                {getName(c.islander_2_id)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actual couples (if resolved and different) */}
                    {wp.week.is_resolved && wp.actualCouples.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Actual Couples
                        </h4>
                        <div className="space-y-1.5">
                          {wp.actualCouples.map((ac, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-gray-700">
                                {getName(ac.islander_1_id)}
                              </span>
                              <span className="text-gray-400">&hearts;</span>
                              <span className="font-medium text-gray-700">
                                {getName(ac.islander_2_id)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dumpings */}
                    {wp.prediction!.dumpings.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Predicted Dumpings
                        </h4>
                        <div className="space-y-1.5">
                          {wp.prediction!.dumpings.map((d) => {
                            const isCorrect = wp.week.is_resolved
                              ? wp.actualDumpings.some(
                                  (ad) => ad.islander_id === d.islander_id
                                )
                              : null;

                            return (
                              <div
                                key={d.id}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                  isCorrect === true
                                    ? "bg-emerald-50 border border-emerald-200"
                                    : isCorrect === false
                                      ? "bg-red-50 border border-red-200"
                                      : "bg-white border border-gray-200"
                                }`}
                              >
                                {isCorrect === true && (
                                  <span className="text-emerald-500">
                                    &#10003;
                                  </span>
                                )}
                                {isCorrect === false && (
                                  <span className="text-red-500">&#10007;</span>
                                )}
                                <span className="font-medium text-gray-900">
                                  {getName(d.islander_id)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Share button */}
                    <div className="flex justify-end">
                      <SharePredictionButton
                        predictionId={wp.prediction!.prediction.id}
                        weekNumber={wp.week.week_number}
                        compact
                      />
                    </div>

                    {/* Bonus answers */}
                    {wp.prediction!.bonusAnswers.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Bonus Questions
                        </h4>
                        <div className="space-y-1.5">
                          {wp.prediction!.bonusAnswers.map((ba) => {
                            const question = wp.bonusQuestions.find(
                              (q) => q.id === ba.question_id
                            );
                            const isCorrect =
                              question?.correct_answer !== null &&
                              question?.correct_answer !== undefined
                                ? ba.user_answer === question.correct_answer
                                : null;

                            return (
                              <div
                                key={ba.id}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                  isCorrect === true
                                    ? "bg-emerald-50 border border-emerald-200"
                                    : isCorrect === false
                                      ? "bg-red-50 border border-red-200"
                                      : "bg-white border border-gray-200"
                                }`}
                              >
                                <span className="text-gray-700 flex-1">
                                  {isCorrect === true && (
                                    <span className="text-emerald-500 mr-1">
                                      &#10003;
                                    </span>
                                  )}
                                  {isCorrect === false && (
                                    <span className="text-red-500 mr-1">
                                      &#10007;
                                    </span>
                                  )}
                                  {ba.question_text || question?.question_text}
                                </span>
                                <span
                                  className={`font-bold ml-2 ${
                                    ba.user_answer
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {ba.user_answer ? "Yes" : "No"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
