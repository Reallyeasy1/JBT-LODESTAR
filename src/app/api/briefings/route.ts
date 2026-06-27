import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateBriefing, getLatestBriefingForContact } from "@/services/briefing.service";

const BriefingRequestSchema = z.object({
  contactId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const contactId = request.nextUrl.searchParams.get("contactId");
  if (!contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const briefing = await getLatestBriefingForContact(contactId, user.id);
    return NextResponse.json({ briefing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load briefing";
    return NextResponse.json({ error: message }, { status: message === "Contact not found" ? 404 : 422 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BriefingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid briefing request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const result = await generateBriefing(parsed.data.contactId, user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate briefing";
    return NextResponse.json({ error: message }, { status: message === "Contact not found" ? 404 : 422 });
  }
}
