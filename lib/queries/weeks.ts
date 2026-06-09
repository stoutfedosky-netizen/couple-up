import { createClient } from "@/lib/supabase/server";
import type { Week } from "@/types/database";

export async function getAllWeeks(): Promise<Week[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weeks")
    .select("*")
    .order("week_number");
  if (error) throw error;
  return data as Week[];
}

export async function getCurrentWeek(): Promise<Week | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weeks")
    .select("*")
    .eq("is_resolved", false)
    .order("week_number")
    .limit(1)
    .single();
  if (error) return null;
  return data as Week;
}

export async function createWeek(week: {
  week_number: number;
  prediction_deadline: string;
}): Promise<Week> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weeks")
    .insert(week)
    .select()
    .single();
  if (error) throw error;
  return data as Week;
}
