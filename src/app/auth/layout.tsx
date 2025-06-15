import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | AIVY LXP",
  },
  description: "Authentication pages for AIVY Learning Experience Platform",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} AIVY Learning Experience Platform. All rights reserved.</p>
      </footer>
    </div>
  );
} 