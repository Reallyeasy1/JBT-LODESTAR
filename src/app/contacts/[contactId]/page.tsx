import Link from "next/link";
import { notFound } from "next/navigation";
import type { BriefingCardData } from "@/components/briefings/BriefingCard";
import { ContactActionPanel } from "@/components/contacts/ContactActionPanel";
import { ContactProfile } from "@/components/contacts/ContactProfile";
import type { FollowUpDraftData } from "@/components/followups/FollowUpDraftButton";
import { getCurrentUser } from "@/lib/auth";
import { ContactBriefingRecord, ContactFollowUpRecord, getContactById } from "@/services/contact.service";

function toBriefingData(briefing: ContactBriefingRecord | null): BriefingCardData | null {
  if (!briefing) return null;
  return {
    ...briefing,
    createdAt: briefing.createdAt.toISOString(),
  };
}

function toFollowUpData(followUp: ContactFollowUpRecord | null): FollowUpDraftData | null {
  if (!followUp) return null;
  return {
    id: followUp.id,
    subject: followUp.subject,
    draftText: followUp.draftText,
    status: followUp.status,
    recommendedTiming: followUp.recommendedTiming,
    userApproved: followUp.userApproved,
    requiresUserReview: true,
    createdAt: followUp.createdAt.toISOString(),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ contactId: string }> }) {
  const user = await getCurrentUser();
  const { contactId } = await params;
  const contact = await getContactById(contactId, user.id);
  if (!contact) notFound();

  return (
    <main className="min-h-dvh bg-[#f5f1e8] text-emerald-950">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <nav className="mb-6 flex items-center justify-between gap-3" aria-label="Page navigation">
          <Link href="/" className="flex items-center gap-2 font-black tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-950 text-amber-300">✦</span>
            Lodestar
          </Link>
          {contact.event && (
            <Link
              href={`/events/${contact.event.id}`}
              className="rounded-full border border-stone-300 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-600"
            >
              Event
            </Link>
          )}
        </nav>

        <ContactProfile contact={contact} />

        <section className="mt-5">
          <ContactActionPanel
            contactId={contact.id}
            languages={contact.languages}
            initialBriefing={toBriefingData(contact.latestBriefing)}
            initialLocalisation={contact.latestLocalisation
              ? {
                  ...contact.latestLocalisation,
                  createdAt: contact.latestLocalisation.createdAt.toISOString(),
                }
              : null}
            initialFollowUp={toFollowUpData(contact.latestFollowUp)}
            recentInteractions={contact.recentInteractions.map((interaction) => ({
              id: interaction.id,
              interactionTime: interaction.interactionTime.toISOString(),
              meetingContext: interaction.meetingContext,
              userNotes: interaction.userNotes,
            }))}
          />
        </section>
      </div>
    </main>
  );
}
