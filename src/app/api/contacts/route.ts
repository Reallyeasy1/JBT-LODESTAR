import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listContactsForEvent } from "@/services/event-dashboard.service";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const contacts = await listContactsForEvent(eventId, user.id);

  return NextResponse.json({ contacts });
}
