import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateFollowUp } from "@/services/followup.service";

const GenerateFollowUpRequestSchema = z.object({
  contactId: z.string().min(1),
  interactionId: z.string().min(1).optional(),
  meetingNote: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = GenerateFollowUpRequestSchema.parse(await request.json());
    const result = await generateFollowUp({
      contactId: body.contactId,
      interactionId: body.interactionId,
      meetingNote: body.meetingNote,
      userId: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid follow-up request", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate follow-up" },
      { status: 500 }
    );
  }
}
