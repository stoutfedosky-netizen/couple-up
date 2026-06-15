export const dynamic = "force-dynamic";

import { getAllIslanders } from "@/lib/queries/islanders";
import { IslanderGrid } from "@/components/islander-grid";

export default async function IslandersPage() {
  const islanders = await getAllIslanders();

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
            The Islanders
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Love Island USA &middot; Season 8
          </p>
        </div>

        <IslanderGrid islanders={islanders} />
      </div>
    </div>
  );
}
