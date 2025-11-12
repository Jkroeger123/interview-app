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

export interface InterviewConfiguration {
  visaType: VisaTypeId | null;
  duration: InterviewDuration;
  focusAreas: string[];
  documents: UploadedDocument[];
}

interface InterviewContextType {
  configuration: InterviewConfiguration;
  setVisaType: (visaType: VisaTypeId) => void;
  setDuration: (duration: InterviewDuration) => void;
  toggleFocusArea: (areaId: string) => void;
  addDocument: (document: UploadedDocument) => void;
  removeDocument: (documentId: string) => void;
  resetConfiguration: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(
  undefined
);

const defaultConfiguration: InterviewConfiguration = {
  visaType: null,
  duration: "quick",
  focusAreas: [],
  documents: [],
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
