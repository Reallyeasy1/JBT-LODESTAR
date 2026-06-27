import { rankContacts } from "@/services/ranking.service";
import { generateBriefing } from "@/services/briefing.service";
import { generateLocalisation } from "@/services/localisation.service";
import { generateFollowUp } from "@/services/followup.service";
import type { RankingOutput } from "@/ai/schemas/ranking.schema";
import type { BriefingOutput } from "@/ai/schemas/briefing.schema";
import type { LocalisationOutput } from "@/ai/schemas/localisation.schema";
import type { FollowUpOutput } from "@/ai/schemas/followup.schema";

export type OrchestratorTask =
  | { type: "rank_contacts"; eventId: string; requestedGoal?: string; userId: string }
  | { type: "generate_briefing"; contactId: string; userId: string }
  | { type: "generate_localisation"; contactId: string; requestedLanguage?: string; userId: string }
  | { type: "draft_followup"; contactId: string; interactionId?: string; meetingNote: string; userId: string };

export type OrchestratorOutput = RankingOutput | BriefingOutput | LocalisationOutput | FollowUpOutput;

// Bounded delegation only: each specialist service owns its own AgentRun lifecycle
// and all DB writes. The orchestrator never mutates the DB and never loops.
export async function runTask(task: OrchestratorTask): Promise<OrchestratorOutput> {
  switch (task.type) {
    case "rank_contacts":
      return rankContacts(task.eventId, task.requestedGoal, task.userId);
    case "generate_briefing":
      return generateBriefing(task.contactId, task.userId);
    case "generate_localisation":
      return generateLocalisation(task.contactId, task.requestedLanguage, task.userId);
    case "draft_followup":
      return generateFollowUp(
        { contactId: task.contactId, interactionId: task.interactionId, meetingNote: task.meetingNote },
        task.userId,
      );
    default: {
      const _exhaustive: never = task;
      throw new Error(`Unknown task type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
