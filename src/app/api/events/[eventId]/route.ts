import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventForDashboard } from "@/services/event-dashboard.service";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  const { eventId } = await context.params;

  const event = await getEventForDashboard(eventId, user.id);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}
