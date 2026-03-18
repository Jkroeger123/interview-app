import type { InterviewConfiguration } from "./contexts/interview-context";
import { VISA_TYPES, INTERVIEW_DURATIONS } from "./visa-types";
import { getQuestionBank } from "./question-banks";

// File to be sent directly to LLM context
export interface AgentFile {
  name: string;
  type: string; // MIME type
  url: string; // Signed URL to fetch file
}

export interface AgentConfig {
  visaType: string;
  visaCode: string;
  visaName: string;
  duration: string; // duration value (e.g., "basic", "standard", "in-depth")
  durationMinutes: number; // duration in minutes for display
  depth: string; // questioning depth: "surface", "moderate", "comprehensive"
  focusAreas: string[];
  focusAreaLabels: string[];
  questionTopics: string[]; // High-level topics instead of all questions
  questionBank: string[]; // Full bank for agent's get_relevant_questions tool
  ragieGlobalPartition: string; // Global reference docs: visa-{type}
  agentPromptContext: string;
  interviewLanguage: string; // ISO 639-1 language code (e.g., "en", "es", "zh")
  userInfo: {
    name: string;
    userId: string;
  };
  // Files to send directly to LLM (images, PDFs)
  files?: AgentFile[];
  // Dual participant support (for marriage/fiance visas)
  participant1Name?: string; // U.S. citizen / petitioner
  participant2Name?: string; // Foreign national / beneficiary
  isDualParticipant?: boolean;
}

/**
 * Build agent configuration from interview configuration
 * This combines all context needed for the agent to conduct the interview
 */
export function buildAgentConfig(
  configuration: InterviewConfiguration,
  userInfo: { name: string; userId: string }
): AgentConfig {
  if (!configuration.visaType) {
    throw new Error("Visa type is required to build agent config");
  }

  const visaType = VISA_TYPES[configuration.visaType];
  const duration = INTERVIEW_DURATIONS.find(
    (d) => d.value === configuration.duration
  );

  if (!duration) {
    throw new Error("Invalid interview duration");
  }

  // Get focus area labels for better context
  const focusAreaLabels = configuration.focusAreas
    .map((areaId) => {
      const area = visaType.focusAreas.find((a) => a.id === areaId);
      return area?.label;
    })
    .filter(Boolean) as string[];

  // Get question bank for this visa type (for agent's tool to query)
  const questionBank = getQuestionBank(configuration.visaType);

  // Define high-level question topics based on focus areas
  // Agent will use get_relevant_questions tool to fetch specific questions
  const questionTopics =
    focusAreaLabels.length > 0
      ? focusAreaLabels
      : visaType.focusAreas.map((area) => area.label);

  // Build Ragie partition names
  // Global partition: visa-{visaType} (for reference documents like visa requirements)
  // Note: Ragie requires lowercase only (pattern: ^[a-z0-9_-]+$)
  const ragieGlobalPartition = `visa-${configuration.visaType}`;

  // Check if this is a dual-participant interview (marriage/fiance visa)
  const isDualParticipant = Boolean(
    configuration.participant1Name && configuration.participant2Name
  );

  // Map ephemeral files to agent format
  const files: AgentFile[] = (configuration.ephemeralFiles || []).map((f) => ({
    name: f.name,
    type: f.type,
    url: f.url,
  }));

  return {
    visaType: configuration.visaType,
    visaCode: visaType.code,
    visaName: visaType.name,
    duration: configuration.duration, // Pass the duration value (e.g., "basic", "standard", "in-depth")
    durationMinutes: duration.minutes, // Pass the minutes for display
    depth: duration.depth, // Pass the questioning depth level
    focusAreas: configuration.focusAreas,
    focusAreaLabels,
    questionTopics,
    questionBank, // Still included for agent's get_relevant_questions tool
    ragieGlobalPartition, // Global reference documents
    agentPromptContext: visaType.agentPromptContext,
    interviewLanguage: configuration.interviewLanguage || "en", // Default to English
    userInfo,
    // Files to send directly to LLM
    files: files.length > 0 ? files : undefined,
    // Dual participant info (if applicable)
    participant1Name: configuration.participant1Name,
    participant2Name: configuration.participant2Name,
    isDualParticipant,
  };
}

/**
 * Serialize agent config for transmission
 */
export function serializeAgentConfig(config: AgentConfig): string {
  return JSON.stringify(config);
}

/**
 * Deserialize agent config
 */
export function deserializeAgentConfig(configString: string): AgentConfig {
  return JSON.parse(configString);
}
