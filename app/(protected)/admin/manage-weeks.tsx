"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Islander, Week, BonusQuestion } from "@/types/database";
import { createWeekAction, resolveWeekAction } from "./actions";

export function ManageWeeks({
  weeks,
  activeIslanders,
  resolveWeekId,
  resolveWeekBonusQuestions,
}: {
  weeks: Week[];
  activeIslanders: Islander[];
  resolveWeekId: number | null;
  resolveWeekBonusQuestions: BonusQuestion[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  // If we're in resolve mode, show the resolve workflow
  const resolveWeek = resolveWeekId
    ? weeks.find((w) => w.id === resolveWeekId)
    : null;

  if (resolveWeek) {
    return (
      <ResolveWeekWorkflow
        week={resolveWeek}
        activeIslanders={activeIslanders}
        bonusQuestions={resolveWeekBonusQuestions}
        onBack={() => router.push("/admin?tab=weeks")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
      >
        {showCreate ? "Cancel" : "+ Create Week"}
      </button>

      {showCreate && <CreateWeekForm onDone={() => setShowCreate(false)} />}

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Week</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {weeks.map((week) => (
              <tr key={week.id} className="bg-gray-950 text-gray-300">
                <td className="px-4 py-3 font-medium text-white">
                  Week {week.week_number}
                </td>
                <td className="px-4 py-3">
                  {new Date(week.prediction_deadline).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {week.is_resolved ? (
                    <span className="inline-flex rounded-full bg-emerald-900 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      Resolved
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-900 px-2 py-0.5 text-xs font-semibold text-amber-300">
                      Open
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!week.is_resolved && (
                    <button
                      onClick={() =>
                        router.push(
                          `/admin?tab=weeks&resolve=${week.id}`
                        )
                      }
                      className="text-rose-400 hover:text-rose-300 text-xs font-medium"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateWeekForm({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await createWeekAction(formData);
          onDone();
        } finally {
          setPending(false);
        }
      }}
      className="grid grid-cols-2 gap-3 rounded-lg bg-gray-900 p-4"
    >
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Week Number
        </label>
        <input
          name="week_number"
          type="number"
          required
          min={1}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Prediction Deadline
        </label>
        <input
          name="prediction_deadline"
          type="datetime-local"
          required
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
        />
      </div>
      <div className="col-span-2 flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create Week"}
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

// ─── Resolve Week Workflow ───

type ResolveStep = "couples" | "dumpings" | "bonus" | "confirm";

function ResolveWeekWorkflow({
  week,
  activeIslanders,
  bonusQuestions,
  onBack,
}: {
  week: Week;
  activeIslanders: Islander[];
  bonusQuestions: BonusQuestion[];
  onBack: () => void;
}) {
  const [step, setStep] = useState<ResolveStep>("couples");
  const [couples, setCouples] = useState<
    { islander_1_id: number; islander_2_id: number }[]
  >([]);
  const [dumpedIds, setDumpedIds] = useState<number[]>([]);
  const [bonusAnswers, setBonusAnswers] = useState<
    Record<number, boolean>
  >({});
  const [pending, setPending] = useState(false);
  const [scoringStatus, setScoringStatus] = useState<string | null>(null);
  const [scoringResult, setScoringResult] = useState<{
    totalUsers: number;
    topScorer: { displayName: string | null; total: number } | null;
  } | null>(null);

  const steps: ResolveStep[] = ["couples", "dumpings"];
  if (bonusQuestions.length > 0) steps.push("bonus");
  steps.push("confirm");

  const stepIndex = steps.indexOf(step);

  async function handleResolve() {
    if (
      !confirm(
        "This will lock results and calculate scores. Continue?"
      )
    )
      return;

    setPending(true);
    setScoringStatus("Saving results...");
    try {
      await resolveWeekAction({
        weekId: week.id,
        couples,
        dumpedIds,
        bonusAnswers: Object.entries(bonusAnswers).map(([qId, ans]) => ({
          question_id: parseInt(qId, 10),
          correct_answer: ans,
        })),
      });

      setScoringStatus("Calculating scores...");

      const res = await fetch("/api/score-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId: week.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setScoringResult({
          totalUsers: data.totalUsers,
          topScorer: data.topScorer,
        });
        setScoringStatus(null);
      } else {
        setScoringStatus("Scoring failed — you can re-run from the API.");
      }
    } catch {
      setScoringStatus("Error occurred during scoring.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm"
        >
          &larr; Back
        </button>
        <h2 className="text-lg font-bold text-white">
          Resolve Week {week.week_number}
        </h2>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => i <= stepIndex && setStep(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              s === step
                ? "bg-rose-600 text-white"
                : i < stepIndex
                  ? "bg-emerald-900 text-emerald-300"
                  : "bg-gray-800 text-gray-500"
            }`}
          >
            {s === "couples"
              ? "1. Couples"
              : s === "dumpings"
                ? "2. Dumpings"
                : s === "bonus"
                  ? "3. Bonus"
                  : "4. Confirm"}
          </button>
        ))}
      </div>

      {/* Step content */}
      {step === "couples" && (
        <CouplesPairing
          islanders={activeIslanders}
          couples={couples}
          onChange={setCouples}
        />
      )}
      {step === "dumpings" && (
        <DumpingSelect
          islanders={activeIslanders}
          pairedIds={couples.flatMap((c) => [c.islander_1_id, c.islander_2_id])}
          dumpedIds={dumpedIds}
          onChange={setDumpedIds}
        />
      )}
      {step === "bonus" && (
        <BonusAnswerForm
          questions={bonusQuestions}
          answers={bonusAnswers}
          onChange={setBonusAnswers}
        />
      )}
      {step === "confirm" && (
        <ConfirmResolve
          week={week}
          couples={couples}
          dumpedIds={dumpedIds}
          bonusAnswers={bonusAnswers}
          islanders={activeIslanders}
          bonusQuestions={bonusQuestions}
          onConfirm={handleResolve}
          pending={pending}
          scoringStatus={scoringStatus}
          scoringResult={scoringResult}
          onDone={onBack}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-800">
        <button
          onClick={() => setStep(steps[stepIndex - 1])}
          disabled={stepIndex === 0}
          className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-30"
        >
          Previous
        </button>
        {step !== "confirm" && (
          <button
            onClick={() => setStep(steps[stepIndex + 1])}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Couples Pairing ───

function CouplesPairing({
  islanders,
  couples,
  onChange,
}: {
  islanders: Islander[];
  couples: { islander_1_id: number; islander_2_id: number }[];
  onChange: (c: { islander_1_id: number; islander_2_id: number }[]) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const pairedIds = new Set(
    couples.flatMap((c) => [c.islander_1_id, c.islander_2_id])
  );

  function handleClick(id: number) {
    if (pairedIds.has(id)) return;

    if (selected === null) {
      setSelected(id);
    } else if (selected === id) {
      setSelected(null);
    } else {
      onChange([
        ...couples,
        { islander_1_id: selected, islander_2_id: id },
      ]);
      setSelected(null);
    }
  }

  function removeCouple(index: number) {
    onChange(couples.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Click two islanders to pair them as a couple. Click a paired couple to remove.
      </p>

      {/* Paired couples */}
      {couples.length > 0 && (
        <div className="space-y-2">
          {couples.map((couple, i) => {
            const i1 = islanders.find((x) => x.id === couple.islander_1_id);
            const i2 = islanders.find((x) => x.id === couple.islander_2_id);
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-rose-950 border border-rose-800 px-4 py-2"
              >
                <span className="text-sm text-rose-200">
                  {i1?.name} & {i2?.name}
                </span>
                <button
                  onClick={() => removeCouple(i)}
                  className="text-rose-400 hover:text-rose-300 text-xs"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Islander grid for selection */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {islanders.map((islander) => {
          const isPaired = pairedIds.has(islander.id);
          const isSelected = selected === islander.id;
          return (
            <button
              key={islander.id}
              onClick={() => handleClick(islander.id)}
              disabled={isPaired}
              className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                isPaired
                  ? "border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed"
                  : isSelected
                    ? "border-rose-500 bg-rose-950 text-rose-200 ring-2 ring-rose-500"
                    : "border-gray-700 bg-gray-800 text-gray-300 hover:border-rose-500 hover:text-white"
              }`}
            >
              {islander.name.split(" ")[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dumping Select ───

function DumpingSelect({
  islanders,
  pairedIds,
  dumpedIds,
  onChange,
}: {
  islanders: Islander[];
  pairedIds: number[];
  dumpedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  function toggle(id: number) {
    if (dumpedIds.includes(id)) {
      onChange(dumpedIds.filter((d) => d !== id));
    } else {
      onChange([...dumpedIds, id]);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Select islanders who were dumped this week.
      </p>

      <div className="space-y-2">
        {islanders.map((islander) => {
          const isDumped = dumpedIds.includes(islander.id);
          return (
            <label
              key={islander.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                isDumped
                  ? "border-red-700 bg-red-950"
                  : "border-gray-800 bg-gray-900 hover:border-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={isDumped}
                onChange={() => toggle(islander.id)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-rose-600 focus:ring-rose-500"
              />
              <span
                className={`text-sm font-medium ${isDumped ? "text-red-300" : "text-gray-300"}`}
              >
                {islander.name}
              </span>
              {pairedIds.includes(islander.id) && (
                <span className="text-xs text-gray-500">(paired)</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bonus Answer Form ───

function BonusAnswerForm({
  questions,
  answers,
  onChange,
}: {
  questions: BonusQuestion[];
  answers: Record<number, boolean>;
  onChange: (a: Record<number, boolean>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Set the correct answer for each bonus question.
      </p>

      {questions.map((q) => (
        <div
          key={q.id}
          className="rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <p className="text-sm font-medium text-gray-200 mb-3">
            {q.question_text}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onChange({ ...answers, [q.id]: true })}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                answers[q.id] === true
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => onChange({ ...answers, [q.id]: false })}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                answers[q.id] === false
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              No
            </button>
          </div>
        </div>
      ))}

      {questions.length === 0 && (
        <p className="text-sm text-gray-500 py-4">
          No bonus questions for this week. You can skip this step.
        </p>
      )}
    </div>
  );
}

// ─── Confirm & Resolve ───

function ConfirmResolve({
  week,
  couples,
  dumpedIds,
  bonusAnswers,
  islanders,
  bonusQuestions,
  onConfirm,
  pending,
  scoringStatus,
  scoringResult,
  onDone,
}: {
  week: Week;
  couples: { islander_1_id: number; islander_2_id: number }[];
  dumpedIds: number[];
  bonusAnswers: Record<number, boolean>;
  islanders: Islander[];
  bonusQuestions: BonusQuestion[];
  onConfirm: () => void;
  pending: boolean;
  scoringStatus: string | null;
  scoringResult: {
    totalUsers: number;
    topScorer: { displayName: string | null; total: number } | null;
  } | null;
  onDone: () => void;
}) {
  const getName = (id: number) =>
    islanders.find((i) => i.id === id)?.name ?? `#${id}`;

  // Show scoring result when done
  if (scoringResult) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-emerald-700 bg-emerald-950 p-6 text-center space-y-3">
          <div className="text-4xl">&#10003;</div>
          <h3 className="text-lg font-bold text-emerald-300">
            Week {week.week_number} Resolved!
          </h3>
          <p className="text-sm text-emerald-400">
            Scores calculated for {scoringResult.totalUsers} user
            {scoringResult.totalUsers !== 1 ? "s" : ""}.
          </p>
          {scoringResult.topScorer && (
            <div className="rounded-lg bg-emerald-900 p-3 mt-3">
              <p className="text-xs text-emerald-400 uppercase tracking-wide font-semibold">
                Top Scorer
              </p>
              <p className="text-lg font-extrabold text-white mt-1">
                {scoringResult.topScorer.displayName || "Anonymous"} —{" "}
                {scoringResult.topScorer.total} pts
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onDone}
          className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm font-bold text-white hover:bg-gray-700"
        >
          Back to Weeks
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scoring progress */}
      {scoringStatus && (
        <div className="rounded-lg border border-blue-700 bg-blue-950 p-4 flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <p className="text-sm font-medium text-blue-300">{scoringStatus}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-4">
        <h3 className="text-sm font-bold text-white">
          Week {week.week_number} Resolution Summary
        </h3>

        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Couples ({couples.length})
          </h4>
          {couples.length === 0 ? (
            <p className="text-sm text-gray-500">None</p>
          ) : (
            <ul className="space-y-1">
              {couples.map((c, i) => (
                <li key={i} className="text-sm text-rose-300">
                  {getName(c.islander_1_id)} & {getName(c.islander_2_id)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Dumped ({dumpedIds.length})
          </h4>
          {dumpedIds.length === 0 ? (
            <p className="text-sm text-gray-500">None</p>
          ) : (
            <ul className="space-y-1">
              {dumpedIds.map((id) => (
                <li key={id} className="text-sm text-red-300">
                  {getName(id)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {bonusQuestions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Bonus Answers
            </h4>
            <ul className="space-y-1">
              {bonusQuestions.map((q) => (
                <li key={q.id} className="text-sm text-gray-300">
                  {q.question_text}:{" "}
                  <span
                    className={
                      bonusAnswers[q.id]
                        ? "text-emerald-400"
                        : bonusAnswers[q.id] === false
                          ? "text-red-400"
                          : "text-gray-500"
                    }
                  >
                    {bonusAnswers[q.id] === true
                      ? "Yes"
                      : bonusAnswers[q.id] === false
                        ? "No"
                        : "Not set"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={onConfirm}
        disabled={pending}
        className="w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50"
      >
        {pending ? "Resolving..." : "Confirm & Resolve Week"}
      </button>
    </div>
  );
}
