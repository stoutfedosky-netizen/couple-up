import { createClient } from "@/lib/supabase/server";
import type {
  Prediction,
  PredictedCouple,
  PredictedDumping,
  BonusAnswer,
  ActualCouple,
  ActualDumping,
  BonusQuestion,
  Islander,
  DailyBonusQuestion,
} from "@/types/database";

interface ScoringResult {
  userId: string;
  displayName: string | null;
  couplePts: number;
  dumpPts: number;
  bonusPts: number;
  perfectBonus: number;
  streakBonus: number;
  total: number;
}

/**
 * Checks whether two couple pairings match (order-independent).
 */
function couplesMatch(
  pred: { islander_1_id: number; islander_2_id: number },
  actual: { islander_1_id: number; islander_2_id: number }
): boolean {
  return (
    (pred.islander_1_id === actual.islander_1_id &&
      pred.islander_2_id === actual.islander_2_id) ||
    (pred.islander_1_id === actual.islander_2_id &&
      pred.islander_2_id === actual.islander_1_id)
  );
}

export async function scoreWeek(weekId: number): Promise<{
  results: ScoringResult[];
  totalUsers: number;
}> {
  const supabase = await createClient();

  // 1. Fetch the week
  const { data: week, error: weekErr } = await supabase
    .from("weeks")
    .select("*")
    .eq("id", weekId)
    .single();

  if (weekErr || !week) throw new Error("Week not found");
  const weekNumber = (week as { week_number: number }).week_number;

  // 2. Fetch actual results
  const [actualCouplesRes, actualDumpingsRes, bonusQuestionsRes, islandersRes] =
    await Promise.all([
      supabase.from("actual_couples").select("*").eq("week_id", weekId),
      supabase.from("actual_dumpings").select("*").eq("week_id", weekId),
      supabase
        .from("bonus_questions")
        .select("*")
        .eq("week_id", weekId)
        .not("correct_answer", "is", null),
      supabase.from("islanders").select("*"),
    ]);

  const actualCouples = (actualCouplesRes.data || []) as ActualCouple[];
  const actualDumpings = (actualDumpingsRes.data || []) as ActualDumping[];
  const bonusQuestions = (bonusQuestionsRes.data || []) as BonusQuestion[];
  const allIslanders = (islandersRes.data || []) as Islander[];
  const actualDumpedIds = new Set(actualDumpings.map((d) => d.islander_id));

  // Build a set of bombshell islanders new this week
  const newBombshellIds = new Set(
    allIslanders
      .filter(
        (i) =>
          i.status === "bombshell" && i.entered_week === weekNumber
      )
      .map((i) => i.id)
  );

  // 3. Fetch all predictions for this week
  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("week_id", weekId);

  if (!predictions || predictions.length === 0) {
    return { results: [], totalUsers: 0 };
  }

  const predictionIds = (predictions as Prediction[]).map((p) => p.id);
  const userIds = (predictions as Prediction[]).map((p) => p.user_id);

  // 4. Fetch predicted couples, dumpings, bonus answers in bulk
  const [predCouplesRes, predDumpingsRes, bonusAnswersRes, profilesRes] =
    await Promise.all([
      supabase
        .from("predicted_couples")
        .select("*")
        .in("prediction_id", predictionIds),
      supabase
        .from("predicted_dumpings")
        .select("*")
        .in("prediction_id", predictionIds),
      supabase
        .from("bonus_answers")
        .select("*")
        .in("prediction_id", predictionIds),
      supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds),
    ]);

  const allPredCouples = (predCouplesRes.data || []) as PredictedCouple[];
  const allPredDumpings = (predDumpingsRes.data || []) as PredictedDumping[];
  const allBonusAnswers = (bonusAnswersRes.data || []) as BonusAnswer[];
  const profileMap = new Map(
    ((profilesRes.data || []) as { id: string; display_name: string | null }[]).map(
      (p) => [p.id, p.display_name]
    )
  );

  // 5. Check for previous week's perfect scores (for streak bonus)
  const prevWeekNumber = weekNumber - 1;
  let prevPerfectUserIds = new Set<string>();

  if (prevWeekNumber >= 1) {
    const { data: prevWeek } = await supabase
      .from("weeks")
      .select("id")
      .eq("week_number", prevWeekNumber)
      .single();

    if (prevWeek) {
      const { data: prevScores } = await supabase
        .from("scores")
        .select("user_id, perfect_bonus")
        .eq("week_id", (prevWeek as { id: number }).id)
        .gt("perfect_bonus", 0);

      if (prevScores) {
        prevPerfectUserIds = new Set(
          (prevScores as { user_id: string }[]).map((s) => s.user_id)
        );
      }
    }
  }

  // 6. Score each user
  const results: ScoringResult[] = [];

  for (const prediction of predictions as Prediction[]) {
    const userId = prediction.user_id;
    const predId = prediction.id;

    const userCouples = allPredCouples.filter(
      (c) => c.prediction_id === predId
    );
    const userDumpings = allPredDumpings.filter(
      (d) => d.prediction_id === predId
    );
    const userBonusAnswers = allBonusAnswers.filter(
      (a) => a.prediction_id === predId
    );

    // ─── Couple points ───
    let couplePts = 0;
    let correctCoupleCount = 0;

    for (const pred of userCouples) {
      const isCorrect = actualCouples.some((ac) => couplesMatch(pred, ac));
      if (isCorrect) {
        correctCoupleCount++;
        couplePts += 10;

        // Bombshell bonus: +20 if one islander is a new bombshell this week
        const involvesNewBombshell =
          newBombshellIds.has(pred.islander_1_id) ||
          newBombshellIds.has(pred.islander_2_id);
        if (involvesNewBombshell) {
          couplePts += 20;
        }
      }
    }

    // ─── Dumping points ───
    let dumpPts = 0;
    let correctDumpCount = 0;

    for (const pred of userDumpings) {
      if (actualDumpedIds.has(pred.islander_id)) {
        correctDumpCount++;
        dumpPts += 15;
      }
    }

    // ─── Bonus points ───
    let bonusPts = 0;

    for (const answer of userBonusAnswers) {
      const question = bonusQuestions.find(
        (q) => q.id === answer.question_id
      );
      if (question && answer.user_answer === question.correct_answer) {
        bonusPts += 5;
      }
    }

    // ─── Perfect week bonus ───
    // ALL couple pairings correct AND all dumping predictions correct.
    // "Correct" for dumpings means: every islander the user predicted dumped
    // was actually dumped, AND the user didn't miss any actual dumpings.
    // If user predicted 0 dumpings and 0 happened, that's correct.
    const allCouplesCorrect =
      userCouples.length > 0 &&
      correctCoupleCount === actualCouples.length &&
      userCouples.length === actualCouples.length;

    const allDumpingsCorrect =
      correctDumpCount === actualDumpings.length &&
      userDumpings.length === actualDumpings.length;

    const isPerfect = allCouplesCorrect && allDumpingsCorrect;
    const perfectBonus = isPerfect ? 25 : 0;

    // ─── Streak bonus ───
    const streakBonus =
      isPerfect && prevPerfectUserIds.has(userId) ? 10 : 0;

    const total =
      couplePts + dumpPts + bonusPts + perfectBonus + streakBonus;

    results.push({
      userId,
      displayName: profileMap.get(userId) ?? null,
      couplePts,
      dumpPts,
      bonusPts,
      perfectBonus,
      streakBonus,
      total,
    });
  }

  // 7. Score daily bonus questions for this week
  // Daily bonus points go to ALL users who answered correctly, even without a bracket prediction
  const { data: dailyQuestionsData } = await supabase
    .from("daily_bonus_questions")
    .select("*")
    .eq("week_id", weekId)
    .not("correct_answer", "is", null);

  const dailyQuestions = (dailyQuestionsData || []) as DailyBonusQuestion[];

  // Track daily bonus pts per user (including non-bracket users)
  const dailyBonusByUser = new Map<string, number>();

  if (dailyQuestions.length > 0) {
    const dailyQuestionIds = dailyQuestions.map((q) => q.id);
    const { data: dailyAnswersData } = await supabase
      .from("daily_bonus_answers")
      .select("*")
      .in("question_id", dailyQuestionIds);

    const dailyAnswers = (dailyAnswersData || []) as {
      question_id: number;
      user_id: string;
      user_answer: boolean;
    }[];

    for (const answer of dailyAnswers) {
      const question = dailyQuestions.find((q) => q.id === answer.question_id);
      if (question && answer.user_answer === question.correct_answer) {
        const current = dailyBonusByUser.get(answer.user_id) || 0;
        dailyBonusByUser.set(answer.user_id, current + 5);
      }
    }
  }

  // Add daily bonus to bracket users' results
  for (const r of results) {
    const dailyPts = dailyBonusByUser.get(r.userId) || 0;
    r.bonusPts += dailyPts;
    r.total += dailyPts;
    dailyBonusByUser.delete(r.userId); // remove so we don't double-count
  }

  // Create score rows for users who answered daily bonus but didn't submit a bracket
  const dailyOnlyUsers: ScoringResult[] = [];
  for (const [userId, dailyPts] of dailyBonusByUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();

    dailyOnlyUsers.push({
      userId,
      displayName: (profile as { display_name: string | null } | null)?.display_name ?? null,
      couplePts: 0,
      dumpPts: 0,
      bonusPts: dailyPts,
      perfectBonus: 0,
      streakBonus: 0,
      total: dailyPts,
    });
  }

  const allResults = [...results, ...dailyOnlyUsers];

  // 8. Upsert scores
  for (const r of allResults) {
    const { error } = await supabase.from("scores").upsert(
      {
        user_id: r.userId,
        week_id: weekId,
        couple_pts: r.couplePts,
        dump_pts: r.dumpPts,
        bonus_pts: r.bonusPts,
        perfect_bonus: r.perfectBonus,
        streak_bonus: r.streakBonus,
        total: r.total,
      },
      { onConflict: "user_id,week_id" }
    );
    if (error) {
      console.error(`Score upsert failed for user ${r.userId}:`, error);
    }
  }

  // 9. Lock all predictions for this week
  await supabase
    .from("predictions")
    .update({ is_locked: true })
    .eq("week_id", weekId);

  return { results: allResults, totalUsers: allResults.length };
}

