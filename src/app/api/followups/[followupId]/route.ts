import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFollowUpById } from "@/services/followup.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ followupId: string }> },
) {
  const user = await getCurrentUser();
  const { followupId } = await params;
  const followUp = await getFollowUpById(followupId, user.id);
  if (!followUp) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  return NextResponse.json(followUp);
}
