import type { InterviewConfiguration } from "./contexts/interview-context";
import { VISA_TYPES, INTERVIEW_DURATIONS } from "./visa-types";
import { getQuestionBank } from "./question-banks";

export interface AgentConfig {
  visaType: string;
  visaCode: string;
  visaName: string;
  duration: number; // in minutes
  focusAreas: string[];
  focusAreaLabels: string[];
  questionTopics: string[]; // High-level topics instead of all questions
  questionBank: string[]; // Full bank for agent's get_relevant_questions tool
  ragieGlobalPartition: string; // Global reference docs: visa-{type}
  agentPromptContext: string;
  userInfo: {
    name: string;
    userId: string;
  };
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

  // Define high-level question topics (sent in prompt, not all questions)
  const questionTopics = [
    "Academic Purpose & Program Fit",
    "Financial Ability & Sponsorship",
    "Ties to Home Country & Post-Graduation Plans",
    "Immigration History & Intent",
    "English Proficiency",
    "Documentation & Consistency",
    "Work Intentions (OPT/CPT)",
  ];

  // Build Ragie partition names
  // Global partition: visa-{visaType} (for reference documents like visa requirements)
  // Note: Ragie requires lowercase only (pattern: ^[a-z0-9_-]+$)
  const ragieGlobalPartition = `visa-${configuration.visaType}`;

  return {
    visaType: configuration.visaType,
    visaCode: visaType.code,
    visaName: visaType.name,
    duration: duration.minutes,
    focusAreas: configuration.focusAreas,
    focusAreaLabels,
    questionTopics,
    questionBank, // Still included for agent's get_relevant_questions tool
    ragieGlobalPartition, // Global reference documents
    agentPromptContext: visaType.agentPromptContext,
    userInfo,
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
