import { db } from "@/lib/db";

export async function startAgentRun(params: {
  userId: string;
  taskType: string;
  agentType: string;
  modelName?: string;
  promptVersion?: string;
  inputJson: unknown;
}): Promise<string> {
  const run = await db.agentRun.create({
    data: {
      userId: params.userId,
      taskType: params.taskType,
      agentType: params.agentType,
      modelName: params.modelName ?? "mock",
      promptVersion: params.promptVersion,
      inputJson: params.inputJson as object,
      status: "running",
    },
  });
  return run.id;
}

export async function completeAgentRun(
  agentRunId: string,
  params: {
    outputJson: unknown;
    status: "success" | "error";
    latencyMs: number;
    tokenInput?: number;
    tokenOutput?: number;
    errorMessage?: string;
  }
): Promise<void> {
  await db.agentRun.update({
    where: { id: agentRunId },
    data: {
      outputJson: params.outputJson as object,
      status: params.status,
      latencyMs: params.latencyMs,
      tokenInput: params.tokenInput,
      tokenOutput: params.tokenOutput,
      errorMessage: params.errorMessage,
    },
  });
}
