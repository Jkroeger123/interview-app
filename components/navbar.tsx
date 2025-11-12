import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Vysa
        </Link>

        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
