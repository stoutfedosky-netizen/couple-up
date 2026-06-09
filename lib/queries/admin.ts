import { createClient } from "@/lib/supabase/server";
import type { BonusQuestion } from "@/types/database";

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return data?.is_admin === true;
}

export async function resolveWeek(
  weekId: number,
  couples: { islander_1_id: number; islander_2_id: number }[],
  dumpedIslanderIds: number[],
  bonusAnswers: { question_id: number; correct_answer: boolean }[]
): Promise<void> {
  const supabase = await createClient();

  // Insert actual couples
  if (couples.length > 0) {
    const coupleRows = couples.map((c) => ({
      week_id: weekId,
      islander_1_id: c.islander_1_id,
      islander_2_id: c.islander_2_id,
    }));
    const { error: coupleError } = await supabase
      .from("actual_couples")
      .insert(coupleRows);
    if (coupleError) throw coupleError;
  }

  // Insert actual dumpings
  if (dumpedIslanderIds.length > 0) {
    const dumpRows = dumpedIslanderIds.map((id) => ({
      week_id: weekId,
      islander_id: id,
    }));
    const { error: dumpError } = await supabase
      .from("actual_dumpings")
      .insert(dumpRows);
    if (dumpError) throw dumpError;

    // Update islander statuses to dumped
    for (const id of dumpedIslanderIds) {
      const { error: statusError } = await supabase
        .from("islanders")
        .update({ status: "dumped", exited_week: weekId })
        .eq("id", id);
      if (statusError) throw statusError;
    }
  }

  // Update bonus question correct answers
  for (const answer of bonusAnswers) {
    const { error: bonusError } = await supabase
      .from("bonus_questions")
      .update({ correct_answer: answer.correct_answer })
      .eq("id", answer.question_id);
    if (bonusError) throw bonusError;
  }

  // Mark week as resolved
  const { error: resolveError } = await supabase
    .from("weeks")
    .update({ is_resolved: true })
    .eq("id", weekId);
  if (resolveError) throw resolveError;
}

export async function getBonusQuestionsForWeek(
  weekId: number
): Promise<BonusQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bonus_questions")
    .select("*")
    .eq("week_id", weekId)
    .order("id");
  if (error) throw error;
  return data as BonusQuestion[];
}

export async function getAllBonusQuestions(): Promise<
  (BonusQuestion & { week_number?: number })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bonus_questions")
    .select("*, weeks(week_number)")
    .order("week_id")
    .order("id");
  if (error) throw error;
  return (data as unknown as (BonusQuestion & { weeks: { week_number: number } })[]).map((q) => ({
    ...q,
    week_number: q.weeks?.week_number,
  }));
}

export async function createBonusQuestion(question: {
  week_id: number;
  question_text: string;
}): Promise<BonusQuestion> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bonus_questions")
    .insert(question)
    .select()
    .single();
  if (error) throw error;
  return data as BonusQuestion;
}

export async function deleteBonusQuestion(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bonus_questions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
