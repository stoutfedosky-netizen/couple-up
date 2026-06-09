import { createClient } from "@/lib/supabase/server";
import type {
  Week,
  ActualCouple,
  ActualDumping,
  BonusQuestion,
  Islander,
  Comment,
} from "@/types/database";

export interface WeekResults {
  week: Week;
  actualCouples: (ActualCouple & { islander1Name: string; islander2Name: string })[];
  actualDumpings: (ActualDumping & { islanderName: string })[];
  bonusQuestions: BonusQuestion[];
  comments: (Comment & { displayName: string | null; avatarUrl: string | null })[];
  totalPredictions: number;
}

export async function getWeekResults(weekNumber: number): Promise<WeekResults | null> {
  const supabase = await createClient();

  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("week_number", weekNumber)
    .single();

  if (!week || !(week as Week).is_resolved) return null;
  const w = week as Week;

  const [couplesRes, dumpingsRes, bonusRes, commentsRes, predictionsCount] =
    await Promise.all([
      supabase.from("actual_couples").select("*").eq("week_id", w.id),
      supabase.from("actual_dumpings").select("*").eq("week_id", w.id),
      supabase.from("bonus_questions").select("*").eq("week_id", w.id),
      supabase
        .from("comments")
        .select("*")
        .eq("week_id", w.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .eq("week_id", w.id),
    ]);

  // Get all islander IDs from couples and dumpings
  const couples = (couplesRes.data || []) as ActualCouple[];
  const dumpings = (dumpingsRes.data || []) as ActualDumping[];

  const islanderIds = [
    ...couples.flatMap((c) => [c.islander_1_id, c.islander_2_id]),
    ...dumpings.map((d) => d.islander_id),
  ];

  const { data: islanderData } = await supabase
    .from("islanders")
    .select("id, name")
    .in("id", islanderIds.length > 0 ? islanderIds : [0]);

  const nameMap = new Map(
    ((islanderData || []) as Islander[]).map((i) => [i.id, i.name])
  );

  // Get commenter profiles
  const comments = (commentsRes.data || []) as Comment[];
  const commenterIds = [...new Set(comments.map((c) => c.user_id))];

  const { data: profiles } = commenterIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", commenterIds)
    : { data: [] };

  const profileMap = new Map(
    ((profiles || []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.id, p]
    )
  );

  return {
    week: w,
    actualCouples: couples.map((c) => ({
      ...c,
      islander1Name: nameMap.get(c.islander_1_id) ?? "Unknown",
      islander2Name: nameMap.get(c.islander_2_id) ?? "Unknown",
    })),
    actualDumpings: dumpings.map((d) => ({
      ...d,
      islanderName: nameMap.get(d.islander_id) ?? "Unknown",
    })),
    bonusQuestions: (bonusRes.data || []) as BonusQuestion[],
    comments: comments.map((c) => ({
      ...c,
      displayName: profileMap.get(c.user_id)?.display_name ?? null,
      avatarUrl: profileMap.get(c.user_id)?.avatar_url ?? null,
    })),
    totalPredictions: predictionsCount.count || 0,
  };
}

export async function getResolvedWeeks(): Promise<Week[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weeks")
    .select("*")
    .eq("is_resolved", true)
    .order("week_number", { ascending: false });
  return (data || []) as Week[];
}
