import { LocalisationPromptInput } from "@/ai/prompts/localisation";
import { LocalisationOutput } from "@/ai/schemas/localisation.schema";

export function createMockLocalisation(input: LocalisationPromptInput): LocalisationOutput {
  const userName = input.user.displayName?.trim() || "Alex";
  const contactName = input.contact.fullName?.trim() || "there";
  const language = input.selectedLanguage.trim();
  const normalised = language.toLowerCase();

  if (normalised === "japanese") {
    return {
      openerText: `はじめまして、${contactName}さん。${userName}です。イベントでお会いできてうれしいです。`,
      languageUsed: language,
      confidenceScore: 92,
      warnings: ["Machine-generated Japanese; review pronunciation and wording before use."],
    };
  }
  if (normalised === "mandarin" || normalised === "chinese") {
    return {
      openerText: `${contactName}，您好！我是${userName}。很高兴在活动上认识您。`,
      languageUsed: language,
      confidenceScore: 90,
      warnings: ["Machine-generated Mandarin; review wording before use."],
    };
  }
  if (normalised === "tamil") {
    return {
      openerText: `வணக்கம் ${contactName}, நான் ${userName}. இந்த நிகழ்வில் உங்களைச் சந்தித்ததில் மகிழ்ச்சி.`,
      languageUsed: language,
      confidenceScore: 84,
      warnings: ["Machine-generated Tamil; review wording with a fluent speaker before use."],
    };
  }
  if (normalised === "bahasa indonesia" || normalised === "indonesian" || normalised === "malay") {
    return {
      openerText: `Halo ${contactName}, saya ${userName}. Senang bertemu dengan Anda di acara ini.`,
      languageUsed: language,
      confidenceScore: 88,
      warnings: ["Machine-generated opener; review regional wording before use."],
    };
  }
  if (normalised === "english") {
    return {
      openerText: `Hi ${contactName}, I’m ${userName}. It’s great to meet you at the event.`,
      languageUsed: language,
      confidenceScore: 95,
      warnings: [],
    };
  }

  return {
    openerText: `Hello ${contactName}, I’m ${userName}. It’s great to meet you.`,
    languageUsed: language,
    confidenceScore: 45,
    warnings: [`The mock provider has no verified ${language} template; review with a fluent speaker.`],
  };
}
