import { notFound } from "next/navigation";
import { EventDashboard } from "@/components/events/EventDashboard";
import { getCurrentUser } from "@/lib/auth";
import { listContactsForEvent } from "@/services/contact.service";
import { getEventById } from "@/services/event.service";

type EventPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  const event = await getEventById(eventId, user.id);

  if (!event) {
    notFound();
  }

  const contacts = await listContactsForEvent(event.id, user.id);

  return <EventDashboard event={event} contacts={contacts} />;
}
