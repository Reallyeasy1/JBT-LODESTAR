import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/services/event.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getCurrentUser();
  const { eventId } = await params;
  const event = await getEventById(eventId, user.id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(event);
}
