import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateFollowUp } from "@/services/followup.service";

const FollowUpRequestSchema = z.object({
  contactId: z.string().min(1),
  interactionId: z.string().min(1).optional(),
  meetingNote: z.string().trim().min(3).max(5000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = FollowUpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid follow-up request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const result = await generateFollowUp(parsed.data, user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate follow-up";
    const status = message.endsWith("not found") ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
