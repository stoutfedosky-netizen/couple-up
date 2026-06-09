"use client";

import type { Islander, BonusQuestion } from "@/types/database";
import type { PredictionWithDetails } from "@/lib/queries/predictions";
import {
  BracketProvider,
  useBracket,
  type CoupleSlot,
} from "@/components/bracket-context";
import { CountdownTimer } from "@/components/countdown-timer";
import { SharePredictionButton } from "@/components/share-prediction";
import { submitPrediction } from "./actions";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function BracketBuilder({
  weekNumber,
  weekId,
  deadline,
  islanders,
  bonusQuestions,
  existingPrediction,
  isLocked,
}: {
  weekNumber: number;
  weekId: number;
  deadline: string;
  islanders: Islander[];
  bonusQuestions: BonusQuestion[];
  existingPrediction: PredictionWithDetails | null;
  isLocked: boolean;
}) {
  // Pre-populate from existing prediction
  const initialCouples: CoupleSlot[] =
    existingPrediction?.couples.map((c) => ({
      islander_1_id: c.islander_1_id,
      islander_2_id: c.islander_2_id,
    })) || [];

  const initialDumpedIds =
    existingPrediction?.dumpings.map((d) => d.islander_id) || [];

  const initialBonusAnswers: Record<number, boolean> = {};
  existingPrediction?.bonusAnswers.forEach((a) => {
    initialBonusAnswers[a.question_id] = a.user_answer;
  });

  return (
    <BracketProvider
      islanders={islanders}
      weekId={weekId}
      deadline={deadline}
      isLocked={isLocked}
      bonusQuestions={bonusQuestions}
      initialCouples={initialCouples}
      initialDumpedIds={initialDumpedIds}
      initialBonusAnswers={initialBonusAnswers}
      isSubmitted={!!existingPrediction}
    >
      <BracketContent weekNumber={weekNumber} islanders={islanders} />
    </BracketProvider>
  );
}

