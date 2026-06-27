import { db } from "@/lib/db";

export type EventDetail = {
  id: string;
  name: string;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  industry: string | null;
  description: string | null;
  eventGoal: string | null;
  tags: string[];
  contactCount: number;
};

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function getEventById(eventId: string, userId: string): Promise<EventDetail | null> {
  const event = await db.event.findFirst({
    where: { id: eventId, userId },
    include: { _count: { select: { contacts: true } } },
  });
  if (!event) return null;
  return {
    id: event.id,
    name: event.name,
    location: event.location,
    startDate: event.startDate,
    endDate: event.endDate,
    industry: event.industry,
    description: event.description,
    eventGoal: event.eventGoal,
    tags: stringList(event.tags),
    contactCount: event._count.contacts,
  };
}
