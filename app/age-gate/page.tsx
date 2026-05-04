import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AgeGateForm } from "./age-gate-form";

export default async function AgeGatePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (user?.publicMetadata?.ageGateAccepted) {
    redirect("/select-visa");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <AgeGateForm />
    </div>
  );
}
