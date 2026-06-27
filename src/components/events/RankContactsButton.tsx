"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RankContactsButton({ eventId, goalText }: { eventId: string; goalText: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function rankContacts() {
    setIsPending(true);
    setError("");
    try {
      const response = await fetch("/api/rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, goalText }),
      });
      const payload = (await response.json()) as { rankingId?: string; error?: string };
      if (!response.ok || !payload.rankingId) {
        throw new Error(payload.error ?? "Ranking could not be completed");
      }
      router.push(`/rankings/${payload.rankingId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ranking could not be completed");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={rankContacts}
        disabled={isPending}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        <span aria-hidden="true">✦</span>
        {isPending ? "Ranking contacts…" : "Rank Top Contacts"}
        {!isPending && <span aria-hidden="true">→</span>}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
    </div>
  );
}
