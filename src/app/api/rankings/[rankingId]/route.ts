import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRankingById } from "@/services/ranking.service";

type RankingRouteContext = {
  params: Promise<{
    rankingId: string;
  }>;
};

export async function GET(_request: Request, context: RankingRouteContext) {
  const { rankingId } = await context.params;
  const user = await getCurrentUser();
  const ranking = await getRankingById(rankingId, user.id);

  if (!ranking) {
    return NextResponse.json({ error: "Ranking not found" }, { status: 404 });
  }

  return NextResponse.json({ ranking });
}
