"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createLeagueAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0) throw new Error("Name is required");

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const { data: league, error: leagueErr } = await supabase
    .from("leagues")
    .insert({
      name: name.trim(),
      invite_code: inviteCode,
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (leagueErr) throw leagueErr;

  // Auto-add creator as member
  await supabase.from("league_members").insert({
    league_id: (league as { id: string }).id,
    user_id: user.id,
  });

  revalidatePath("/leaderboard");
  return { leagueId: (league as { id: string }).id, inviteCode };
}

export async function joinLeagueAction(inviteCode: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("invite_code", inviteCode.toUpperCase().trim())
    .single();

  if (!league) throw new Error("Invalid invite code");

  // Check if already a member
  const { data: existing } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", (league as { id: string }).id)
    .eq("user_id", user.id)
    .single();

  if (existing) throw new Error("You're already in this league");

  const { error } = await supabase.from("league_members").insert({
    league_id: (league as { id: string }).id,
    user_id: user.id,
  });

  if (error) throw error;

  revalidatePath("/leaderboard");
  return { leagueName: (league as { name: string }).name };
}

export async function removeMemberAction(leagueId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify caller is the creator
  const { data: league } = await supabase
    .from("leagues")
    .select("creator_id")
    .eq("id", leagueId)
    .single();

  if (!league || (league as { creator_id: string }).creator_id !== user.id) {
    throw new Error("Only the league creator can remove members");
  }

  // Can't remove yourself (creator)
  if (userId === user.id) {
    throw new Error("Creator can't leave their own league");
  }

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId);

  if (error) throw error;
  revalidatePath("/leaderboard");
}

export async function deleteLeagueAction(leagueId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: league } = await supabase
    .from("leagues")
    .select("creator_id")
    .eq("id", leagueId)
    .single();

  if (!league || (league as { creator_id: string }).creator_id !== user.id) {
    throw new Error("Only the league creator can delete the league");
  }

  // Delete members first (cascade should handle this, but be explicit)
  await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId);

  const { error } = await supabase
    .from("leagues")
    .delete()
    .eq("id", leagueId);

  if (error) throw error;
  revalidatePath("/leaderboard");
}

export async function leaveLeagueAction(leagueId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/leaderboard");
}
