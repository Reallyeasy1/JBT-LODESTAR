import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { RankingServiceError, rankContacts } from "@/services/ranking.service";

const RankingRequestSchema = z.object({
  eventId: z.string().min(1),
  goalText: z.string().trim().min(3).optional(),
});

export function rankingErrorResponse(error: unknown): { message: string; status: number } {
  if (error instanceof RankingServiceError) {
    return { message: error.message, status: error.status };
  }

  return { message: "Unable to rank contacts", status: 500 };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = RankingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ranking request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const result = await rankContacts(parsed.data.eventId, parsed.data.goalText, user.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const response = rankingErrorResponse(error);
    if (response.status === 500) {
      console.error("Unexpected ranking failure", error);
    }
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
