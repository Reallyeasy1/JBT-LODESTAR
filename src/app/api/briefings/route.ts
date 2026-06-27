import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateBriefing } from "@/services/briefing.service";

export const runtime = "nodejs";

const RequestSchema = z.object({
  contactId: z.string().min(1),
});

/**
 * POST /api/briefings
 * Body: { contactId: string }
 * Generates a structured, verified contact briefing, saves it as a Briefing
 * record, and returns the briefing JSON. Works with no API key (mock LLM).
 */
export async function POST(request: Request) {
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
    const user = await getCurrentUser();
    const result = await generateBriefing({
      contactId: parsed.data.contactId,
      userId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Contact not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
