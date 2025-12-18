"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreditBalanceWidget() {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/credits/balance");
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Coins className="size-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <Link href="/credits">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950"
      >
        <Coins className="size-4 text-yellow-500" />
        <span className="font-semibold">{credits ?? 0}</span>
        <span className="text-muted-foreground">credits</span>
      </Button>
    </Link>
  );
}



