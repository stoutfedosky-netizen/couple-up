"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitPrediction(payload: {
  weekId: number;
  couples: { islander_1_id: number; islander_2_id: number }[];
  dumpedIds: number[];
  bonusAnswers: { question_id: number; user_answer: boolean }[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check deadline
  const { data: week } = await supabase
    .from("weeks")
    .select("prediction_deadline")
    .eq("id", payload.weekId)
    .single();

  if (!week) throw new Error("Week not found");
  if (new Date((week as { prediction_deadline: string }).prediction_deadline) < new Date()) {
    throw new Error("Prediction deadline has passed");
  }

  // Check for existing prediction
  const { data: existing } = await supabase
    .from("predictions")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_id", payload.weekId)
    .single();

  let predictionId: number;

  if (existing) {
    predictionId = (existing as { id: number }).id;

    // Update existing — delete old data and re-insert
    await Promise.all([
      supabase
        .from("predicted_couples")
        .delete()
        .eq("prediction_id", predictionId),
      supabase
        .from("predicted_dumpings")
        .delete()
        .eq("prediction_id", predictionId),
      supabase
        .from("bonus_answers")
        .delete()
        .eq("prediction_id", predictionId),
    ]);

    // Update submitted_at
    await supabase
      .from("predictions")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", predictionId);
  } else {
    // Create new prediction
    const { data: newPred, error: predError } = await supabase
      .from("predictions")
      .insert({
        user_id: user.id,
        week_id: payload.weekId,
      })
      .select("id")
      .single();

    if (predError) throw predError;
    predictionId = (newPred as { id: number }).id;
  }

  // Insert couples
  if (payload.couples.length > 0) {
    const { error } = await supabase.from("predicted_couples").insert(
      payload.couples.map((c) => ({
        prediction_id: predictionId,
        islander_1_id: c.islander_1_id,
        islander_2_id: c.islander_2_id,
      }))
    );
    if (error) throw error;
  }

  // Insert dumpings
  if (payload.dumpedIds.length > 0) {
    const { error } = await supabase.from("predicted_dumpings").insert(
      payload.dumpedIds.map((id) => ({
        prediction_id: predictionId,
        islander_id: id,
      }))
    );
    if (error) throw error;
  }

  // Insert bonus answers
  if (payload.bonusAnswers.length > 0) {
    const { error } = await supabase.from("bonus_answers").insert(
      payload.bonusAnswers.map((a) => ({
        prediction_id: predictionId,
        question_id: a.question_id,
        user_answer: a.user_answer,
      }))
    );
    if (error) throw error;
  }

  revalidatePath("/bracket");
  revalidatePath("/predictions");
  revalidatePath("/dashboard");

  return { predictionId };
}

export async function saveSeasonWinner(payload: {
  islander_1_id: number;
  islander_2_id: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if Week 4 deadline has passed
  const { data: week4 } = await supabase
    .from("weeks")
    .select("prediction_deadline")
    .eq("week_number", 4)
    .single();

  if (
    week4 &&
    new Date((week4 as { prediction_deadline: string }).prediction_deadline) < new Date()
  ) {
    throw new Error("Season winner predictions are locked after Week 4");
  }

  // Upsert
  const { data: existing } = await supabase
    .from("season_winner_predictions")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("season_winner_predictions")
      .update({
        islander_1_id: payload.islander_1_id,
        islander_2_id: payload.islander_2_id,
        predicted_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("season_winner_predictions")
      .insert({
        user_id: user.id,
        islander_1_id: payload.islander_1_id,
        islander_2_id: payload.islander_2_id,
      });
    if (error) throw error;
  }

  revalidatePath("/dashboard");
}
