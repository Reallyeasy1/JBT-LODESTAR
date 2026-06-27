import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ContactOcrRequestSchema = z.object({
  imageDataUrl: z.string().min(1),
});

const ContactDraftSchema = z.object({
  fullName: z.string().default(""),
  title: z.string().default(""),
  company: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  websiteUrl: z.string().default(""),
  linkedinUrl: z.string().default(""),
  notes: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0),
  warnings: z.array(z.string()).default([]),
});

const GeminiResponseSchema = z.object({
  draft: ContactDraftSchema,
});

const contactDraftJsonSchema = {
  type: "object",
  properties: {
    draft: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        title: { type: "string" },
        company: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        websiteUrl: { type: "string" },
        linkedinUrl: { type: "string" },
        notes: { type: "string" },
        confidence: { type: "number" },
        warnings: { type: "array", items: { type: "string" } },
      },
      required: [
        "fullName",
        "title",
        "company",
        "email",
        "phone",
        "websiteUrl",
        "linkedinUrl",
        "notes",
        "confidence",
        "warnings",
      ],
    },
  },
  required: ["draft"],
};

function parseDataUrl(imageDataUrl: string): { mimeType: string; data: string } | null {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function findJsonText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonText(item);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = findJsonText(item);
      if (found) return found;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const parsedRequest = ContactOcrRequestSchema.safeParse(await request.json());
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "imageDataUrl is required", details: parsedRequest.error.flatten() },
      { status: 400 },
    );
  }

  const image = parseDataUrl(parsedRequest.data.imageDataUrl);
  if (!image) {
    return NextResponse.json({ error: "imageDataUrl must be a base64 image data URL" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          type: "text",
          text:
            "OCR this business card or event badge. Extract only visible text. Do not infer sensitive traits. Return empty strings for missing fields and warnings for uncertainty.",
        },
        {
          type: "image",
          data: image.data,
          mime_type: image.mimeType,
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: contactDraftJsonSchema,
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Gemini OCR request failed", status: response.status },
      { status: 502 },
    );
  }

  const payload: unknown = await response.json();
  const directOutput = GeminiResponseSchema.safeParse(payload);
  if (directOutput.success) {
    return NextResponse.json(directOutput.data);
  }

  const jsonText = findJsonText(payload);
  if (!jsonText) {
    return NextResponse.json({ error: "Gemini response did not include JSON output" }, { status: 502 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return NextResponse.json({ error: "Gemini OCR output was not valid JSON" }, { status: 502 });
  }

  const parsedOutput = GeminiResponseSchema.safeParse(parsedJson);
  if (!parsedOutput.success) {
    return NextResponse.json(
      { error: "Gemini OCR output failed validation", details: parsedOutput.error.flatten() },
      { status: 502 },
    );
  }

  return NextResponse.json(parsedOutput.data);
}
