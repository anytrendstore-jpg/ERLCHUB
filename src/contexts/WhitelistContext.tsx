"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type {
  WhitelistPhase,
  ApplicationStatus,
  RegistrationMethod,
  DiscordData,
  RobloxData,
  QuestionnaireResponse,
  CharacterData,
  GeneratedDocument,
  ApplicantData,
  DocumentType
} from "@/lib/whitelistTypes";

interface WhitelistContextType {
  applicant: ApplicantData | null;
  isLoading: boolean;
  error: string | null;

  startRegistration: (method: RegistrationMethod, email?: string) => void;

  currentPhase: WhitelistPhase;
  goToPhase: (phase: WhitelistPhase) => void;
  canAccessPhase: (phase: WhitelistPhase) => boolean;

  connectDiscord: (data: DiscordData) => void;
  disconnectDiscord: () => void;

  connectRoblox: (data: RobloxData) => void;
  disconnectRoblox: () => void;

  submitQuestionnaire: (responses: QuestionnaireResponse[]) => void;

  setCharacterData: (data: CharacterData) => void;
  generateDocument: (type: DocumentType) => GeneratedDocument | null;
  addDocument: (doc: GeneratedDocument) => void;

  updateStatus: (status: ApplicationStatus) => void;

  resetWhitelist: () => void;
}

const WhitelistContext = createContext<WhitelistContextType | undefined>(undefined);

const generateId = () => {
  return `WL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const generateDocumentNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 9; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateSecurityCode = () => {
  return Math.random().toString(36).substr(2, 12).toUpperCase();
};

export function WhitelistProvider({ children }: { children: ReactNode }) {
  const [applicant, setApplicant] = useState<ApplicantData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPhase = applicant?.currentPhase || "registration";

  const startRegistration = useCallback((method: RegistrationMethod, email?: string) => {
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const newApplicant: ApplicantData = {
        id: generateId(),
        registrationMethod: method,
        email: email,
        currentPhase: "discord",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setApplicant(newApplicant);
      setIsLoading(false);
    }, 1000);
  }, []);

  const goToPhase = useCallback((phase: WhitelistPhase) => {
    if (!applicant) return;

    setApplicant(prev => prev ? {
      ...prev,
      currentPhase: phase,
      updatedAt: new Date()
    } : null);
  }, [applicant]);

  const canAccessPhase = useCallback((phase: WhitelistPhase): boolean => {
    if (!applicant) return phase === "registration";

    const phaseOrder: WhitelistPhase[] = [
      "registration", "discord", "roblox", "questionnaire", "review", "dni", "completed"
    ];

    const currentIndex = phaseOrder.indexOf(applicant.currentPhase);
    const targetIndex = phaseOrder.indexOf(phase);

    return targetIndex <= currentIndex || targetIndex === currentIndex + 1;
  }, [applicant]);

  const connectDiscord = useCallback((data: DiscordData) => {
    if (!applicant) return;

    setIsLoading(true);
    setTimeout(() => {
      setApplicant(prev => prev ? {
        ...prev,
        discord: data,
        currentPhase: "roblox",
        updatedAt: new Date()
      } : null);
      setIsLoading(false);
    }, 1500);
  }, [applicant]);

  const disconnectDiscord = useCallback(() => {
    if (!applicant) return;

    setApplicant(prev => prev ? {
      ...prev,
      discord: undefined,
      updatedAt: new Date()
    } : null);
  }, [applicant]);

  const connectRoblox = useCallback((data: RobloxData) => {
    if (!applicant) return;

    setIsLoading(true);
    setTimeout(() => {
      setApplicant(prev => prev ? {
        ...prev,
        roblox: data,
        currentPhase: "questionnaire",
        updatedAt: new Date()
      } : null);
      setIsLoading(false);
    }, 1500);
  }, [applicant]);

  const disconnectRoblox = useCallback(() => {
    if (!applicant) return;

    setApplicant(prev => prev ? {
      ...prev,
      roblox: undefined,
      updatedAt: new Date()
    } : null);
  }, [applicant]);

  const submitQuestionnaire = useCallback((responses: QuestionnaireResponse[]) => {
    if (!applicant) return;

    setIsLoading(true);
    setTimeout(() => {
      const score = Math.floor(Math.random() * 30) + 70; 

      setApplicant(prev => prev ? {
        ...prev,
        questionnaire: responses,
        questionnaireScore: score,
        currentPhase: "review",
        status: "pending",
        updatedAt: new Date()
      } : null);
      setIsLoading(false);
    }, 2000);
  }, [applicant]);

  const setCharacterData = useCallback((data: CharacterData) => {
    if (!applicant) return;

    setApplicant(prev => prev ? {
      ...prev,
      character: data,
      updatedAt: new Date()
    } : null);
  }, [applicant]);

  const generateDocument = useCallback((type: DocumentType): GeneratedDocument | null => {
    if (!applicant || !applicant.character) return null;

    const now = new Date();
    const expiration = new Date(now);
    expiration.setFullYear(expiration.getFullYear() + 5);

    const doc: GeneratedDocument = {
      id: `DOC-${generateId()}`,
      type: type,
      characterData: applicant.character,
      issueDate: now.toISOString().split('T')[0],
      expirationDate: expiration.toISOString().split('T')[0],
      documentNumber: generateDocumentNumber(),
      qrCode: `https://erlchub.com/verify/${generateDocumentNumber()}`,
      securityCode: generateSecurityCode(),
    };

    return doc;
  }, [applicant]);

  const addDocument = useCallback((doc: GeneratedDocument) => {
    if (!applicant) return;

    setApplicant(prev => prev ? {
      ...prev,
      documents: [...(prev.documents || []), doc],
      currentPhase: "completed",
      status: "approved",
      completedAt: new Date(),
      updatedAt: new Date()
    } : null);
  }, [applicant]);

  const updateStatus = useCallback((status: ApplicationStatus) => {
    if (!applicant) return;

    setApplicant(prev => prev ? {
      ...prev,
      status,
      updatedAt: new Date()
    } : null);
  }, [applicant]);

  const resetWhitelist = useCallback(() => {
    setApplicant(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return (
    <WhitelistContext.Provider
      value={{
        applicant,
        isLoading,
        error,
        startRegistration,
        currentPhase,
        goToPhase,
        canAccessPhase,
        connectDiscord,
        disconnectDiscord,
        connectRoblox,
        disconnectRoblox,
        submitQuestionnaire,
        setCharacterData,
        generateDocument,
        addDocument,
        updateStatus,
        resetWhitelist,
      }}
    >
      {children}
    </WhitelistContext.Provider>
  );
}

export function useWhitelist() {
  const context = useContext(WhitelistContext);
  if (context === undefined) {
    throw new Error("useWhitelist must be used within a WhitelistProvider");
  }
  return context;
}