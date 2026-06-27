import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateLocalisation } from "@/services/localisation.service";

const LocalisationRequestSchema = z.object({
  contactId: z.string().min(1),
  language: z.string().trim().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = LocalisationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid localisation request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const result = await generateLocalisation(parsed.data.contactId, parsed.data.language, user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate localisation";
    const status = message === "Contact not found" ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
