import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Resource Hub | Vysa",
  description: "Guides, tips, and references for U.S. visa interviews.",
};

export default function ResourcesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-3xl font-bold">Resource Hub</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Guides, checklists, and tips to help you prepare for your U.S. visa
          interview. New content coming soon.
        </p>
      </main>
      <Footer />
    </div>
  );
}
