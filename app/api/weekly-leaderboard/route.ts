export const dynamic = "force-dynamic";

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
  } catch (err) {
    console.error("Weekly leaderboard error:", err);
    return NextResponse.json(
      { entries: [], error: String(err) },
      { status: 500 }
    );
  }
}
