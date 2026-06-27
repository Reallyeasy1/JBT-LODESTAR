import { db } from "@/lib/db";

export type ContactListRecord = {
  id: string;
  fullName: string | null;
  title: string | null;
  company: string | null;
  sourceType: string | null;
  sourceConfidence: number | null;
  tags: string[];
};

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function listContactsForEvent(
  eventId: string,
  userId: string,
): Promise<ContactListRecord[]> {
  const contacts = await db.contact.findMany({
    where: { eventId, userId },
    orderBy: [{ createdAt: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      title: true,
      company: true,
      sourceType: true,
      sourceConfidence: true,
      tags: true,
    },
  });
  return contacts.map((contact) => ({ ...contact, tags: stringList(contact.tags) }));
}
