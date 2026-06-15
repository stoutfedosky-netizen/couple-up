export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/queries/admin";
import { getAllIslanders, getActiveIslanders } from "@/lib/queries/islanders";
import { getAllWeeks } from "@/lib/queries/weeks";
import { getAllBonusQuestions, getBonusQuestionsForWeek } from "@/lib/queries/admin";
import { getAllDailyBonusQuestions } from "@/lib/queries/daily-bonus";
import { AdminTabs } from "./admin-tabs";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; resolve?: string }>;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/dashboard");

  const params = await searchParams;
  const activeTab = params.tab || "islanders";
  const resolveWeekId = params.resolve ? parseInt(params.resolve, 10) : null;

  const [islanders, activeIslanders, weeks, bonusQuestions, dailyBonusQuestions] =
    await Promise.all([
      getAllIslanders(),
      getActiveIslanders(),
      getAllWeeks(),
      getAllBonusQuestions(),
      getAllDailyBonusQuestions(),
    ]);

  // If resolving a specific week, get its bonus questions
  let resolveWeekBonusQuestions: Awaited<ReturnType<typeof getBonusQuestionsForWeek>> = [];
  if (resolveWeekId) {
    resolveWeekBonusQuestions = await getBonusQuestionsForWeek(resolveWeekId);
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 pt-6 pb-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-extrabold text-white mb-6">
          Admin Panel
        </h1>

        <AdminTabs
          activeTab={activeTab}
          islanders={islanders}
          activeIslanders={activeIslanders}
          weeks={weeks}
          bonusQuestions={bonusQuestions}
          dailyBonusQuestions={dailyBonusQuestions}
          resolveWeekId={resolveWeekId}
          resolveWeekBonusQuestions={resolveWeekBonusQuestions}
        />
      </div>
    </div>
  );
}
