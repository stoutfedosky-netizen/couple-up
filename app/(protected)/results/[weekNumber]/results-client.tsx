"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { WeekResults } from "@/lib/queries/results";
import { addCommentAction, deleteCommentAction } from "./actions";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ResultsClient({
  results,
  currentUserId,
}: {
  results: WeekResults;
  currentUserId: string;
}) {
  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-pink-300 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
            Week {results.week.week_number} Results
          </h1>
          <p className="text-sm text-white/70 mt-1">
            {results.totalPredictions} prediction
            {results.totalPredictions !== 1 ? "s" : ""} submitted
          </p>
        </div>

        {/* Actual Couples */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="text-rose-400 text-lg">&#10084;&#65039;</span>
            Official Couples
          </h2>
          <div className="space-y-2">
            {results.actualCouples.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 px-4 py-3"
              >
                <span className="text-sm font-bold text-gray-900">
                  {c.islander1Name}
                </span>
                <span className="text-rose-400">&hearts;</span>
                <span className="text-sm font-bold text-gray-900">
                  {c.islander2Name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dumpings */}
        {results.actualDumpings.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-lg">&#128683;</span>
              Dumped
            </h2>
            <div className="space-y-2">
              {results.actualDumpings.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3"
                >
                  <span className="text-sm font-bold text-red-700">
                    {d.islanderName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bonus Questions */}
        {results.bonusQuestions.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="text-lg">&#127775;</span>
              Bonus Questions
            </h2>
            <div className="space-y-2">
              {results.bonusQuestions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3"
                >
                  <span className="text-sm text-gray-700 flex-1">
                    {q.question_text}
                  </span>
                  <span
                    className={`ml-2 text-sm font-bold ${
                      q.correct_answer === true
                        ? "text-emerald-600"
                        : q.correct_answer === false
                          ? "text-red-600"
                          : "text-gray-400"
                    }`}
                  >
                    {q.correct_answer === true
                      ? "Yes"
                      : q.correct_answer === false
                        ? "No"
                        : "TBD"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-2">
          <Link
            href="/predictions"
            className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            My Predictions
          </Link>
          <Link
            href="/leaderboard"
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 py-3 text-center text-sm font-bold text-white shadow-md"
          >
            Leaderboard
          </Link>
        </div>

        {/* Comments */}
        <CommentThread
          weekId={results.week.id}
          comments={results.comments}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

// ─── Comment Thread ───

function CommentThread({
  weekId,
  comments: initialComments,
  currentUserId,
}: {
  weekId: number;
  comments: WeekResults["comments"];
  currentUserId: string;
}) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const content = newComment.trim();
    setNewComment("");

    startTransition(async () => {
      try {
        await addCommentAction(weekId, content);
        // Optimistic: add to local state
        setComments((prev) => [
          ...prev,
          {
            id: Date.now(), // temp id
            user_id: currentUserId,
            week_id: weekId,
            content,
            created_at: new Date().toISOString(),
            displayName: "You",
            avatarUrl: null,
          },
        ]);
      } catch {
        setNewComment(content); // restore on error
      }
    });
  }

  function handleDelete(commentId: number) {
    startTransition(async () => {
      await deleteCommentAction(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <span className="text-lg">&#128172;</span>
        Discussion ({comments.length})
      </h2>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* Avatar */}
              {comment.avatarUrl ? (
                <img
                  src={comment.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-300 text-xs font-bold text-white ring-1 ring-gray-200 shrink-0">
                  {getInitials(comment.displayName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {comment.displayName || "Anonymous"}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {timeAgo(comment.created_at)}
                  </span>
                  {comment.user_id === currentUserId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="ml-auto text-[10px] text-gray-400 hover:text-red-500 shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-0.5 break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={500}
          placeholder="Share your thoughts..."
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !newComment.trim()}
          className="rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-pink-400 disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
