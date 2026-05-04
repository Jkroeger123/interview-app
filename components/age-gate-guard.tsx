"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const EXEMPT_PREFIXES = ["/age-gate", "/sign-in", "/sign-up", "/terms", "/privacy"];

export function AgeGateGuard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (EXEMPT_PREFIXES.some((p) => pathname?.startsWith(p))) return;
    if (user.publicMetadata?.ageGateAccepted) return;
    router.replace("/age-gate");
  }, [isLoaded, isSignedIn, user, pathname, router]);

  return null;
}
