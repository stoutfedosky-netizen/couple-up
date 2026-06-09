import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/queries/admin";
import { scoreWeek } from "@/lib/scoring";

export async function POST(request: Request) {
  try {
    // Verify admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const weekId = body.weekId;

    if (!weekId || typeof weekId !== "number") {
      return NextResponse.json(
        { error: "weekId is required and must be a number" },
        { status: 400 }
      );
    }

    const { results, totalUsers } = await scoreWeek(weekId);

    // Find top scorer
    const topScorer = results.reduce<{
      displayName: string | null;
      total: number;
    } | null>((best, r) => {
      if (!best || r.total > best.total) {
        return { displayName: r.displayName, total: r.total };
      }
      return best;
    }, null);

    return NextResponse.json({
      success: true,
      totalUsers,
      topScorer,
      results: results.map((r) => ({
        userId: r.userId,
        displayName: r.displayName,
        total: r.total,
      })),
    });
  } catch (err) {
    console.error("Score week error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 500 }
    );
  }
}
