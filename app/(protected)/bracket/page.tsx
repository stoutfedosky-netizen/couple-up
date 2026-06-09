import { createClient } from "@/lib/supabase/server";
import { getCurrentWeek } from "@/lib/queries/weeks";
import {
  getUserPredictionForWeek,
  getActiveIslandersForWeek,
} from "@/lib/queries/predictions";
import { getBonusQuestionsForWeek } from "@/lib/queries/admin";
import {
  getTodaysDailyBonus,
  getUserDailyAnswer,
} from "@/lib/queries/daily-bonus";
import { BracketBuilder } from "./bracket-builder";
import { QuestionOfTheDay } from "@/components/question-of-the-day";

export default async function BracketPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [currentWeek, dailyQuestion] = await Promise.all([
    getCurrentWeek(),
    getTodaysDailyBonus(),
  ]);

  // Fetch user's daily answer if there's a question
  const dailyAnswer =
    dailyQuestion && user
      ? await getUserDailyAnswer(user.id, dailyQuestion.id)
      : null;

  if (!currentWeek) {
    return (
      <div className="px-4 pt-6 pb-8">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Show QOTD even when no active week */}
          {dailyQuestion && (
            <QuestionOfTheDay
              question={dailyQuestion}
              existingAnswer={dailyAnswer}
            />
          )}

          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                No Active Week
              </h1>
              <p className="mt-2 text-white/70">
                Check back when a new week is open for predictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [islanders, bonusQuestions, existingPrediction] = await Promise.all([
    getActiveIslandersForWeek(currentWeek.id),
    getBonusQuestionsForWeek(currentWeek.id),
    getUserPredictionForWeek(user!.id, currentWeek.id),
  ]);

  const isLocked =
    new Date(currentWeek.prediction_deadline) < new Date();

  return (
    <div className="space-y-0">
      {/* Question of the Day — always at the top */}
      {dailyQuestion && (
        <div className="px-4 pt-6">
          <div className="mx-auto max-w-lg">
            <QuestionOfTheDay
              question={dailyQuestion}
              existingAnswer={dailyAnswer}
            />
          </div>
        </div>
      )}

      <BracketBuilder
        weekNumber={currentWeek.week_number}
        weekId={currentWeek.id}
        deadline={currentWeek.prediction_deadline}
        islanders={islanders}
        bonusQuestions={bonusQuestions}
        existingPrediction={existingPrediction}
        isLocked={isLocked}
      />
    </div>
  );
}
