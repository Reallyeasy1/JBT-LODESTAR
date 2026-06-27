import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRankingById } from "@/services/ranking.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rankingId: string }> },
) {
  const user = await getCurrentUser();
  const { rankingId } = await params;
  const ranking = await getRankingById(rankingId, user.id);
  if (!ranking) return NextResponse.json({ error: "Ranking not found" }, { status: 404 });
  return NextResponse.json(ranking);
}