function BracketContent({
  weekNumber,
  islanders,
}: {
  weekNumber: number;
  islanders: Islander[];
}) {
  const { state, dispatch } = useBracket();

  // Locked state
  if (state.isLocked) {
    return (
      <LockedView
        weekNumber={weekNumber}
        state={state}
        islanders={islanders}
      />
    );
  }

  const steps = ["couples", "dumpings"] as const;
  const stepLabels = ["Couples", "Dumpings"];
  if (state.bonusQuestions.length > 0) {
    (steps as unknown as string[]).push("bonus");
    stepLabels.push("Bonus");
  }
  (steps as unknown as string[]).push("review");
  stepLabels.push("Review");

  const stepIndex = (steps as unknown as string[]).indexOf(state.step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-white">
                Week {weekNumber}
              </h1>
              <p className="text-sm text-white/70">Make your predictions</p>
            </div>
            <CountdownTimer deadline={state.deadline} />
          </div>

          {/* Step indicators */}
          <div className="mt-4 flex gap-1.5">
            {stepLabels.map((label, i) => (
              <button
                key={label}
                onClick={() =>
                  i <= stepIndex &&
                  dispatch({
                    type: "SET_STEP",
                    step: (steps as unknown as string[])[i] as typeof state.step,
                  })
                }
                className={`flex-1 rounded-full py-1 text-xs font-bold transition-all ${
                  i === stepIndex
                    ? "bg-white text-rose-600 shadow-lg"
                    : i < stepIndex
                      ? "bg-white/30 text-white"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto max-w-lg px-4 pb-32">
        <div className="rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl p-5 min-h-[50vh]">
          {state.step === "couples" && <CouplesStep islanders={islanders} />}
          {state.step === "dumpings" && (
            <DumpingsStep islanders={islanders} />
          )}
          {state.step === "bonus" && <BonusStep />}
          {state.step === "review" && (
            <ReviewStep islanders={islanders} weekNumber={weekNumber} />
          )}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-2">
        <div className="mx-auto max-w-lg flex gap-3">
          {stepIndex > 0 && (
            <button
              onClick={() =>
                dispatch({
                  type: "SET_STEP",
                  step: (steps as unknown as string[])[stepIndex - 1] as typeof state.step,
                })
              }
              className="rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm"
            >
              Back
            </button>
          )}
          {state.step !== "review" && (
            <button
              onClick={() =>
                dispatch({
                  type: "SET_STEP",
                  step: (steps as unknown as string[])[stepIndex + 1] as typeof state.step,
                })
              }
              disabled={state.step === "couples" && !useAllAssigned()}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-rose-600 shadow-lg disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function useAllAssigned() {
  const { allAssigned } = useBracket();
  return allAssigned;
}

// ─── Step 1: Couples ───

function CouplesStep({ islanders }: { islanders: Islander[] }) {
  const { state, dispatch, unpairedIslanders, pairedCount, totalCount, allAssigned } =
    useBracket();

  const getName = (id: number) =>
    islanders.find((i) => i.id === id)?.name ?? "";
  const getInitials = (id: number) => {
    const name = getName(id);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Predict the Couples
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Tap two islanders to pair them. {pairedCount} of {totalCount} assigned.
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-300"
            style={{ width: `${(pairedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Paired couples */}
      {state.couples.length > 0 && (
        <div className="space-y-2">
          {state.couples.map((couple, index) => (
            <button
              key={index}
              onClick={() => dispatch({ type: "UNPAIR_COUPLE", index })}
              className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-3 transition-all hover:shadow-md active:scale-[0.98] group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-400 text-sm font-bold text-white">
                {getInitials(couple.islander_1_id)}
              </div>
              <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
                {getName(couple.islander_1_id)}
              </span>
              <span className="text-rose-400 text-lg">&hearts;</span>
              <span className="text-sm font-semibold text-gray-900 flex-1 text-right">
                {getName(couple.islander_2_id)}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-400 text-sm font-bold text-white">
                {getInitials(couple.islander_2_id)}
              </div>
              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 ml-1">
                &times;
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Singles zone */}
      {state.singleIds.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Single
          </h3>
          <div className="flex flex-wrap gap-2">
            {state.singleIds.map((id) => (
              <button
                key={id}
                onClick={() => dispatch({ type: "TOGGLE_SINGLE", id })}
                className="flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
              >
                {getName(id)}
                <span className="text-gray-400">&times;</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unpaired pool */}
      {unpairedIslanders.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {state.selectedId ? "Tap to pair with..." : "Tap to select"}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {unpairedIslanders.map((islander) => {
              const isSelected = state.selectedId === islander.id;
              return (
                <button
                  key={islander.id}
                  onClick={() =>
                    dispatch({ type: "SELECT_ISLANDER", id: islander.id })
                  }
                  className={`relative flex flex-col items-center rounded-xl border-2 p-3 transition-all active:scale-95 ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-100 animate-pulse-subtle"
                      : state.selectedId
                        ? "border-rose-200 bg-rose-50 hover:border-rose-400 hover:shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ${
                      isSelected
                        ? "bg-gradient-to-br from-cyan-400 to-teal-400"
                        : "bg-gradient-to-br from-rose-400 to-orange-300"
                    }`}
                  >
                    {getInitials(islander.id)}
                  </div>
                  <span className="mt-1.5 text-sm font-semibold text-gray-900 leading-tight text-center">
                    {islander.name.split(" ")[0]}
                  </span>
                  <span className="text-xs text-gray-400">{islander.age}</span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[10px] text-white font-bold">
                      1
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mark as single (when odd number) */}
          {unpairedIslanders.length === 1 && (
            <button
              onClick={() =>
                dispatch({
                  type: "TOGGLE_SINGLE",
                  id: unpairedIslanders[0].id,
                })
              }
              className="mt-3 w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
            >
              Mark {unpairedIslanders[0].name.split(" ")[0]} as Single
            </button>
          )}
        </div>
      )}

      {allAssigned && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
          <p className="text-sm font-semibold text-emerald-700">
            All islanders assigned! Tap Next to continue.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Dumpings ───

function DumpingsStep({ islanders }: { islanders: Islander[] }) {
  const { state, dispatch } = useBracket();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Predict the Dumpings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Select up to 3 islanders you think will be dumped this week.
          This step is optional.
        </p>
      </div>

      <div className="space-y-2">
        {islanders.map((islander) => {
          const isDumped = state.dumpedIds.includes(islander.id);
          return (
            <button
              key={islander.id}
              onClick={() =>
                dispatch({ type: "TOGGLE_DUMPED", id: islander.id })
              }
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all active:scale-[0.98] ${
                isDumped
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                  isDumped
                    ? "bg-red-500"
                    : "bg-gradient-to-br from-rose-400 to-orange-300"
                }`}
              >
                {islander.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 text-left">
                <p
                  className={`text-sm font-semibold ${isDumped ? "text-red-700" : "text-gray-900"}`}
                >
                  {islander.name}
                </p>
                <p className="text-xs text-gray-400">
                  {islander.age} &middot; {islander.hometown}
                </p>
              </div>
              {isDumped && (
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wide">
                  Dumped
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        {state.dumpedIds.length}/3 selected
      </p>
    </div>
  );
}

// ─── Step 3: Bonus ───

function BonusStep() {
  const { state, dispatch } = useBracket();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Bonus Predictions
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Answer these yes/no questions for extra points.
        </p>
      </div>

      <div className="space-y-3">
        {state.bonusQuestions.map((q) => {
          const answer = state.bonusAnswers[q.id];
          return (
            <div
              key={q.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <p className="text-sm font-medium text-gray-900 mb-3">
                {q.question_text}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    dispatch({
                      type: "SET_BONUS_ANSWER",
                      questionId: q.id,
                      answer: true,
                    })
                  }
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                    answer === true
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() =>
                    dispatch({
                      type: "SET_BONUS_ANSWER",
                      questionId: q.id,
                      answer: false,
                    })
                  }
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                    answer === false
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-red-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Review & Submit ───

function ReviewStep({
  islanders,
  weekNumber,
}: {
  islanders: Islander[];
  weekNumber: number;
}) {
  const { state, dispatch } = useBracket();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedPredictionId, setSubmittedPredictionId] = useState<number | null>(null);

  const getName = (id: number) =>
    islanders.find((i) => i.id === id)?.name ?? "";

  const handleSubmit = useCallback(async () => {
    dispatch({ type: "SET_SUBMITTING", value: true });
    try {
      const result = await submitPrediction({
        weekId: state.weekId,
        couples: state.couples,
        dumpedIds: state.dumpedIds,
        bonusAnswers: Object.entries(state.bonusAnswers).map(
          ([qId, answer]) => ({
            question_id: parseInt(qId, 10),
            user_answer: answer,
          })
        ),
      });
      dispatch({ type: "SET_SUBMITTED" });
      setSubmittedPredictionId(result.predictionId);
      setShowSuccess(true);
    } catch (err) {
      dispatch({ type: "SET_SUBMITTING", value: false });
      alert(err instanceof Error ? err.message : "Failed to submit");
    }
  }, [state, dispatch]);

  if (showSuccess) {
    return (
      <SuccessAnimation
        predictionId={submittedPredictionId}
        weekNumber={weekNumber}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Review Your Prediction
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Week {weekNumber} &middot;{" "}
          {state.isSubmitted ? "Updating prediction" : "First submission"}
        </p>
      </div>

      {/* Countdown */}
      <div className="flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 p-4">
        <div className="text-center">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
            Time Remaining
          </p>
          <CountdownTimer deadline={state.deadline} />
        </div>
      </div>

      {/* Couples summary */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Your Couples ({state.couples.length})
        </h3>
        <div className="space-y-1.5">
          {state.couples.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-gray-900">
                {getName(c.islander_1_id)}
              </span>
              <span className="text-rose-400">&hearts;</span>
              <span className="font-semibold text-gray-900">
                {getName(c.islander_2_id)}
              </span>
            </div>
          ))}
          {state.singleIds.map((id) => (
            <div
              key={id}
              className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-gray-600">
                {getName(id)}
              </span>
              <span className="text-gray-400">(Single)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dumpings */}
      {state.dumpedIds.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Predicted Dumpings ({state.dumpedIds.length})
          </h3>
          <div className="space-y-1.5">
            {state.dumpedIds.map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm"
              >
                <span className="font-semibold text-red-700">
                  {getName(id)}
                </span>
                <span className="text-red-400 text-xs font-bold uppercase">
                  Dumped
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus answers */}
      {state.bonusQuestions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Bonus Answers
          </h3>
          <div className="space-y-1.5">
            {state.bonusQuestions.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm"
              >
                <span className="text-gray-700 flex-1">{q.question_text}</span>
                <span
                  className={`ml-2 font-bold ${
                    state.bonusAnswers[q.id] === true
                      ? "text-emerald-600"
                      : state.bonusAnswers[q.id] === false
                        ? "text-red-600"
                        : "text-gray-400"
                  }`}
                >
                  {state.bonusAnswers[q.id] === true
                    ? "Yes"
                    : state.bonusAnswers[q.id] === false
                      ? "No"
                      : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={state.isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {state.isSubmitting
          ? "Submitting..."
          : state.isSubmitted
            ? "Update Prediction"
            : "Submit Prediction"}
      </button>

      {state.isSubmitted && (
        <p className="text-xs text-gray-400 text-center">
          You can update your prediction until the deadline.
        </p>
      )}
    </div>
  );
}

// ─── Success Animation ───

function SuccessAnimation({
  predictionId,
  weekNumber,
}: {
  predictionId: number | null;
  weekNumber: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        {/* Hearts animation */}
        <div className="text-6xl animate-bounce">&hearts;</div>
        <div className="absolute -top-4 -left-6 text-2xl animate-float-1 text-rose-300">
          &hearts;
        </div>
        <div className="absolute -top-2 left-10 text-xl animate-float-2 text-pink-300">
          &hearts;
        </div>
        <div className="absolute top-8 -right-6 text-3xl animate-float-3 text-orange-300">
          &hearts;
        </div>
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900">
        Prediction Submitted!
      </h2>
      <p className="text-sm text-gray-500 text-center">
        Good luck! You can edit your prediction until the deadline.
      </p>
      {predictionId && (
        <SharePredictionButton
          predictionId={predictionId}
          weekNumber={weekNumber}
        />
      )}
    </div>
  );
}

// ─── Locked View ───

function LockedView({
  weekNumber,
  state,
  islanders,
}: {
  weekNumber: number;
  state: ReturnType<typeof useBracket>["state"];
  islanders: Islander[];
}) {
  const getName = (id: number) =>
    islanders.find((i) => i.id === id)?.name ?? "";

  if (!state.isSubmitted && state.couples.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😢</p>
          <h1 className="text-xl font-bold text-gray-900">
            Week {weekNumber} Missed
          </h1>
          <p className="mt-2 text-gray-500">
            You missed this week&apos;s prediction deadline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">
            Week {weekNumber} Prediction
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            Locked
          </span>
        </div>

        {/* Couples */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Your Couples
          </h3>
          <div className="space-y-1.5">
            {state.couples.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm"
              >
                <span className="font-semibold text-gray-900">
                  {getName(c.islander_1_id)}
                </span>
                <span className="text-rose-400">&hearts;</span>
                <span className="font-semibold text-gray-900">
                  {getName(c.islander_2_id)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dumpings */}
        {state.dumpedIds.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Predicted Dumpings
            </h3>
            {state.dumpedIds.map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm mb-1.5"
              >
                <span className="font-semibold text-red-700">
                  {getName(id)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
