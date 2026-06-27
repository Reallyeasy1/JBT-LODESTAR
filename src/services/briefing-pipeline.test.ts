import assert from "node:assert/strict";
import type {
  LLMClient,
  LLMCompletionRequest,
  LLMCompletionResult,
} from "@/ai/client";
import {
  BriefingOutputSchema,
  type BriefingOutput,
} from "@/ai/schemas/briefing.schema";
import {
  createBriefingsPostHandler,
  type BriefingsPostHandlerDeps,
} from "@/app/api/briefings/route";
import {
  createBriefingService,
  type BriefingServiceDeps,
} from "@/services/briefing.service";
import {
  STEREOTYPE_CONFIDENCE_PENALTY,
  verifyBriefing,
} from "@/services/verification.service";

type ContactRecord = Awaited<
  ReturnType<BriefingServiceDeps["db"]["contact"]["findFirst"]>
>;
type ProfileRecord = Awaited<
  ReturnType<BriefingServiceDeps["db"]["userProfile"]["findUnique"]>
>;
type ContactFindFirstArgs = Parameters<
  BriefingServiceDeps["db"]["contact"]["findFirst"]
>[0];
type BriefingCreateData = Parameters<
  BriefingServiceDeps["db"]["briefing"]["create"]
>[0]["data"];
type StartAgentRunArgs = Parameters<BriefingServiceDeps["startAgentRun"]>[0];
type CompleteAgentRunArgs = Parameters<
  BriefingServiceDeps["completeAgentRun"]
>[1];

const baseBriefing: BriefingOutput = {
  personSummary: "Mina leads privacy-preserving pilots at Northstar Health.",
  whyTheyMatter:
    "Her team is evaluating AI infrastructure for a healthcare pilot.",
  decisionAuthority: "influencer",
  talkingPoints: [
    "Reference the privacy-preserving pilot work.",
    "Connect the demo to healthcare deployment constraints.",
    "Ask about the internal approval timeline.",
  ],
  questionsToAsk: [
    "What would a successful pilot need to prove?",
    "Who else would need to review the pilot plan?",
  ],
  culturalNotes: [],
  warnings: [],
  confidenceScore: 80,
};

const ownedContact: NonNullable<ContactRecord> = {
  fullName: "Mina Sato",
  title: "VP Partnerships",
  company: "Northstar Health",
  languages: ["Japanese", "English"],
  tags: ["pilot-customer", "enterprise"],
  notes:
    "Owns privacy-preserving AI pilot partnerships. Wants concrete security proof before expanding vendor conversations.",
  sourceConfidence: 0.8,
  event: {
    eventGoal: "find healthcare pilot customers",
    name: "AI Health Summit",
  },
};

function makeClient(
  complete: (request: LLMCompletionRequest) => Promise<LLMCompletionResult>
): LLMClient {
  return {
    modelName: "test-model",
    complete,
  };
}

function successfulClient(): LLMClient {
  return makeClient(async (request) => ({
    text: JSON.stringify(request.context?.mockResponse ?? {}),
    modelName: "test-model",
    tokenInput: 12,
    tokenOutput: 34,
  }));
}

function invalidSchemaClient(): LLMClient {
  return makeClient(async () => ({
    text: JSON.stringify({
      ...baseBriefing,
      talkingPoints: ["Only one talking point"],
    }),
    modelName: "test-model",
    tokenInput: 3,
    tokenOutput: 5,
  }));
}

