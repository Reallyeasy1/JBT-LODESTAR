import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { listContactsForEvent } from "@/services/contact.service";

const ContactQuerySchema = z.object({
  eventId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const parsed = ContactQuerySchema.safeParse({
    eventId: request.nextUrl.searchParams.get("eventId"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "eventId is required", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const user = await getCurrentUser();
  const contacts = await listContactsForEvent(parsed.data.eventId, user.id);
  return NextResponse.json({ contacts });
}
