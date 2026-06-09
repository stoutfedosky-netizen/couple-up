import { NextResponse } from "next/server";
import { getWeeklyLeaderboard } from "@/lib/queries/leaderboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekId = searchParams.get("weekId");

  if (!weekId) {
    return NextResponse.json({ entries: [] });
  }

  try {
    const entries = await getWeeklyLeaderboard(parseInt(weekId, 10));
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
