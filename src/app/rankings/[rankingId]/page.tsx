import { notFound } from "next/navigation";
import { RankingResults } from "@/components/rankings/RankingResults";
import { getCurrentUser } from "@/lib/auth";
import { getRankingById } from "@/services/ranking.service";

export default async function RankingPage({ params }: { params: Promise<{ rankingId: string }> }) {
  const user = await getCurrentUser();
  const { rankingId } = await params;
  const ranking = await getRankingById(rankingId, user.id);
  if (!ranking) notFound();

  return <RankingResults ranking={ranking} />;
}
