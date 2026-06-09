import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ predictionId: string }> }
) {
  const { predictionId } = await params;
  const supabase = await createClient();

  // Fetch prediction with week info
  const { data: prediction } = await supabase
    .from("predictions")
    .select("*")
    .eq("id", parseInt(predictionId, 10))
    .single();

  if (!prediction) {
    return new Response("Prediction not found", { status: 404 });
  }

  const pred = prediction as {
    id: number;
    user_id: string;
    week_id: number;
  };

  // Fetch all related data in parallel
  const [weekRes, profileRes, couplesRes, dumpingsRes] = await Promise.all([
    supabase.from("weeks").select("week_number").eq("id", pred.week_id).single(),
    supabase.from("profiles").select("display_name").eq("id", pred.user_id).single(),
    supabase.from("predicted_couples").select("islander_1_id, islander_2_id").eq("prediction_id", pred.id),
    supabase.from("predicted_dumpings").select("islander_id").eq("prediction_id", pred.id),
  ]);

  const weekNumber = (weekRes.data as { week_number: number } | null)?.week_number ?? 0;
  const displayName = (profileRes.data as { display_name: string | null } | null)?.display_name ?? "Anonymous";

  // Get islander names
  const coupleData = (couplesRes.data || []) as { islander_1_id: number; islander_2_id: number }[];
  const dumpingData = (dumpingsRes.data || []) as { islander_id: number }[];

  const allIslanderIds = [
    ...coupleData.flatMap((c) => [c.islander_1_id, c.islander_2_id]),
    ...dumpingData.map((d) => d.islander_id),
  ];

  const { data: islandersData } = await supabase
    .from("islanders")
    .select("id, name")
    .in("id", allIslanderIds);

  const nameMap = new Map(
    ((islandersData || []) as { id: number; name: string }[]).map((i) => [i.id, i.name])
  );
  const getName = (id: number) => nameMap.get(id) ?? `#${id}`;

  const couples = coupleData.map((c) => ({
    name1: getName(c.islander_1_id),
    name2: getName(c.islander_2_id),
  }));

  const dumpings = dumpingData.map((d) => getName(d.islander_id));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #e11d48 0%, #ec4899 30%, #f97316 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            Couple Up
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "rgba(255,255,255,0.7)",
              marginLeft: "auto",
            }}
          >
            Love Island USA S8
          </div>
        </div>

        {/* Main card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.95)",
            borderRadius: "32px",
            padding: "48px",
            flex: 1,
            gap: "24px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                fontSize: "40px",
                fontWeight: 800,
                color: "#1f2937",
              }}
            >
              Week {weekNumber} Predictions
            </div>
            <div style={{ fontSize: "24px", color: "#9ca3af" }}>
              by {displayName}
            </div>
          </div>

          {/* Couples */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Predicted Couples
            </div>
            {couples.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "28px",
                  color: "#1f2937",
                }}
              >
                <span style={{ fontWeight: 700 }}>{c.name1}</span>
                <span style={{ color: "#e11d48", fontSize: "24px" }}>
                  &#10084;&#65039;
                </span>
                <span style={{ fontWeight: 700 }}>{c.name2}</span>
              </div>
            ))}
          </div>

          {/* Dumpings */}
          {dumpings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Predicted Dumpings
              </div>
              {dumpings.map((name, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "26px",
                    color: "#dc2626",
                  }}
                >
                  <span>&#128683;</span>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
            fontSize: "22px",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          Play along at coupleup.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
