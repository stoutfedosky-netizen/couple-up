import { createClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  rank: number;
  prevRank: number | null;
  streakCount: number;
  isPerfectWeek?: boolean;
  weekPoints?: number;
}

export interface UserRankInfo {
  globalRank: number;
  totalPlayers: number;
  totalPoints: number;
  currentStreak: number;
  bestWeekScore: number;
  bestWeekNumber: number | null;
}

export interface UserLeagueInfo {
  leagueId: string;
  leagueName: string;
  inviteCode: string;
  memberCount: number;
  userRank: number;
  isCreator: boolean;
}

// ─── Global Leaderboard ───

export async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Aggregate all scores per user
  const { data: scores } = await supabase
    .from("scores")
    .select("user_id, total, week_id, perfect_bonus");

  if (!scores || scores.length === 0) return [];

  // Get all weeks ordered to identify the latest resolved week
  const { data: weeks } = await supabase
    .from("weeks")
    .select("id, week_number")
    .eq("is_resolved", true)
    .order("week_number", { ascending: false });

  const latestWeekId = weeks && weeks.length > 0 ? (weeks[0] as { id: number }).id : null;
  const prevWeekId = weeks && weeks.length > 1 ? (weeks[1] as { id: number }).id : null;

  // Aggregate per user
  const userTotals = new Map<string, number>();
  const userStreaks = new Map<string, number>();
  const userLatestWeekScore = new Map<string, number>();
  const userPrevTotal = new Map<string, number>();

  type ScoreRow = { user_id: string; total: number; week_id: number; perfect_bonus: number };

  for (const s of scores as ScoreRow[]) {
    userTotals.set(s.user_id, (userTotals.get(s.user_id) || 0) + s.total);

    // Track scores excluding latest week for prev rank
    if (s.week_id !== latestWeekId) {
      userPrevTotal.set(s.user_id, (userPrevTotal.get(s.user_id) || 0) + s.total);
    }

    if (s.week_id === latestWeekId) {
      userLatestWeekScore.set(s.user_id, s.total);
    }
  }

  // Calculate streaks (consecutive perfect weeks from most recent backwards)
  if (weeks && weeks.length > 0) {
    const weekIds = (weeks as { id: number }[]).map((w) => w.id);
    const userPerfects = new Map<string, Set<number>>();

    for (const s of scores as ScoreRow[]) {
      if (s.perfect_bonus > 0) {
        if (!userPerfects.has(s.user_id)) userPerfects.set(s.user_id, new Set());
        userPerfects.get(s.user_id)!.add(s.week_id);
      }
    }

    for (const [userId, perfectWeeks] of userPerfects) {
      let streak = 0;
      for (const wId of weekIds) {
        if (perfectWeeks.has(wId)) streak++;
        else break;
      }
      userStreaks.set(userId, streak);
    }
  }

  // Get profiles
  const userIds = Array.from(userTotals.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    ((profiles || []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.id, p]
    )
  );

  // Build entries sorted by total desc
  const entries: LeaderboardEntry[] = userIds
    .map((userId) => ({
      userId,
      displayName: profileMap.get(userId)?.display_name ?? null,
      avatarUrl: profileMap.get(userId)?.avatar_url ?? null,
      totalPoints: userTotals.get(userId) || 0,
      rank: 0,
      prevRank: null as number | null,
      streakCount: userStreaks.get(userId) || 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign dense ranks
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].totalPoints < entries[i - 1].totalPoints) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }

  // Calculate previous ranks
  if (prevWeekId) {
    const prevEntries = userIds
      .map((userId) => ({
        userId,
        total: userPrevTotal.get(userId) || 0,
      }))
      .sort((a, b) => b.total - a.total);

    let prevCurrentRank = 1;
    const prevRankMap = new Map<string, number>();
    for (let i = 0; i < prevEntries.length; i++) {
      if (i > 0 && prevEntries[i].total < prevEntries[i - 1].total) {
        prevCurrentRank = i + 1;
      }
      prevRankMap.set(prevEntries[i].userId, prevCurrentRank);
    }

    for (const entry of entries) {
      entry.prevRank = prevRankMap.get(entry.userId) ?? null;
    }
  }

  return entries;
}

// ─── Weekly Leaderboard ───

export async function getWeeklyLeaderboard(
  weekId: number
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data: scores } = await supabase
    .from("scores")
    .select("user_id, total, couple_pts, dump_pts, bonus_pts, perfect_bonus, streak_bonus")
    .eq("week_id", weekId)
    .order("total", { ascending: false });

  if (!scores || scores.length === 0) return [];

  type WeekScoreRow = {
    user_id: string;
    total: number;
    perfect_bonus: number;
  };

  const userIds = (scores as WeekScoreRow[]).map((s) => s.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    ((profiles || []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.id, p]
    )
  );

  const entries: LeaderboardEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < scores.length; i++) {
    const s = scores[i] as WeekScoreRow;
    if (i > 0 && s.total < (scores[i - 1] as WeekScoreRow).total) {
      currentRank = i + 1;
    }
    entries.push({
      userId: s.user_id,
      displayName: profileMap.get(s.user_id)?.display_name ?? null,
      avatarUrl: profileMap.get(s.user_id)?.avatar_url ?? null,
      totalPoints: s.total,
      weekPoints: s.total,
      rank: currentRank,
      prevRank: null,
      streakCount: 0,
      isPerfectWeek: s.perfect_bonus > 0,
    });
  }

  return entries;
}

