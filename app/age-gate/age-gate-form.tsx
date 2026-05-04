"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type AgeStatus = "adult" | "minor_with_guardian";

export function AgeGateForm() {
  const router = useRouter();
  const { user } = useUser();
  const [ageStatus, setAgeStatus] = useState<AgeStatus | null>(null);
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = ageStatus !== null && acceptedTos && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/age-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageStatus, acceptedTos }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save your acknowledgment.");
      }
      await user?.reload();
      router.replace("/select-visa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Before you continue</CardTitle>
        <CardDescription>
          Vysa is intended for users aged 18 or older. If you are under 18,
          you may use Vysa only with a parent or legal guardian.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            role="radiogroup"
            aria-label="Age confirmation"
            className="space-y-3"
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent">
              <input
                type="radio"
                name="ageStatus"
                value="adult"
                checked={ageStatus === "adult"}
                onChange={() => setAgeStatus("adult")}
                className="mt-1"
              />
              <span className="text-sm">
                I confirm that I am 18 years of age or older.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent">
              <input
                type="radio"
                name="ageStatus"
                value="minor_with_guardian"
                checked={ageStatus === "minor_with_guardian"}
                onChange={() => setAgeStatus("minor_with_guardian")}
                className="mt-1"
              />
              <span className="text-sm">
                I am under 18 and I am using Vysa with the involvement of my
                parent or legal guardian.
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="tos"
              checked={acceptedTos}
              onCheckedChange={(v) => setAcceptedTos(v === true)}
            />
            <Label htmlFor="tos" className="text-sm font-normal leading-snug">
              I have read and agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Terms of Service
              </a>
              .
            </Label>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit}
          >
            {submitting ? "Saving…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
