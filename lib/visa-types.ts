import {
  Home,
  GraduationCap,
  Briefcase,
  Users,
  Heart,
  Plane,
  Music,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import {
  LIBRARY_DERIVED_INTERVIEWS,
  LIBRARY_VISA_TYPE_IDS,
  type LibraryVisaTypeId,
} from "./library-derived-interviews";
import {
  EXTENSION_INTERVIEWS,
  EXTENSION_VISA_TYPE_IDS,
  type ExtensionVisaTypeId,
} from "./library-extension-interviews";

export type CoreVisaTypeId =
  | "tourist"
  | "student"
  | "work"
  | "immigrant"
  | "fiance";
export type VisaTypeId = CoreVisaTypeId | LibraryVisaTypeId | ExtensionVisaTypeId;

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

const CORE_VISA_TYPES: Record<CoreVisaTypeId, VisaType> = {
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
    documentCategories: LIBRARY_DERIVED_INTERVIEWS.f1.documentCategories,
    focusAreas: LIBRARY_DERIVED_INTERVIEWS.f1.focusAreas,
    agentPromptContext: LIBRARY_DERIVED_INTERVIEWS.f1.agentPromptContext,
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
    documentCategories: LIBRARY_DERIVED_INTERVIEWS.k1.documentCategories,
    focusAreas: LIBRARY_DERIVED_INTERVIEWS.k1.focusAreas,
    agentPromptContext: LIBRARY_DERIVED_INTERVIEWS.k1.agentPromptContext,
  },
};

const LIBRARY_ICON_MAP: Record<
  (typeof LIBRARY_DERIVED_INTERVIEWS)[LibraryVisaTypeId]["iconKey"],
  LucideIcon
> = {
  home: Home,
  graduationCap: GraduationCap,
  briefcase: Briefcase,
  users: Users,
  heart: Heart,
  plane: Plane,
  music: Music,
  landmark: Landmark,
};

const LIBRARY_VISA_TYPES = Object.fromEntries(
  LIBRARY_VISA_TYPE_IDS.map((id) => {
    const interview = LIBRARY_DERIVED_INTERVIEWS[id];
    return [
      id,
      {
        id,
        name: interview.name,
        code: interview.code,
        description: interview.description,
        icon: LIBRARY_ICON_MAP[interview.iconKey],
        iconBgColor: interview.iconBgColor,
        documentCategories: interview.documentCategories,
        focusAreas: interview.focusAreas,
        agentPromptContext: interview.agentPromptContext,
      } satisfies VisaType,
    ];
  })
) as Record<LibraryVisaTypeId, VisaType>;

const EXTENSION_VISA_TYPES = Object.fromEntries(
  EXTENSION_VISA_TYPE_IDS.map((id) => {
    const interview = EXTENSION_INTERVIEWS[id];
    return [
      id,
      {
        id,
        name: interview.name,
        code: interview.code,
        description: interview.description,
        icon: LIBRARY_ICON_MAP[interview.iconKey],
        iconBgColor: interview.iconBgColor,
        documentCategories: interview.documentCategories,
        focusAreas: interview.focusAreas,
        agentPromptContext: interview.agentPromptContext,
      } satisfies VisaType,
    ];
  })
) as Record<ExtensionVisaTypeId, VisaType>;

export const VISA_TYPES: Record<VisaTypeId, VisaType> = {
  ...CORE_VISA_TYPES,
  ...LIBRARY_VISA_TYPES,
  ...EXTENSION_VISA_TYPES,
};

export const INTERVIEW_DURATIONS = [
  {
    value: "basic",
    label: "Basic",
    description: "Surface-level questioning on key topics",
    credits: 5,
    minutes: 5,
    depth: "surface",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Surface-level + deep dive into 1-2 key areas",
    credits: 10,
    minutes: 10,
    depth: "moderate",
  },
  {
    value: "in-depth",
    label: "In-Depth",
    description: "Comprehensive deep dive into all question bank sections",
    credits: 15,
    minutes: 15,
    depth: "comprehensive",
  },
] as const;

export type InterviewDuration = (typeof INTERVIEW_DURATIONS)[number]["value"];
