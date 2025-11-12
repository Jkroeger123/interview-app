import {
  Home,
  GraduationCap,
  Briefcase,
  Users,
  Heart,
  type LucideIcon,
} from "lucide-react";

export type VisaTypeId =
  | "tourist"
  | "student"
  | "work"
  | "immigrant"
  | "fiance";

export interface DocumentCategory {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export interface FocusArea {
  id: string;
  label: string;
  description: string;
}

export interface VisaType {
  id: VisaTypeId;
  name: string;
  code: string;
  description: string;
  icon: LucideIcon;
  iconBgColor: string;
  documentCategories: DocumentCategory[];
  focusAreas: FocusArea[];
  agentPromptContext: string;
}

export const VISA_TYPES: Record<VisaTypeId, VisaType> = {
  tourist: {
    id: "tourist",
    name: "Tourist Visa",
    code: "B-1/B-2",
    description: "For tourism, business meetings, or medical treatment",
    icon: Home,
    iconBgColor: "bg-blue-500/10",
    documentCategories: [
      {
        id: "financial",
        label: "Financial Documents",
        description: "Bank statements, tax returns, pay stubs",
        required: true,
      },
      {
        id: "employment",
        label: "Employment Letters",
        description: "Employment verification, business registration",
        required: true,
      },
      {
        id: "travel",
        label: "Travel History",
        description: "Previous visas, passport stamps",
        required: false,
      },
      {
        id: "property",
        label: "Property Documents",
        description: "Property ownership, lease agreements",
        required: false,
      },
      {
        id: "other",
        label: "Other Documents",
        description: "Invitation letters, sponsorship documents",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "financial",
        label: "Financial Background",
        description:
          "Questions about income, savings, and ability to fund the trip",
      },
      {
        id: "ties",
        label: "Ties to Home Country",
        description: "Job, family, property, and reasons to return home",
      },
      {
        id: "travel",
        label: "Travel History",
        description: "Previous international travel and visa history",
      },
      {
        id: "purpose",
        label: "Purpose of Visit",
        description: "Detailed questions about your travel plans and itinerary",
      },
    ],
    agentPromptContext: `This is a B-1/B-2 tourist visa interview. Focus on determining the applicant's intent to return to their home country after visiting the U.S. Key areas include financial capability, ties to home country, and purpose of visit.`,
  },
  student: {
    id: "student",
    name: "Student Visa",
    code: "F-1",
    description: "For academic studies at U.S. institutions",
    icon: GraduationCap,
    iconBgColor: "bg-purple-500/10",
    documentCategories: [
      {
        id: "financial",
        label: "Financial Documents",
        description: "Bank statements, tax returns, pay stubs",
        required: true,
      },
      {
        id: "employment",
        label: "Employment Letters",
        description: "Employment verification, offer letters",
        required: false,
      },
      {
        id: "education",
        label: "Educational Certificates",
        description: "Degrees, transcripts, diplomas",
        required: true,
      },
      {
        id: "travel",
        label: "Travel History",
        description: "Previous visas, passport stamps",
        required: false,
      },
      {
        id: "property",
        label: "Property Documents",
        description: "Property ownership, lease agreements",
        required: false,
      },
      {
        id: "other",
        label: "Other Documents",
        description: "Invitation letters, sponsorship documents, I-20 form",
        required: true,
      },
    ],
    focusAreas: [
      {
        id: "financial",
        label: "Financial Background",
        description: "Proof of funds for tuition and living expenses",
      },
      {
        id: "ties",
        label: "Ties to Home Country",
        description: "Family, property, and reasons to return after studies",
      },
      {
        id: "education",
        label: "Educational Background",
        description: "Academic history and qualifications",
      },
      {
        id: "career",
        label: "Career Plans",
        description: "Post-graduation plans and career goals",
      },
    ],
    agentPromptContext: `This is an F-1 student visa interview governed by INA §214(b), which PRESUMES immigrant intent.

CORE ASSESSMENT AREAS:
1. NONIMMIGRANT INTENT: Strong ties to home country and clear plans to return after studies
2. ACADEMIC PURPOSE: Genuine understanding of chosen program and how it fits career goals
3. FINANCIAL ABILITY: Sufficient, legitimate funds for all years of study (tuition + living expenses)

KEY PRINCIPLES:
- Burden of proof is on the applicant to overcome presumption of immigrant intent
- Be skeptical of vague, rehearsed answers
- Probe inconsistencies between documents (I-20, DS-160) and verbal statements  
- Red flags: overemphasis on OPT/work, weak home ties, suspicious finances, field mismatches
- Verify applicant understands F-1 restrictions (no off-campus work, must maintain status)

Real F-1 interviews are brief (3-7 minutes) and decisive. Focus on the most critical questions first.`,
  },
  work: {
    id: "work",
    name: "Work Visa",
    code: "H-1B",
    description: "For specialty occupation employment",
    icon: Briefcase,
    iconBgColor: "bg-green-500/10",
    documentCategories: [
      {
        id: "financial",
        label: "Financial Documents",
        description: "Bank statements, tax returns, pay stubs",
        required: false,
      },
      {
        id: "employment",
        label: "Employment Letters",
        description: "Job offer, employment contract, LCA",
        required: true,
      },
      {
        id: "education",
        label: "Educational Certificates",
        description: "Degrees, transcripts, diplomas",
        required: true,
      },
      {
        id: "travel",
        label: "Travel History",
        description: "Previous visas, passport stamps",
        required: false,
      },
      {
        id: "other",
        label: "Other Documents",
        description: "Resume, project details, company information",
        required: true,
      },
    ],
    focusAreas: [
      {
        id: "employment",
        label: "Employment Details",
        description: "Job role, responsibilities, and employer information",
      },
      {
        id: "education",
        label: "Educational Background",
        description: "Qualifications and specialty occupation requirements",
      },
      {
        id: "ties",
        label: "Ties to Home Country",
        description: "Family and property in home country",
      },
      {
        id: "salary",
        label: "Compensation",
        description: "Salary and benefits details",
      },
    ],
    agentPromptContext: `This is an H-1B work visa interview. Verify the applicant's qualifications for the specialty occupation, assess the legitimacy of the job offer, and ensure the position meets H-1B requirements. Review educational background and work experience.`,
  },
  immigrant: {
    id: "immigrant",
    name: "Immigrant Visa",
    code: "Green Card",
    description: "For permanent residence in the United States",
    icon: Users,
    iconBgColor: "bg-orange-500/10",
    documentCategories: [
      {
        id: "financial",
        label: "Financial Documents",
        description: "Bank statements, tax returns, affidavit of support",
        required: true,
      },
      {
        id: "employment",
        label: "Employment Letters",
        description: "Employment verification, offer letters",
        required: false,
      },
      {
        id: "education",
        label: "Educational Certificates",
        description: "Degrees, transcripts, diplomas",
        required: false,
      },
      {
        id: "family",
        label: "Family Documents",
        description:
          "Marriage certificate, birth certificates, divorce decrees",
        required: true,
      },
      {
        id: "other",
        label: "Other Documents",
        description: "Police certificates, medical exam results",
        required: true,
      },
    ],
    focusAreas: [
      {
        id: "financial",
        label: "Financial Background",
        description: "Ability to support yourself and dependents",
      },
      {
        id: "family",
        label: "Family Relationships",
        description: "Details about sponsor and family members",
      },
      {
        id: "criminal",
        label: "Criminal History",
        description: "Background checks and police certificates",
      },
      {
        id: "intent",
        label: "Immigration Intent",
        description: "Reasons for seeking permanent residence",
      },
    ],
    agentPromptContext: `This is an immigrant visa (Green Card) interview. This is for permanent residence, so focus on the applicant's admissibility, family relationships, financial support, criminal history, and long-term plans in the U.S.`,
  },
  fiance: {
    id: "fiance",
    name: "Fiancé(e) Visa",
    code: "K-1",
    description: "For foreign fiancé(e)s of U.S. citizens",
    icon: Heart,
    iconBgColor: "bg-pink-500/10",
    documentCategories: [
      {
        id: "financial",
        label: "Financial Documents",
        description:
          "Bank statements, sponsor's tax returns, affidavit of support",
        required: true,
      },
      {
        id: "relationship",
        label: "Relationship Evidence",
        description: "Photos, messages, travel records together",
        required: true,
      },
      {
        id: "family",
        label: "Family Documents",
        description: "Birth certificate, divorce decrees (if applicable)",
        required: true,
      },
      {
        id: "other",
        label: "Other Documents",
        description: "Police certificates, medical exam results",
        required: true,
      },
    ],
    focusAreas: [
      {
        id: "relationship",
        label: "Relationship History",
        description: "How you met, communication history, visits",
      },
      {
        id: "financial",
        label: "Financial Background",
        description: "Sponsor's ability to support you",
      },
      {
        id: "intent",
        label: "Marriage Intent",
        description: "Wedding plans and future together",
      },
      {
        id: "family",
        label: "Family Relationships",
        description: "Previous marriages, children, family approval",
      },
    ],
    agentPromptContext: `This is a K-1 fiancé(e) visa interview. Verify the authenticity of the relationship, ensure the couple has met in person within the last 2 years, assess the genuineness of the intent to marry, and review financial support from the U.S. citizen sponsor.`,
  },
};

export const INTERVIEW_DURATIONS = [
  { value: "quick", label: "Quick - 5 minutes", credits: 5, minutes: 5 },
  {
    value: "standard",
    label: "Standard - 10 minutes",
    credits: 10,
    minutes: 10,
  },
  {
    value: "comprehensive",
    label: "Comprehensive - 15 minutes",
    credits: 15,
    minutes: 15,
  },
] as const;

export type InterviewDuration = (typeof INTERVIEW_DURATIONS)[number]["value"];
