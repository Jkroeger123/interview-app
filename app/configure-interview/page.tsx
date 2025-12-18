import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Navbar } from "@/components/navbar";
import { ConfigureInterviewClient } from "@/components/interview/configure-interview-client";
import { getUserCredits } from "@/server/credit-actions";

export default async function ConfigureInterviewPage() {
  // Server-side auth check
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user credits on the server (no useEffect needed!)
  const userCredits = await getUserCredits();

  return (
    <>
      <Navbar />
      <ConfigureInterviewClient userCredits={userCredits} />
    </>
  );
}