/**
 * Score season winner predictions. Call when the final week is resolved.
 */
export async function scoreSeasonWinners(
  winnerIslander1Id: number,
  winnerIslander2Id: number
): Promise<number> {
  const supabase = await createClient();

  const { data: allPicks } = await supabase
    .from("season_winner_predictions")
    .select("*");

  if (!allPicks || allPicks.length === 0) return 0;

  let winnersCount = 0;

  for (const pick of allPicks as { user_id: string; islander_1_id: number; islander_2_id: number }[]) {
    const isCorrect = couplesMatch(
      { islander_1_id: pick.islander_1_id, islander_2_id: pick.islander_2_id },
      { islander_1_id: winnerIslander1Id, islander_2_id: winnerIslander2Id }
    );

    if (isCorrect) {
      winnersCount++;
      // Add 50 pts — find their latest score row or create a special one
      // We'll add to the last week's score
      const { data: lastWeek } = await supabase
        .from("weeks")
        .select("id")
        .order("week_number", { ascending: false })
        .limit(1)
        .single();

      if (lastWeek) {
        const weekId = (lastWeek as { id: number }).id;
        const { data: existingScore } = await supabase
          .from("scores")
          .select("*")
          .eq("user_id", pick.user_id)
          .eq("week_id", weekId)
          .single();

        if (existingScore) {
          await supabase
            .from("scores")
            .update({
              bonus_pts:
                (existingScore as { bonus_pts: number }).bonus_pts + 50,
              total: (existingScore as { total: number }).total + 50,
            })
            .eq("user_id", pick.user_id)
            .eq("week_id", weekId);
        } else {
          await supabase.from("scores").insert({
            user_id: pick.user_id,
            week_id: weekId,
            bonus_pts: 50,
            total: 50,
          });
        }
      }
    }
  }

  return winnersCount;
}
