import assert from "node:assert/strict";
import test from "node:test";
import { rankingErrorResponse } from "@/app/api/rankings/route";
import { RankingServiceError } from "@/services/ranking.service";

test("rankingErrorResponse exposes expected domain errors", () => {
  const response = rankingErrorResponse(new RankingServiceError("Event not found", 404));

  assert.deepEqual(response, {
    message: "Event not found",
    status: 404,
  });
});

test("rankingErrorResponse hides unexpected internal errors", () => {
  const response = rankingErrorResponse(new Error("Prisma connection refused: password=secret"));

  assert.deepEqual(response, {
    message: "Unable to rank contacts",
    status: 500,
  });
});
