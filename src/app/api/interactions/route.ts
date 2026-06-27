import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createInteractionNote } from "@/services/interaction.service";

const InteractionRequestSchema = z.object({
  contactId: z.string().min(1),
  meetingContext: z.string().trim().max(500).optional(),
  userNotes: z.string().trim().min(3).max(5000),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = InteractionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid interaction note", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const interaction = await createInteractionNote(parsed.data, user.id);
    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save meeting note";
    return NextResponse.json({ error: message }, { status: message === "Contact not found" ? 404 : 422 });
  }
}