// ─── League Leaderboard ───

export async function getLeagueLeaderboard(
  leagueId: string
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Get league member user IDs
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId);

  if (!members || members.length === 0) return [];

  const memberIds = (members as { user_id: string }[]).map((m) => m.user_id);

  // Get all scores for members
  const { data: scores } = await supabase
    .from("scores")
    .select("user_id, total")
    .in("user_id", memberIds);

  // Aggregate
  const userTotals = new Map<string, number>();
  for (const s of (scores || []) as { user_id: string; total: number }[]) {
    userTotals.set(s.user_id, (userTotals.get(s.user_id) || 0) + s.total);
  }

  // Include members with 0 points
  for (const id of memberIds) {
    if (!userTotals.has(id)) userTotals.set(id, 0);
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", memberIds);

  const profileMap = new Map(
    ((profiles || []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.id, p]
    )
  );

  const entries: LeaderboardEntry[] = Array.from(userTotals.entries())
    .map(([userId, total]) => ({
      userId,
      displayName: profileMap.get(userId)?.display_name ?? null,
      avatarUrl: profileMap.get(userId)?.avatar_url ?? null,
      totalPoints: total,
      rank: 0,
      prevRank: null,
      streakCount: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].totalPoints < entries[i - 1].totalPoints) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }

  return entries;
}

// ─── User Rank ───

export async function getUserRank(userId: string): Promise<UserRankInfo> {
  const supabase = await createClient();

  const { data: allScores } = await supabase
    .from("scores")
    .select("user_id, total, week_id, perfect_bonus");

  if (!allScores || allScores.length === 0) {
    return {
      globalRank: 0,
      totalPlayers: 0,
      totalPoints: 0,
      currentStreak: 0,
      bestWeekScore: 0,
      bestWeekNumber: null,
    };
  }

  type ScoreRow = { user_id: string; total: number; week_id: number; perfect_bonus: number };

  // Aggregate per user
  const userTotals = new Map<string, number>();
  const userBestWeek = new Map<string, { score: number; weekId: number }>();

  for (const s of allScores as ScoreRow[]) {
    userTotals.set(s.user_id, (userTotals.get(s.user_id) || 0) + s.total);

    const current = userBestWeek.get(s.user_id);
    if (!current || s.total > current.score) {
      userBestWeek.set(s.user_id, { score: s.total, weekId: s.week_id });
    }
  }

  // Sort for ranking
  const sorted = Array.from(userTotals.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  let userRank = 0;
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i][1] < sorted[i - 1][1]) {
      currentRank = i + 1;
    }
    if (sorted[i][0] === userId) {
      userRank = currentRank;
      break;
    }
  }

  // Streak
  const { data: weeks } = await supabase
    .from("weeks")
    .select("id")
    .eq("is_resolved", true)
    .order("week_number", { ascending: false });

  let currentStreak = 0;
  if (weeks) {
    for (const w of weeks as { id: number }[]) {
      const score = (allScores as ScoreRow[]).find(
        (s) => s.user_id === userId && s.week_id === w.id
      );
      if (score && score.perfect_bonus > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Best week number
  const best = userBestWeek.get(userId);
  let bestWeekNumber: number | null = null;
  if (best && weeks) {
    const { data: weekData } = await supabase
      .from("weeks")
      .select("week_number")
      .eq("id", best.weekId)
      .single();
    if (weekData) bestWeekNumber = (weekData as { week_number: number }).week_number;
  }

  return {
    globalRank: userRank,
    totalPlayers: sorted.length,
    totalPoints: userTotals.get(userId) || 0,
    currentStreak,
    bestWeekScore: best?.score || 0,
    bestWeekNumber,
  };
}

// ─── User Leagues ───

export async function getUserLeagues(
  userId: string
): Promise<UserLeagueInfo[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const leagueIds = (memberships as { league_id: string }[]).map(
    (m) => m.league_id
  );

  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name, invite_code, creator_id")
    .in("id", leagueIds);

  if (!leagues) return [];

  const results: UserLeagueInfo[] = [];

  for (const league of leagues as {
    id: string;
    name: string;
    invite_code: string;
    creator_id: string;
  }[]) {
    // Get member count
    const { count } = await supabase
      .from("league_members")
      .select("*", { count: "exact", head: true })
      .eq("league_id", league.id);

    // Get league leaderboard for rank
    const lb = await getLeagueLeaderboard(league.id);
    const userEntry = lb.find((e) => e.userId === userId);

    results.push({
      leagueId: league.id,
      leagueName: league.name,
      inviteCode: league.invite_code,
      memberCount: count || 0,
      userRank: userEntry?.rank || 0,
      isCreator: league.creator_id === userId,
    });
  }

  return results;
}
