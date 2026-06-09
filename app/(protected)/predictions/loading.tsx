import { CardSkeleton } from "@/components/skeleton";

export default function PredictionsLoading() {
  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mx-auto max-w-lg space-y-3">
        <div className="animate-pulse h-8 w-40 rounded-lg bg-gray-200 mb-6" />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
