"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitDailyBonusAnswer(
  questionId: number,
  answer: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify the question exists and deadline hasn't passed
  const { data: question, error: qErr } = await supabase
    .from("daily_bonus_questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (qErr || !question) {
    return { success: false, error: "Question not found" };
  }

  const deadline = new Date(
    (question as { deadline: string }).deadline
  );
  if (new Date() > deadline) {
    return { success: false, error: "Deadline has passed — answers are locked!" };
  }

  // Check if already answered
  const { data: existing } = await supabase
    .from("daily_bonus_answers")
    .select("id")
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "You've already answered this question" };
  }

  // Submit the answer
  const { error } = await supabase.from("daily_bonus_answers").insert({
    question_id: questionId,
    user_id: user.id,
    user_answer: answer,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/bracket");
  return { success: true };
}
