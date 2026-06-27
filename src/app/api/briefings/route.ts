import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateBriefing } from "@/services/briefing.service";

const GenerateBriefingRequestSchema = z.object({
  contactId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = GenerateBriefingRequestSchema.parse(await request.json());
    const briefing = await generateBriefing(body.contactId, user.id);

    return NextResponse.json({ briefing }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid briefing request", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
