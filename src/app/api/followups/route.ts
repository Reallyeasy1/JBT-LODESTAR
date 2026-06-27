import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFollowUp } from "@/services/followup.service";

export const runtime = "nodejs";

const RequestSchema = z.object({
  contactId: z.string().min(1),
  meetingNote: z.string().min(1, "meetingNote is required"),
});

/**
 * POST /api/followups
 * Body: { contactId: string, meetingNote: string }
 * Generates a follow-up DRAFT and returns it. Never sends anything.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await generateFollowUp(
      parsed.data.contactId,
      parsed.data.meetingNote
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Contact not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
