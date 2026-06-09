"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserLeagueInfo, LeaderboardEntry } from "@/lib/queries/leaderboard";
import {
  createLeagueAction,
  joinLeagueAction,
  removeMemberAction,
  deleteLeagueAction,
  leaveLeagueAction,
} from "./actions";
import { LeaderboardRow } from "./leaderboard-row";

export function MyLeagues({
  leagues,
  currentUserId,
  selectedLeagueId,
}: {
  leagues: UserLeagueInfo[];
  currentUserId: string;
  selectedLeagueId: string | null;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const router = useRouter();

  // If a league is selected, show its detail view
  if (selectedLeagueId) {
    const league = leagues.find((l) => l.leagueId === selectedLeagueId);
    if (league) {
      return (
        <LeagueDetail
          league={league}
          currentUserId={currentUserId}
          onBack={() => router.push("/leaderboard?tab=leagues")}
        />
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setShowJoin(false);
          }}
          className="flex-1 rounded-lg bg-pink-500 py-2.5 text-sm font-bold text-white hover:bg-pink-400"
        >
          Create a League
        </button>
        <button
          onClick={() => {
            setShowJoin(!showJoin);
            setShowCreate(false);
          }}
          className="flex-1 rounded-lg border border-white/30 py-2.5 text-sm font-bold text-white hover:bg-white/10"
        >
          Join a League
        </button>
      </div>

      {showCreate && (
        <CreateLeagueForm onDone={() => setShowCreate(false)} />
      )}
      {showJoin && <JoinLeagueForm onDone={() => setShowJoin(false)} />}

      {/* League list */}
      {leagues.length === 0 ? (
        <p className="text-center text-white/70 py-12">
          You haven&apos;t joined any leagues yet. Create one or enter an invite code.
        </p>
      ) : (
        <div className="space-y-2">
          {leagues.map((league) => (
            <button
              key={league.leagueId}
              onClick={() =>
                router.push(
                  `/leaderboard?tab=leagues&league=${league.leagueId}`
                )
              }
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left hover:shadow-md transition-all"
            >
              {/* League crest */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-orange-300 text-lg font-bold text-white">
                {league.leagueName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {league.leagueName}
                </p>
                <p className="text-xs text-gray-400">
                  {league.memberCount} member
                  {league.memberCount !== 1 ? "s" : ""}
                  {league.isCreator && " · Creator"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  #{league.userRank || "—"}
                </p>
                <p className="text-[10px] text-gray-400">your rank</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create League ───

function CreateLeagueForm({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    inviteCode: string;
  } | null>(null);

  if (result) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
        <p className="text-sm font-bold text-emerald-800">
          League created!
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Invite Code:</span>
          <code className="rounded bg-white px-3 py-1 text-lg font-mono font-bold tracking-widest text-gray-900 border">
            {result.inviteCode}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.inviteCode);
            }}
            className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
          >
            Copy
          </button>
        </div>
        <button
          onClick={onDone}
          className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          const res = await createLeagueAction(formData);
          setResult({ inviteCode: res.inviteCode });
        } catch (err) {
          alert(err instanceof Error ? err.message : "Failed");
        } finally {
          setPending(false);
        }
      }}
      className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
    >
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          League Name
        </label>
        <input
          name="name"
          required
          maxLength={40}
          placeholder="e.g., Villa Watchers"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-bold text-white hover:bg-pink-400 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Join League ───

function JoinLeagueForm({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleJoin() {
    if (!code.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await joinLeagueAction(code);
      setSuccess(`Joined "${res.leagueName}"!`);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Invite Code
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="e.g., AB3XY7"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 font-mono tracking-widest text-center placeholder-gray-400 focus:border-rose-500 focus:outline-none uppercase"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm font-semibold text-emerald-600">{success}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleJoin}
          disabled={pending || code.length < 6}
          className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-bold text-white hover:bg-pink-400 disabled:opacity-50"
        >
          {pending ? "Joining..." : "Join"}
        </button>
        <button
          onClick={onDone}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── League Detail ───

function LeagueDetail({
  league,
  currentUserId,
  onBack,
}: {
  league: UserLeagueInfo;
  currentUserId: string;
  onBack: () => void;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManage, setShowManage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/league-leaderboard?leagueId=${league.leagueId}`)
      .then((res) => res.json())
      .then((data) => setEntries(data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [league.leagueId]);

  async function handleShare() {
    const shareData = {
      title: `Join ${league.leagueName} on Couple Up!`,
      text: `Join my Love Island prediction league! Code: ${league.inviteCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(league.inviteCode);
      alert("Invite code copied!");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this league?")) return;
    if (
      !confirm(
        "This cannot be undone. All members will lose access. Delete?"
      )
    )
      return;
    await deleteLeagueAction(league.leagueId);
    router.push("/leaderboard?tab=leagues");
  }

  async function handleLeave() {
    if (!confirm("Leave this league?")) return;
    await leaveLeagueAction(league.leagueId);
    router.push("/leaderboard?tab=leagues");
  }

  async function handleRemove(userId: string, name: string | null) {
    if (!confirm(`Remove ${name || "this member"}?`)) return;
    await removeMemberAction(league.leagueId, userId);
    setEntries((prev) => prev.filter((e) => e.userId !== userId));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white drop-shadow-md">
            {league.leagueName}
          </h2>
          <p className="text-xs text-white/60">
            {league.memberCount} members
          </p>
        </div>
      </div>

      {/* Invite code + share */}
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
        <span className="text-xs text-gray-500">Code:</span>
        <code className="font-mono font-bold text-sm tracking-widest text-gray-900">
          {league.inviteCode}
        </code>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => navigator.clipboard.writeText(league.inviteCode)}
            className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 border hover:bg-gray-100"
          >
            Copy
          </button>
          <button
            onClick={handleShare}
            className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-500"
          >
            Share
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-white/70 py-8">
          No scores yet.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.userId} className="relative">
              <LeaderboardRow
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
                showMovement={false}
              />
              {showManage &&
                league.isCreator &&
                entry.userId !== currentUserId && (
                  <button
                    onClick={() =>
                      handleRemove(entry.userId, entry.displayName)
                    }
                    className="absolute top-2 right-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 hover:bg-red-200"
                  >
                    Remove
                  </button>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Manage buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        {league.isCreator && (
          <>
            <button
              onClick={() => setShowManage(!showManage)}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {showManage ? "Done Managing" : "Manage Members"}
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-200 py-2 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Delete League
            </button>
          </>
        )}
        {!league.isCreator && (
          <button
            onClick={handleLeave}
            className="rounded-lg border border-gray-200 py-2 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Leave League
          </button>
        )}
      </div>
    </div>
  );
}
