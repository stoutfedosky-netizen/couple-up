import { LeaderboardSkeleton } from "@/components/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mx-auto max-w-lg space-y-5">
        <div className="animate-pulse h-8 w-48 rounded-lg bg-gray-200" />
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          <div className="flex-1 h-9 rounded-lg bg-white" />
          <div className="flex-1 h-9 rounded-lg bg-gray-200" />
          <div className="flex-1 h-9 rounded-lg bg-gray-200" />
        </div>
        <LeaderboardSkeleton />
      </div>
    </div>
  );
}
