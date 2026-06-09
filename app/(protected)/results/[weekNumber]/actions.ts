"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addCommentAction(weekId: number, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error("Comment must be 1-500 characters");
  }

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    week_id: weekId,
    content: trimmed,
  });

  if (error) throw error;
  revalidatePath(`/results`);
}

export async function deleteCommentAction(commentId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath(`/results`);
}
