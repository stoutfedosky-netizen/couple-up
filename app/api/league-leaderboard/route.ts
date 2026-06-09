import { NextResponse } from "next/server";
import { getLeagueLeaderboard } from "@/lib/queries/leaderboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");

  if (!leagueId) {
    return NextResponse.json({ entries: [] });
  }

  try {
    const entries = await getLeagueLeaderboard(leagueId);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
