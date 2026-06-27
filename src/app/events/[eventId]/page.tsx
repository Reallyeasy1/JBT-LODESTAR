import { notFound } from "next/navigation";
import { EventDashboard } from "@/components/events/EventDashboard";
import { getCurrentUser } from "@/lib/auth";
import { listContactsForEvent } from "@/services/contact.service";
import { getEventById } from "@/services/event.service";

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await params;
  const [event, contacts] = await Promise.all([
    getEventById(eventId, user.id),
    listContactsForEvent(eventId, user.id),
  ]);
  if (!event) notFound();
  return <EventDashboard event={event} contacts={contacts} />;
}
