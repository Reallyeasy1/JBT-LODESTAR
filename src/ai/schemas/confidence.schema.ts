import { z } from "zod";

/**
 * Confidence values are modeled as whole-number percentages, 0 to 100.
 * Example: 87 means 87% confidence.
 */
export const ConfidencePercentageSchema = z.number().int().min(0).max(100);
