"use client";

import { useState } from "react";
import type { Islander, IslanderStatus } from "@/types/database";
import {
  addIslanderAction,
  updateIslanderAction,
  deleteIslanderAction,
} from "./actions";

export function ManageIslanders({ islanders }: { islanders: Islander[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      {/* Add button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
      >
        {showAdd ? "Cancel" : "+ Add Islander"}
      </button>

      {/* Add form */}
      {showAdd && (
        <IslanderForm
          onSubmit={async (formData) => {
            await addIslanderAction(formData);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900 text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Age</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Hometown</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {islanders.map((islander) => (
              <tr key={islander.id} className="bg-gray-950 text-gray-300">
                {editingId === islander.id ? (
                  <td colSpan={5} className="p-4">
                    <IslanderForm
                      islander={islander}
                      onSubmit={async (formData) => {
                        await updateIslanderAction(formData);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-white">
                      {islander.name}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{islander.age}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{islander.hometown}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={islander.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingId(islander.id)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          Edit
                        </button>
                        <form
                          action={deleteIslanderAction}
                          onSubmit={(e) => {
                            if (!confirm(`Delete ${islander.name}?`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={islander.id} />
                          <button
                            type="submit"
                            className="text-red-400 hover:text-red-300 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: IslanderStatus }) {
  const colors: Record<IslanderStatus, string> = {
    active: "bg-emerald-900 text-emerald-300",
    dumped: "bg-red-900 text-red-300",
    bombshell: "bg-amber-900 text-amber-300",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status]}`}
    >
      {status}
    </span>
  );
}

function IslanderForm({
  islander,
  onSubmit,
  onCancel,
}: {
  islander?: Islander;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await onSubmit(formData);
        } finally {
          setPending(false);
        }
      }}
      className="grid grid-cols-2 gap-3 rounded-lg bg-gray-900 p-4"
    >
      {islander && <input type="hidden" name="id" value={islander.id} />}

      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Name
        </label>
        <input
          name="name"
          required
          defaultValue={islander?.name}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Age
        </label>
        <input
          name="age"
          type="number"
          required
          min={18}
          max={99}
          defaultValue={islander?.age}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Hometown
        </label>
        <input
          name="hometown"
          required
          defaultValue={islander?.hometown}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Status
        </label>
        <select
          name="status"
          defaultValue={islander?.status || "active"}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="bombshell">Bombshell</option>
          <option value="dumped">Dumped</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Entered Week
        </label>
        <input
          name="entered_week"
          type="number"
          required
          min={1}
          defaultValue={islander?.entered_week || 1}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
        />
      </div>

      {islander && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Exited Week
          </label>
          <input
            name="exited_week"
            type="number"
            min={1}
            defaultValue={islander.exited_week ?? ""}
            placeholder="Auto-set if dumped"
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-rose-500 focus:outline-none"
          />
        </div>
      )}

      <div className="col-span-2 flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
        >
          {pending ? "Saving..." : islander ? "Update" : "Add Islander"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
