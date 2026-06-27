import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBriefingById } from "@/services/briefing.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ briefingId: string }> },
) {
  const user = await getCurrentUser();
  const { briefingId } = await params;
  const briefing = await getBriefingById(briefingId, user.id);
  if (!briefing) return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
  return NextResponse.json(briefing);
}
