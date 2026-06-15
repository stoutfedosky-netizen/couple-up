"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, resolveWeek as resolveWeekQuery } from "@/lib/queries/admin";
import { scoreWeek } from "@/lib/scoring";
import type { IslanderStatus } from "@/types/database";

async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) throw new Error("Unauthorized");
}

// ─── Islander Actions ───

export async function addIslanderAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("islanders").insert({
    name: formData.get("name") as string,
    age: parseInt(formData.get("age") as string, 10),
    hometown: formData.get("hometown") as string,
    status: (formData.get("status") as IslanderStatus) || "active",
    entered_week: parseInt(formData.get("entered_week") as string, 10) || 1,
  });
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/islanders");
}

export async function updateIslanderAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = parseInt(formData.get("id") as string, 10);
  const status = formData.get("status") as IslanderStatus;
  const exitedWeek = formData.get("exited_week") as string;

  const updates: Record<string, unknown> = {
    name: formData.get("name") as string,
    age: parseInt(formData.get("age") as string, 10),
    hometown: formData.get("hometown") as string,
    status,
    entered_week: parseInt(formData.get("entered_week") as string, 10),
  };

  if (exitedWeek) {
    updates.exited_week = parseInt(exitedWeek, 10);
  } else if (status === "dumped") {
    // Auto-set exited_week to current week
    const { data: currentWeek } = await supabase
      .from("weeks")
      .select("week_number")
      .eq("is_resolved", false)
      .order("week_number")
      .limit(1)
      .single();
    if (currentWeek) {
      updates.exited_week = currentWeek.week_number;
    }
  }

  const { error } = await supabase
    .from("islanders")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/islanders");
}

export async function deleteIslanderAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = parseInt(formData.get("id") as string, 10);
  const { error } = await supabase.from("islanders").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/islanders");
}

// ─── Week Actions ───

export async function createWeekAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("weeks").insert({
    week_number: parseInt(formData.get("week_number") as string, 10),
    prediction_deadline: formData.get("prediction_deadline") as string,
  });
  if (error) throw error;
  revalidatePath("/admin");
}

export async function resolveWeekAction(payload: {
  weekId: number;
  couples: { islander_1_id: number; islander_2_id: number }[];
  dumpedIds: number[];
  bonusAnswers: { question_id: number; correct_answer: boolean }[];
}) {
  await requireAdmin();
  await resolveWeekQuery(
    payload.weekId,
    payload.couples,
    payload.dumpedIds,
    payload.bonusAnswers
  );
  await scoreWeek(payload.weekId);
  revalidatePath("/admin");
  revalidatePath("/islanders");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/results");
}

// ─── Bonus Question Actions ───

export async function createBonusQuestionAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("bonus_questions").insert({
    week_id: parseInt(formData.get("week_id") as string, 10),
    question_text: formData.get("question_text") as string,
  });
  if (error) throw error;
  revalidatePath("/admin");
}

export async function deleteBonusQuestionAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = parseInt(formData.get("id") as string, 10);
  const { error } = await supabase
    .from("bonus_questions")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
}

// ─── Daily Bonus Question Actions ───

export async function createDailyBonusAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const episodeDate = formData.get("episode_date") as string;

  // Auto-set deadline to 8:00 PM Central Time on the episode date
  // CT is UTC-6 (CST) or UTC-5 (CDT). During summer (Love Island season), it's CDT (UTC-5).
  // 8:00 PM CDT = 1:00 AM UTC next day... actually let's just use America/Chicago offset.
  // 8:00 PM CT = 20:00 in America/Chicago
  // In CDT (summer): UTC-5, so 20:00 CDT = 01:00 UTC next day
  const deadline = `${episodeDate}T20:00:00-05:00`;

  const { error } = await supabase.from("daily_bonus_questions").insert({
    week_id: parseInt(formData.get("week_id") as string, 10),
    question_text: formData.get("question_text") as string,
    episode_date: episodeDate,
    deadline,
  });
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bracket");
}

export async function deleteDailyBonusAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = parseInt(formData.get("id") as string, 10);
  const { error } = await supabase
    .from("daily_bonus_questions")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bracket");
}

export async function resolveDailyBonusAction(
  questionId: number,
  correctAnswer: boolean
) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_bonus_questions")
    .update({ correct_answer: correctAnswer })
    .eq("id", questionId);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bracket");
}
