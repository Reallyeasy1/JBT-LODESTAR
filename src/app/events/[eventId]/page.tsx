import { EventDashboard } from "@/components/events/EventDashboard";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;

  return <EventDashboard eventId={eventId} />;
}
