import { db } from "@/lib/db";

export async function getEventForDashboard(eventId: string, userId: string) {
  return db.event.findFirst({
    where: { id: eventId, userId },
    select: {
      id: true,
      name: true,
      location: true,
      startDate: true,
      endDate: true,
      industry: true,
      description: true,
      eventGoal: true,
      tags: true,
      _count: {
        select: { contacts: true },
      },
    },
  });
}

export async function listContactsForEvent(eventId: string, userId: string) {
  return db.contact.findMany({
    where: { eventId, userId },
    orderBy: [{ createdAt: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      title: true,
      company: true,
      email: true,
      languages: true,
      sourceType: true,
      sourceConfidence: true,
      tags: true,
      notes: true,
    },
  });
}
