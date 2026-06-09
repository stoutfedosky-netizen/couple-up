import { createClient } from "@/lib/supabase/server";
import type { Islander, IslanderStatus } from "@/types/database";

export async function getAllIslanders(): Promise<Islander[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("islanders")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Islander[];
}

export async function getActiveIslanders(): Promise<Islander[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("islanders")
    .select("*")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data as Islander[];
}

export async function getIslanderById(id: number): Promise<Islander | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("islanders")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Islander;
}

export async function createIslander(islander: {
  name: string;
  age: number;
  hometown: string;
  status: IslanderStatus;
  entered_week: number;
}): Promise<Islander> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("islanders")
    .insert(islander)
    .select()
    .single();
  if (error) throw error;
  return data as Islander;
}

export async function updateIslander(
  id: number,
  updates: Partial<Pick<Islander, "name" | "age" | "hometown" | "status" | "photo_url" | "entered_week" | "exited_week">>
): Promise<Islander> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("islanders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Islander;
}

export async function updateIslanderStatus(
  id: number,
  status: IslanderStatus,
  exitedWeek?: number
): Promise<Islander> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status };
  if (status === "dumped" && exitedWeek) {
    updates.exited_week = exitedWeek;
  }
  const { data, error } = await supabase
    .from("islanders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Islander;
}

export async function deleteIslander(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("islanders").delete().eq("id", id);
  if (error) throw error;
}
