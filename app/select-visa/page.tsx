"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { VISA_TYPES } from "@/lib/visa-types";
import { useInterview } from "@/lib/contexts/interview-context";
import { cn } from "@/lib/utils";

export default function SelectVisaPage() {
  const router = useRouter();
  const { setVisaType } = useInterview();

  const handleVisaSelect = (visaTypeId: string) => {
    setVisaType(visaTypeId as any);
    router.push("/configure-interview");
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Select Your Visa Type</h1>
        <p className="text-lg text-muted-foreground">
          Choose the visa you're applying for
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(VISA_TYPES).map((visaType) => {
          const Icon = visaType.icon;
          const isEnabled = visaType.id === "student"; // Only enable F-1 Student visa
          
          return (
            <Card
              key={visaType.id}
              className={cn(
                "p-6 transition-all",
                isEnabled
                  ? "cursor-pointer hover:shadow-lg hover:border-blue-500"
                  : "cursor-not-allowed opacity-50"
              )}
              onClick={() => isEnabled && handleVisaSelect(visaType.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg p-3",
                    visaType.iconBgColor
                  )}
                >
                  <Icon className="size-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold mb-1">
                    {visaType.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3 font-mono">
                    {visaType.code}
                  </p>
                  <p className="text-muted-foreground">{visaType.description}</p>
                  {!isEnabled && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Coming soon
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      </div>
    </>
  );
}

