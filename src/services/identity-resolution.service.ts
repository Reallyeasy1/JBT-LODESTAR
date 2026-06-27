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
    // Filter single-char tokens to avoid spurious matches ("Jo A" vs "Jo B")
    const inputParts = normInput.split(" ").filter((p) => p.length > 1);
    let partialMatch: string | null = null;

    for (const c of candidates) {
      if (!c.fullName) continue;
      const normExisting = normaliseName(c.fullName);

      if (normInput === normExisting) {
        // Exact match wins; return immediately.
        return { result: "possible-duplicate", existingContactId: c.id, confidence: 0.95 };
      }

      // Track first partial match but keep scanning for an exact match
      if (!partialMatch) {
        const existingParts = normExisting.split(" ").filter((p) => p.length > 1);
        if (inputParts.some((p) => existingParts.includes(p))) {
          partialMatch = c.id;
        }
      }
    }

    if (partialMatch) {
      return { result: "possible-duplicate", existingContactId: partialMatch, confidence: 0.65 };
    }
  }

  return { result: "new", confidence: 1.0 };
}
