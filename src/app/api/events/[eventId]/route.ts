import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/services/event.service";

type EventRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(_request: Request, context: EventRouteContext) {
  const { eventId } = await context.params;
  const user = await getCurrentUser();
  const event = await getEventById(eventId, user.id);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}
