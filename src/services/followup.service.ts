import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLLMClient } from "@/ai/client";
import {
  FollowUpOutputSchema,
  type FollowUpOutput,
} from "@/ai/schemas/followup.schema";
import {
  buildFollowUpPrompt,
  FOLLOWUP_PROMPT_VERSION,
} from "@/ai/prompts/followup";
import { startAgentRun, completeAgentRun } from "@/services/agent-run.service";

export type GenerateFollowUpResult = {
  followUpId: string;
  agentRunId: string;
  draft: FollowUpOutput;
};

type ContactForFollowUp = {
  fullName: string | null;
  title: string | null;
  company: string | null;
};

/**
 * Produces the mock draft payload. Deterministic, no network, no API key.
 * Uses only confirmed contact/sender fields plus the supplied meeting note.
 * Returns an object the mock LLM client echoes back as JSON text, which the
 * service then Zod-validates.
 */
export function buildMockDraft(
  contact: ContactForFollowUp,
  senderName: string,
  meetingNote: string
): FollowUpOutput {
  const firstName = (contact.fullName ?? "there").split(" ")[0] || "there";
  const normalizedNote = meetingNote.trim();
  const noteSnippet =
    normalizedNote.length > 240
      ? `${normalizedNote.slice(0, 237)}...`
      : normalizedNote;

  const subject = `Following up on our conversation, ${firstName}`;

  const body = [
    `Hi ${firstName},`,
    "",
    "Thank you for connecting. I wanted to follow up on our conversation" +
      (noteSnippet ? ` about: "${noteSnippet}".` : "."),
    "",
    "I appreciated the chance to connect and wanted to keep this follow-up anchored to what we discussed.",
    "",
    `Warm regards,`,
    senderName,
  ].join("\n");

  return {
    subject,
    body,
    suggestedTone: "professional",
    // Enforced as a literal in the schema — a follow-up is always a draft.
    requiresUserReview: true,
  };
}

/**
 * Generates a follow-up draft for a contact from a meeting note.
 *
 * Pipeline: load contact -> start AgentRun -> mock LLM -> Zod validate ->
 * save FollowUp draft -> complete AgentRun. Never sends anything externally.
 */
export async function generateFollowUp(
  contactId: string,
  meetingNote: string
): Promise<GenerateFollowUpResult> {
  const normalizedMeetingNote = meetingNote.trim();
  if (!normalizedMeetingNote) {
    throw new Error("meetingNote is required");
  }

  const user = await getCurrentUser();

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId: user.id },
    select: { id: true, fullName: true, title: true, company: true },
  });

  if (!contact) {
    throw new Error(`Contact not found: ${contactId}`);
  }

  const messages = buildFollowUpPrompt({
    contactName: contact.fullName ?? "the contact",
    contactTitle: contact.title,
    contactCompany: contact.company,
    meetingNote: normalizedMeetingNote,
    senderName: user.name,
  });

  const inputJson = {
    contactId,
    meetingNote: normalizedMeetingNote,
    messages,
  };

  const agentRunId = await startAgentRun({
    userId: user.id,
    taskType: "followup_draft",
    agentType: "ai-workflow-engineer",
    modelName: "mock",
    promptVersion: FOLLOWUP_PROMPT_VERSION,
    inputJson,
  });

  const startedAt = Date.now();

  try {
    const mockDraft = buildMockDraft(contact, user.name, normalizedMeetingNote);

    const llm = getLLMClient();
    const completion = await llm.complete({
      task: "followup_draft",
      messages,
      context: { mockResponse: mockDraft },
    });

    // Parse the model output and validate. requiresUserReview MUST be true.
    const parsed: unknown = JSON.parse(completion.text);
    const draft = FollowUpOutputSchema.parse(parsed);

    const followUp = await db.followUp.create({
      data: {
        userId: user.id,
        contactId: contact.id,
        subject: draft.subject,
        draftText: draft.body,
        status: "drafted",
        userApproved: false,
      },
      select: { id: true },
    });

    const latencyMs = Date.now() - startedAt;

    await completeAgentRun(agentRunId, {
      outputJson: draft,
      status: "success",
      latencyMs,
      tokenInput: completion.tokenInput,
      tokenOutput: completion.tokenOutput,
    });

    return {
      followUpId: followUp.id,
      agentRunId,
      draft,
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    await completeAgentRun(agentRunId, {
      outputJson: { error: message },
      status: "error",
      latencyMs,
      errorMessage: message,
    });

    throw error;
  }
}
