export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} Vysa. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <span className="font-medium">Patent Pending Technology</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