function makeDeps(options: {
  contact: ContactRecord;
  profile?: ProfileRecord;
  client?: LLMClient;
}) {
  const calls: {
    contactFindFirst: ContactFindFirstArgs[];
    savedBriefings: BriefingCreateData[];
    startedRuns: StartAgentRunArgs[];
    completedRuns: CompleteAgentRunArgs[];
  } = {
    contactFindFirst: [],
    savedBriefings: [],
    startedRuns: [],
    completedRuns: [],
  };

  const db: BriefingServiceDeps["db"] = {
    contact: {
      async findFirst(args) {
        calls.contactFindFirst.push(args);
        return options.contact;
      },
    },
    userProfile: {
      async findUnique() {
        return options.profile ?? {
          languages: ["Japanese", "English"],
          preferredTone: "direct",
        };
      },
    },
    briefing: {
      async create(args) {
        calls.savedBriefings.push(args.data);
        return { id: "briefing-1" };
      },
    },
  };

  const deps: BriefingServiceDeps = {
    db,
    getLLMClient: () => options.client ?? successfulClient(),
    async startAgentRun(params) {
      calls.startedRuns.push(params);
      return "agent-run-1";
    },
    async completeAgentRun(_agentRunId, params) {
      calls.completedRuns.push(params);
    },
  };

  return { deps, calls };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function testSchemaBounds() {
  assert.equal(BriefingOutputSchema.safeParse(baseBriefing).success, true);
  assert.equal(
    BriefingOutputSchema.safeParse({
      ...baseBriefing,
      talkingPoints: ["Only one"],
    }).success,
    false
  );
  assert.equal(
    BriefingOutputSchema.safeParse({
      ...baseBriefing,
      questionsToAsk: ["One", "Two", "Three"],
    }).success,
    false
  );
}

function testVerifierPenalty() {
  const stereotyped: BriefingOutput = {
    ...baseBriefing,
    culturalNotes: ["Because they are Japanese, start indirectly."],
  };

  const verified = verifyBriefing(stereotyped);

  assert.equal(verified.findings.length, 1);
  assert.equal(verified.findings[0]?.pattern, "because-they-are");
  assert.equal(
    verified.briefing.confidenceScore,
    baseBriefing.confidenceScore - STEREOTYPE_CONFIDENCE_PENALTY
  );
  assert.equal(verified.briefing.warnings.length, 1);
}

async function testGenerateBriefingSuccess() {
  const { deps, calls } = makeDeps({ contact: ownedContact });
  const service = createBriefingService(deps);

  const result = await service.generateBriefing({
    contactId: "contact-1",
    userId: "user-1",
  });

  assert.deepEqual(calls.contactFindFirst[0]?.where, {
    id: "contact-1",
    userId: "user-1",
  });
  assert.equal(result.briefingId, "briefing-1");
  assert.equal(result.agentRunId, "agent-run-1");
  assert.equal(result.briefing.talkingPoints.length, 3);
  assert.equal(result.briefing.questionsToAsk.length, 2);
  assert.equal(calls.savedBriefings.length, 1);
  assert.equal(calls.savedBriefings[0]?.agentRunId, "agent-run-1");
  assert.equal(calls.completedRuns[0]?.status, "success");
  assert.equal(calls.completedRuns[0]?.tokenInput, 12);
  assert.equal(calls.completedRuns[0]?.tokenOutput, 34);
}

async function testGenerateBriefingRejectsUnownedContact() {
  const { deps, calls } = makeDeps({ contact: null });
  const service = createBriefingService(deps);

  await assert.rejects(
    service.generateBriefing({
      contactId: "contact-from-another-user",
      userId: "user-1",
    }),
    /Contact not found or not owned by user/
  );
  assert.equal(calls.startedRuns.length, 0);
  assert.equal(calls.savedBriefings.length, 0);
}

async function testGenerateBriefingRecordsValidationErrors() {
  const { deps, calls } = makeDeps({
    contact: ownedContact,
    client: invalidSchemaClient(),
  });
  const service = createBriefingService(deps);

  await assert.rejects(
    service.generateBriefing({
      contactId: "contact-1",
      userId: "user-1",
    })
  );
  assert.equal(calls.startedRuns.length, 1);
  assert.equal(calls.savedBriefings.length, 0);
  assert.equal(calls.completedRuns[0]?.status, "error");
  assert.equal(calls.completedRuns[0]?.outputJson, null);
  assert.match(calls.completedRuns[0]?.errorMessage ?? "", /talkingPoints/);
}

function makeRouteDeps(
  generateBriefing: BriefingsPostHandlerDeps["generateBriefing"]
): BriefingsPostHandlerDeps {
  return {
    async getCurrentUser() {
      return {
        id: "user-1",
        email: "alex@lodestar.ai",
        name: "Alex Tan",
      };
    },
    generateBriefing,
  };
}

async function testBriefingsRoute() {
  const invalidJsonHandler = createBriefingsPostHandler(
    makeRouteDeps(async () => {
      throw new Error("should not generate");
    })
  );
  const invalidJsonResponse = await invalidJsonHandler({
    json: async () => {
      throw new Error("bad json");
    },
  } as unknown as Request);
  assert.equal(invalidJsonResponse.status, 400);
  assert.equal((await readJson(invalidJsonResponse)).error, "Invalid JSON body");

  const validationResponse = await invalidJsonHandler(
    new Request("http://test.local/api/briefings", {
      method: "POST",
      body: JSON.stringify({ contactId: "" }),
    })
  );
  assert.equal(validationResponse.status, 400);
  assert.equal((await readJson(validationResponse)).error, "Validation failed");

  const notOwnedHandler = createBriefingsPostHandler(
    makeRouteDeps(async () => {
      throw new Error("Contact not found or not owned by user");
    })
  );
  const notOwnedResponse = await notOwnedHandler(
    new Request("http://test.local/api/briefings", {
      method: "POST",
      body: JSON.stringify({ contactId: "other-contact" }),
    })
  );
  assert.equal(notOwnedResponse.status, 404);

  let receivedParams: Parameters<
    BriefingsPostHandlerDeps["generateBriefing"]
  >[0] | null = null;
  const successHandler = createBriefingsPostHandler(
    makeRouteDeps(async (params) => {
      receivedParams = params;
      return {
        briefingId: "briefing-1",
        agentRunId: "agent-run-1",
        briefing: baseBriefing,
      };
    })
  );
  const successResponse = await successHandler(
    new Request("http://test.local/api/briefings", {
      method: "POST",
      body: JSON.stringify({ contactId: "contact-1" }),
    })
  );
  const successBody = await readJson(successResponse);
  assert.equal(successResponse.status, 201);
  assert.deepEqual(receivedParams, {
    contactId: "contact-1",
    userId: "user-1",
  });
  assert.equal(successBody.briefingId, "briefing-1");
}

async function run() {
  testSchemaBounds();
  testVerifierPenalty();
  await testGenerateBriefingSuccess();
  await testGenerateBriefingRejectsUnownedContact();
  await testGenerateBriefingRecordsValidationErrors();
  await testBriefingsRoute();
  console.log("briefing-pipeline tests passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
