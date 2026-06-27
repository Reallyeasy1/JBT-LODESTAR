import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import {
  generateBriefing,
  type GenerateBriefingParams,
  type GenerateBriefingResult,
} from "@/services/briefing.service";

export const runtime = "nodejs";

const RequestSchema = z.object({
  contactId: z.string().min(1),
});

export type BriefingsPostHandlerDeps = {
  getCurrentUser: () => Promise<CurrentUser>;
  generateBriefing: (
    params: GenerateBriefingParams
  ) => Promise<GenerateBriefingResult>;
};

/**
 * POST /api/briefings
 * Body: { contactId: string }
 * Generates a structured, verified contact briefing, saves it as a Briefing
 * record, and returns the briefing JSON. Works with no API key (mock LLM).
 */
export function createBriefingsPostHandler(deps: BriefingsPostHandlerDeps) {
  return async function postBriefings(request: Request): Promise<Response> {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const user = await deps.getCurrentUser();
      const result = await deps.generateBriefing({
        contactId: parsed.data.contactId,
        userId: user.id,
      });
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const status = message.startsWith("Contact not found") ? 404 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  };
}

export const POST = createBriefingsPostHandler({
  getCurrentUser,
  generateBriefing,
});
