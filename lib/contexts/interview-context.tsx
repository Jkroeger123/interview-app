"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { VisaTypeId, InterviewDuration } from "@/lib/visa-types";

export interface UploadedDocument {
  id: string;
  categoryId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  url: string;
  ragieDocumentId?: string; // Ragie document ID for RAG retrieval
}

// Ephemeral file for direct LLM context (not stored in Ragie)
export interface EphemeralFile {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  url: string; // Signed S3 URL
}

export interface InterviewConfiguration {
  visaType: VisaTypeId | null;
  duration: InterviewDuration;
  focusAreas: string[];
  documents: UploadedDocument[];
  ephemeralFiles: EphemeralFile[]; // Files sent directly to LLM context
  additionalFocusContext: string; // Extra user-provided concerns or testing context
  interviewLanguage: string; // ISO 639-1 language code (e.g., "en", "es", "zh")
  // Dual participant support (for marriage/fiance visas)
  participant1Name?: string; // U.S. citizen / petitioner
  participant2Name?: string; // Foreign national / beneficiary
}

interface InterviewContextType {
  configuration: InterviewConfiguration;
  setVisaType: (visaType: VisaTypeId) => void;
  setDuration: (duration: InterviewDuration) => void;
  toggleFocusArea: (areaId: string) => void;
  addDocument: (document: UploadedDocument) => void;
  removeDocument: (documentId: string) => void;
  addEphemeralFile: (file: EphemeralFile) => void;
  removeEphemeralFile: (fileId: string) => void;
  setAdditionalFocusContext: (context: string) => void;
  setInterviewLanguage: (language: string) => void;
  setParticipantNames: (participant1: string, participant2: string) => void;
  resetConfiguration: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(
  undefined
);

const defaultConfiguration: InterviewConfiguration = {
  visaType: null,
  duration: "basic",
  focusAreas: [],
  documents: [],
  ephemeralFiles: [],
  additionalFocusContext: "",
  interviewLanguage: "en", // Default to English
};

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [configuration, setConfiguration] =
    useState<InterviewConfiguration>(defaultConfiguration);

  const setVisaType = (visaType: VisaTypeId) => {
    setConfiguration((prev) => ({
      ...prev,
      visaType,
      // Reset focus areas and documents when changing visa type
      focusAreas: [],
      documents: [],
      ephemeralFiles: [],
      additionalFocusContext: "",
    }));
  };

  const setDuration = (duration: InterviewDuration) => {
    setConfiguration((prev) => ({ ...prev, duration }));
  };

  const toggleFocusArea = (areaId: string) => {
    setConfiguration((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter((id) => id !== areaId)
        : [...prev.focusAreas, areaId],
    }));
  };

  const addDocument = (document: UploadedDocument) => {
    setConfiguration((prev) => ({
      ...prev,
      documents: [...prev.documents, document],
    }));
  };

  const removeDocument = (documentId: string) => {
    setConfiguration((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== documentId),
    }));
  };

  const addEphemeralFile = (file: EphemeralFile) => {
    setConfiguration((prev) => ({
      ...prev,
      ephemeralFiles: [...prev.ephemeralFiles, file],
    }));
  };

  const removeEphemeralFile = (fileId: string) => {
    setConfiguration((prev) => ({
      ...prev,
      ephemeralFiles: prev.ephemeralFiles.filter((f) => f.id !== fileId),
    }));
  };

  const setInterviewLanguage = (language: string) => {
    setConfiguration((prev) => ({ ...prev, interviewLanguage: language }));
  };

  const setAdditionalFocusContext = (context: string) => {
    setConfiguration((prev) => ({ ...prev, additionalFocusContext: context }));
  };

  const setParticipantNames = (participant1: string, participant2: string) => {
    setConfiguration((prev) => ({
      ...prev,
      participant1Name: participant1,
      participant2Name: participant2,
    }));
  };

  const resetConfiguration = () => {
    setConfiguration(defaultConfiguration);
  };

  return (
    <InterviewContext.Provider
      value={{
        configuration,
        setVisaType,
        setDuration,
        toggleFocusArea,
        addDocument,
        removeDocument,
        addEphemeralFile,
        removeEphemeralFile,
        setAdditionalFocusContext,
        setInterviewLanguage,
        setParticipantNames,
        resetConfiguration,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
}
