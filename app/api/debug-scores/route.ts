export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreWeek } from "@/lib/scoring";
import { isAdmin } from "@/lib/queries/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: scores, error: scoresErr } = await supabase
      .from("scores")
      .select("*")
      .limit(10);

    const { data: weeks, error: weeksErr } = await supabase
      .from("weeks")
      .select("*");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id ?? null,
      scores: scores ?? [],
      scoresError: scoresErr?.message ?? null,
      weeks: weeks ?? [],
      weeksError: weeksErr?.message ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { weekId } = await request.json();
    const result = await scoreWeek(weekId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
