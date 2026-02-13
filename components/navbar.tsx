import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { FileText, History, Video } from "lucide-react";
import { CreditBalanceWidget } from "@/components/credits/credit-balance-widget";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Vysa
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/select-visa">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Video className="w-4 h-4 mr-2" />
              Start Interview
            </Button>
          </Link>
          <Link
            href="/documents"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="w-4 h-4" />
            My Documents
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="w-4 h-4" />
            Interview History
          </Link>
          <CreditBalanceWidget />
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
