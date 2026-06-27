"use client";

import { useState } from "react";

export type FollowUpDraftData = {
  id?: string;
  followUpId?: string;
  subject: string | null;
  draftText: string | null;
  status?: string | null;
  recommendedTiming: string | null;
  reasoning?: string | null;
  confidence?: number | null;
  warnings?: string[];
  requiresUserReview?: boolean;
  userApproved?: boolean;
  createdAt?: string;
};

type FollowUpResponse = FollowUpDraftData & {
  error?: string;
};

export function FollowUpDraftButton({
  contactId,
  interactionId,
  meetingNote,
  onDraft,
}: {
  contactId: string;
  interactionId?: string;
  meetingNote: string;
  onDraft: (draft: FollowUpDraftData) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const canDraft = meetingNote.trim().length >= 3;

  async function draftFollowUp() {
    setIsPending(true);
    setError("");
    try {
      const response = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          interactionId,
          meetingNote,
        }),
      });
      const payload = (await response.json()) as FollowUpResponse;
      if (!response.ok || !payload.draftText) {
        throw new Error(payload.error ?? "Follow-up draft could not be generated");
      }
      onDraft({
        ...payload,
        id: payload.followUpId ?? payload.id,
        createdAt: new Date().toISOString(),
        requiresUserReview: true,
        userApproved: false,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Follow-up draft could not be generated");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={draftFollowUp}
        disabled={!canDraft || isPending}
        className="min-h-12 w-full rounded-2xl bg-emerald-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Drafting Follow-Up…" : "Draft Follow-Up"}
      </button>
      {!canDraft && (
        <p className="mt-2 text-xs font-medium text-stone-500">
          Add and save a meeting note first so the draft uses confirmed context.
        </p>
      )}
      {error && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
    </div>
  );
}
