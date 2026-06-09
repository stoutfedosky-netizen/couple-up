import { createClient } from "@/lib/supabase/server";
import { getWeekResults } from "@/lib/queries/results";
import { ResultsClient } from "./results-client";
import Link from "next/link";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ weekNumber: string }>;
}) {
  const { weekNumber } = await params;
  const weekNum = parseInt(weekNumber, 10);

  if (isNaN(weekNum)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-white/70">Invalid week number.</p>
      </div>
    );
  }

  const results = await getWeekResults(weekNum);

  if (!results) {
    return (
      <div className="px-4 pt-8 pb-8">
        <div className="mx-auto max-w-lg text-center space-y-4">
          <p className="text-4xl">&#128064;</p>
          <h1 className="text-xl font-bold text-white drop-shadow-md">
            Week {weekNum} Results
          </h1>
          <p className="text-white/70">
            This week hasn&apos;t been resolved yet. Stay tuned!
          </p>
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-pink-400"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ResultsClient
      results={results}
      currentUserId={user!.id}
    />
  );
}
