import { db } from "@/lib/db";

export type InteractionDetail = {
  id: string;
  contactId: string;
  eventId: string | null;
  interactionTime: Date;
  meetingContext: string | null;
  userNotes: string | null;
  aiSummary: string | null;
  nextAction: string | null;
  outcome: string | null;
};

export type CreateInteractionNoteInput = {
  contactId: string;
  meetingContext?: string;
  userNotes: string;
};

export async function createInteractionNote(
  input: CreateInteractionNoteInput,
  userId: string,
): Promise<InteractionDetail> {
  const contact = await db.contact.findFirst({
    where: { id: input.contactId, userId },
    select: { id: true, eventId: true },
  });
  if (!contact) throw new Error("Contact not found");

  const interaction = await db.interaction.create({
    data: {
      userId,
      contactId: contact.id,
      eventId: contact.eventId,
      meetingContext: input.meetingContext?.trim() || null,
      userNotes: input.userNotes.trim(),
    },
  });

  return {
    id: interaction.id,
    contactId: interaction.contactId,
    eventId: interaction.eventId,
    interactionTime: interaction.interactionTime,
    meetingContext: interaction.meetingContext,
    userNotes: interaction.userNotes,
    aiSummary: interaction.aiSummary,
    nextAction: interaction.nextAction,
    outcome: interaction.outcome,
  };
}
