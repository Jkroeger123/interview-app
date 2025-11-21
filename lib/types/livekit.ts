import type { TranscriptionSegment } from "livekit-client";

export interface CombinedTranscription extends TranscriptionSegment {
  role: "assistant" | "user";
  receivedAtMediaTimestamp: number;
  receivedAt: number;
}

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
  interviewId?: string; // Interview tracking ID
}

export interface AgentCapabilities {
  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
}

export interface LiveKitConfig {
  pageTitle: string;
  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;
  agentName?: string;
}
