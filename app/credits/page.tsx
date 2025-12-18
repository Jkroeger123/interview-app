import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { CreditPackCard } from "@/components/credits/credit-pack-card";
import { CreditBalance } from "@/components/credits/credit-balance";
import { TransactionHistory } from "@/components/credits/transaction-history";
import { CREDIT_PACKS } from "@/lib/stripe-config";
import { Navbar } from "@/components/navbar";

export default async function CreditsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true, credits: true },
  });

  if (!dbUser) {
    // Create user if doesn't exist (fallback)
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return <div>Error: No email found</div>;
    }

    const newUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        email,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
      },
      select: { id: true, credits: true },
    });

    return redirect("/credits");
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Credits</h1>
          <p className="text-muted-foreground">
            Purchase credits to practice your visa interviews
          </p>
        </div>

        {/* Credit Balance */}
        <div className="mb-12">
          <CreditBalance credits={dbUser.credits} />
        </div>

        {/* Credit Packs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-2">Buy Credits</h2>
          <p className="text-muted-foreground mb-6">
            Choose a credit pack that fits your needs. Credits never expire.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_PACKS.map((pack) => (
              <CreditPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <TransactionHistory userId={dbUser.id} />
        </div>
      </div>
    </>
  );
}



