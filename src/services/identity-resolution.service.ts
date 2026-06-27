import { db } from "@/lib/db";

type ResolutionResult = "duplicate" | "possible-duplicate" | "new";

type ContactInput = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  company?: string | null;
};

type ResolveContactResult = {
  result: ResolutionResult;
  existingContactId?: string;
  confidence: number;
};

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function resolveContact(
  input: ContactInput,
  userId: string
): Promise<ResolveContactResult> {
  // Exact email match
  if (input.email) {
    const match = await db.contact.findFirst({
      where: { userId, email: input.email },
      select: { id: true },
    });
    if (match) return { result: "duplicate", existingContactId: match.id, confidence: 0.99 };
  }

  // Exact phone match
  if (input.phone) {
    const match = await db.contact.findFirst({
      where: { userId, phone: input.phone },
      select: { id: true },
    });
    if (match) return { result: "duplicate", existingContactId: match.id, confidence: 0.99 };
  }

  // Exact LinkedIn URL match
  if (input.linkedinUrl) {
    const match = await db.contact.findFirst({
      where: { userId, linkedinUrl: input.linkedinUrl },
      select: { id: true },
    });
    if (match) return { result: "duplicate", existingContactId: match.id, confidence: 0.99 };
  }

  // Same normalised full name + same company -> possible-duplicate
  if (input.fullName && input.company) {
    const candidates = await db.contact.findMany({
      where: { userId, company: input.company },
      select: { id: true, fullName: true },
    });

    const normInput = normaliseName(input.fullName);

    for (const c of candidates) {
      if (!c.fullName) continue;
      const normExisting = normaliseName(c.fullName);

      if (normInput === normExisting) {
        return { result: "possible-duplicate", existingContactId: c.id, confidence: 0.95 };
      }

      // Partial name match (first name or last name shared)
      const inputParts = normInput.split(" ");
      const existingParts = normExisting.split(" ");
      const sharedParts = inputParts.filter((p) => existingParts.includes(p));
      if (sharedParts.length > 0) {
        return { result: "possible-duplicate", existingContactId: c.id, confidence: 0.65 };
      }
    }
  }

  return { result: "new", confidence: 1.0 };
}
