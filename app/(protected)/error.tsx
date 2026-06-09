"use client";

export default function ProtectedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <p className="text-5xl mb-4">&#128533;</p>
      <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
      <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">
        We hit an unexpected error. Try refreshing, or head back to the
        dashboard.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={reset}
          className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-500"
        >
          Try Again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
