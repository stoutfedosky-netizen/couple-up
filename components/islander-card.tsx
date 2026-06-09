import type { Islander } from "@/types/database";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          Active
        </span>
      );
    case "dumped":
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
          Dumped
        </span>
      );
    case "bombshell":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          Bombshell
        </span>
      );
    default:
      return null;
  }
}

export function IslanderCard({ islander }: { islander: Islander }) {
  const initials = getInitials(islander.name);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gray-100 transition-all hover:shadow-lg hover:-translate-y-0.5">
      {/* Top gradient bar */}
      <div className="h-2 bg-gradient-to-r from-rose-400 via-pink-400 to-orange-300" />

      <div className="flex flex-col items-center px-3 pb-4 pt-4">
        {/* Avatar */}
        {islander.photo_url ? (
          <img
            src={islander.photo_url}
            alt={islander.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-rose-200 sm:h-20 sm:w-20"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-300 text-lg font-bold text-white ring-2 ring-rose-200 sm:h-20 sm:w-20 sm:text-xl">
            {initials}
          </div>
        )}

        {/* Info */}
        <h3 className="mt-3 text-center text-sm font-bold text-gray-900 leading-tight sm:text-base">
          {islander.name}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          {islander.age} &middot; {islander.hometown}
        </p>

        {/* Status */}
        <div className="mt-2">{statusBadge(islander.status)}</div>
      </div>
    </div>
  );
}
