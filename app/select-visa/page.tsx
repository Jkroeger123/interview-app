"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VISA_TYPES, type VisaTypeId, type VisaType } from "@/lib/visa-types";
import { useInterview } from "@/lib/contexts/interview-context";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type VisaGroup = {
  id: string;
  title: string;
  description: string;
  matches: (visaType: VisaType) => boolean;
};

const VISA_GROUPS: VisaGroup[] = [
  {
    id: "visitor",
    title: "Visitor and Travel",
    description: "Business, tourism, and short-term visit interviews",
    matches: (visaType) => ["tourist", "b1b2"].includes(visaType.id),
  },
  {
    id: "education",
    title: "Student and Exchange",
    description: "Academic and exchange visitor interview tracks",
    matches: (visaType) => ["student", "j1"].includes(visaType.id),
  },
  {
    id: "employment",
    title: "Employment and Transfers",
    description: "Employer-sponsored, intracompany transfer, and dependent interviews",
    matches: (visaType) =>
      ["work", "h1b", "h4", "l1a", "l1b", "l2", "r1"].includes(visaType.id),
  },
  {
    id: "talent",
    title: "Talent, Athletics, and Performance",
    description: "Extraordinary ability and performer interviews",
    matches: (visaType) => ["o1a", "o1b", "p"].includes(visaType.id),
  },
  {
    id: "family",
    title: "Family and Relationship",
    description: "Relationship-based interview preparation",
    matches: (visaType) => ["fiance", "mbgc"].includes(visaType.id),
  },
  {
    id: "immigration",
    title: "Immigrant and Citizenship",
    description: "Permanent residency, immigrant visa, and naturalization interviews",
    matches: (visaType) => ["immigrant", "naturalization"].includes(visaType.id),
  },
  {
    id: "site-visits",
    title: "Site Visits and Investigations",
    description: "USCIS FDNS post-approval site visits — workplace verification, not consular",
    matches: (visaType) =>
      [
        "h1b_site_beneficiary",
        "h1b_site_employer",
        "l1_site_beneficiary",
        "l1_site_employer",
      ].includes(visaType.id),
  },
];

function VisaOptionRow({
  visaType,
  onSelect,
}: {
  visaType: VisaType;
  onSelect: (visaTypeId: VisaTypeId) => void;
}) {
  const Icon = visaType.icon;

  return (
    <button
      type="button"
      className={cn(
        "w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      onClick={() => onSelect(visaType.id)}
    >
      <div className="flex items-center gap-3">
        <div className={cn("rounded-md p-2", visaType.iconBgColor)}>
          <Icon className="size-4 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold leading-tight">{visaType.name}</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {visaType.code}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{visaType.description}</p>
        </div>
        <div className="hidden md:block">
          <span className="text-sm font-medium text-blue-600">Select</span>
        </div>
      </div>
    </button>
  );
}

export default function SelectVisaPage() {
  const router = useRouter();
  const { setVisaType } = useInterview();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const allVisaTypes = useMemo(() => Object.values(VISA_TYPES), []);

  const matchesQuery = (visaType: VisaType) => {
    if (!normalizedQuery) return true;
    return (
      visaType.name.toLowerCase().includes(normalizedQuery) ||
      visaType.code.toLowerCase().includes(normalizedQuery) ||
      visaType.description.toLowerCase().includes(normalizedQuery)
    );
  };

  const groupedVisas = useMemo(
    () =>
      VISA_GROUPS.map((group) => ({
        ...group,
        visas: allVisaTypes
          .filter(group.matches)
          .filter(matchesQuery)
          .sort((a, b) => a.code.localeCompare(b.code) || a.name.localeCompare(b.name)),
      })).filter((group) => group.visas.length > 0),
    [allVisaTypes, normalizedQuery]
  );

  const handleVisaSelect = (visaTypeId: VisaTypeId) => {
    setVisaType(visaTypeId);
    router.push("/configure-interview");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Select Your Visa Type</h1>
          <p className="text-lg text-muted-foreground">
            Choose the visa you're applying for
          </p>
        </div>

        <div className="border rounded-lg p-4 mb-8">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by visa name, code, or purpose"
              className="pl-9"
            />
          </div>
        </div>

        {groupedVisas.length > 0 ? (
          <div className="space-y-8">
            {groupedVisas.map((group) => (
              <section key={group.id}>
                <div className="mb-3">
                  <h2 className="text-xl font-semibold">{group.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                </div>

                <div className="border rounded-lg divide-y">
                  {group.visas.map((visaType) => (
                    <VisaOptionRow
                      key={visaType.id}
                      visaType={visaType}
                      onSelect={handleVisaSelect}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-6 text-sm text-muted-foreground">
            No visa interview options match your search.
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

