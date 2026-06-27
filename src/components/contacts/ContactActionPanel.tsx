"use client";

import { useMemo, useState } from "react";
import { BriefingCard, type BriefingCardData } from "@/components/briefings/BriefingCard";
import {
  FollowUpDraftButton,
  type FollowUpDraftData,
} from "@/components/followups/FollowUpDraftButton";

type LocalisationData = {
  id?: string;
  localisationId?: string;
  openerText: string | null;
  languageUsed: string | null;
  confidenceScore: number | null;
  warnings: string[];
  createdAt?: string;
};

type InteractionData = {
  id: string;
  interactionTime: string;
  meetingContext: string | null;
  userNotes: string | null;
};

type ErrorResponse = {
  error?: string;
};

function formatConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Unknown";
  return `${Math.round(value)}%`;
}

export function ContactActionPanel({
  contactId,
  languages,
  initialBriefing,
  initialLocalisation,
  initialFollowUp,
  recentInteractions,
}: {
  contactId: string;
  languages: string[];
  initialBriefing: BriefingCardData | null;
  initialLocalisation: LocalisationData | null;
  initialFollowUp: FollowUpDraftData | null;
  recentInteractions: InteractionData[];
}) {
  const [briefing, setBriefing] = useState(initialBriefing);
  const [localisation, setLocalisation] = useState(initialLocalisation);
  const [followUp, setFollowUp] = useState(initialFollowUp);
  const [interactions, setInteractions] = useState(recentInteractions);
  const [meetingNote, setMeetingNote] = useState(recentInteractions[0]?.userNotes ?? "");
  const [savedInteractionId, setSavedInteractionId] = useState(recentInteractions[0]?.id);
  const [briefingError, setBriefingError] = useState("");
  const [introError, setIntroError] = useState("");
  const [noteError, setNoteError] = useState("");
  const [isBriefingPending, setIsBriefingPending] = useState(false);
  const [isIntroPending, setIsIntroPending] = useState(false);
  const [isNotePending, setIsNotePending] = useState(false);

  const supportsJapanese = useMemo(
    () => languages.some((language) => language.toLowerCase() === "japanese"),
    [languages],
  );

  async function generateBriefing() {
    setIsBriefingPending(true);
    setBriefingError("");
    try {
      const response = await fetch("/api/briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const payload = (await response.json()) as BriefingCardData & ErrorResponse;
      if (!response.ok || !payload.personSummary) {
        throw new Error(payload.error ?? "Briefing could not be generated");
      }
      setBriefing({ ...payload, id: payload.briefingId ?? payload.id, createdAt: new Date().toISOString() });
    } catch (caught) {
      setBriefingError(caught instanceof Error ? caught.message : "Briefing could not be generated");
    } finally {
      setIsBriefingPending(false);
    }
  }

  async function generateJapaneseIntro() {
    setIsIntroPending(true);
    setIntroError("");
    try {
      const response = await fetch("/api/localisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, language: "Japanese" }),
      });
      const payload = (await response.json()) as LocalisationData & ErrorResponse;
      if (!response.ok || !payload.openerText) {
        throw new Error(payload.error ?? "Intro could not be generated");
      }
      setLocalisation({ ...payload, id: payload.localisationId ?? payload.id, createdAt: new Date().toISOString() });
    } catch (caught) {
      setIntroError(caught instanceof Error ? caught.message : "Intro could not be generated");
    } finally {
      setIsIntroPending(false);
    }
  }

  async function saveMeetingNote() {
    setIsNotePending(true);
    setNoteError("");
    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          meetingContext: "Event conversation",
          userNotes: meetingNote,
        }),
      });
      const payload = (await response.json()) as { interaction?: InteractionData } & ErrorResponse;
      if (!response.ok || !payload.interaction) {
        throw new Error(payload.error ?? "Meeting note could not be saved");
      }
      setSavedInteractionId(payload.interaction.id);
      setInteractions((current) => [payload.interaction!, ...current.filter((item) => item.id !== payload.interaction!.id)].slice(0, 5));
    } catch (caught) {
      setNoteError(caught instanceof Error ? caught.message : "Meeting note could not be saved");
    } finally {
      setIsNotePending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Briefing</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-950">Prepare for the conversation</h2>
          </div>
          <button
            type="button"
            onClick={generateBriefing}
            disabled={isBriefingPending}
            className="min-h-11 rounded-2xl bg-emerald-950 px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
          >
            {briefing ? "Regenerate Briefing" : isBriefingPending ? "Generating…" : "Generate Briefing"}
          </button>
        </div>
        {briefingError && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{briefingError}</p>}
      </div>

      {briefing ? (
        <BriefingCard briefing={briefing} />
      ) : (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-5 text-sm text-stone-600">
          No briefing yet. Generate one to see summary, talking points, questions, and cultural notes.
        </div>
      )}

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Localised opener</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-950">Generate Intro (Japanese)</h2>
          </div>
          <button
            type="button"
            onClick={generateJapaneseIntro}
            disabled={!supportsJapanese || isIntroPending}
            className="min-h-11 rounded-2xl bg-emerald-950 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isIntroPending ? "Generating…" : "Generate Intro (Japanese)"}
          </button>
        </div>
        {!supportsJapanese && (
          <p className="mt-3 text-sm text-stone-500">Japanese is not listed in this contact profile, so this action is disabled.</p>
        )}
        {introError && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{introError}</p>}
        {localisation && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
              {localisation.languageUsed ?? "Generated opener"} · {formatConfidence(localisation.confidenceScore)}
            </p>
            <p className="mt-2 text-lg font-black leading-7 text-emerald-950">{localisation.openerText}</p>
            {localisation.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs leading-5 text-stone-600">
                {localisation.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Interaction notes</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-950">Add Meeting Note</h2>
        <textarea
          value={meetingNote}
          onChange={(event) => setMeetingNote(event.target.value)}
          rows={5}
          className="mt-4 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-emerald-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          placeholder="Write the confirmed note you want Lodestar to remember..."
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveMeetingNote}
            disabled={meetingNote.trim().length < 3 || isNotePending}
            className="min-h-11 rounded-2xl bg-emerald-950 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isNotePending ? "Saving…" : "Save Meeting Note"}
          </button>
          {savedInteractionId && <span className="text-xs font-bold text-emerald-800">Saved to Interaction</span>}
        </div>
        {noteError && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{noteError}</p>}
        {interactions.length > 0 && (
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-black text-emerald-950">Recent notes</h3>
            {interactions.map((interaction) => (
              <p key={interaction.id} className="rounded-2xl bg-stone-50 p-3 text-sm leading-6 text-stone-700">
                {interaction.userNotes}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Follow-up draft</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-950">Draft, review, then send manually</h2>
          </div>
          <FollowUpDraftButton
            contactId={contactId}
            interactionId={savedInteractionId}
            meetingNote={meetingNote}
            onDraft={setFollowUp}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Lodestar only drafts copy. It does not send messages automatically.
        </p>
        {followUp && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-black text-emerald-950">{followUp.subject ?? "Follow-up draft"}</h3>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-900">
                Draft — Review Before Sending
              </span>
            </div>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-stone-700">{followUp.draftText}</pre>
            {followUp.recommendedTiming && (
              <p className="mt-3 text-xs font-bold text-stone-600">Recommended timing: {followUp.recommendedTiming}</p>
            )}
            {followUp.reasoning && (
              <p className="mt-2 text-xs leading-5 text-stone-600">Reasoning: {followUp.reasoning}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
