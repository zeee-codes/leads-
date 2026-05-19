import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prowider — B2B Lead Distribution Engine",
  description: "Automated fair lead distribution and real-time provider dashboard.",
};

export default function RootLayout({
  children,
  ...props
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col font-sans antialiased text-slate-100 bg-[#080a10]">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent tracking-wide">
                PROWIDER
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full uppercase tracking-wider">
                B2B Engine
              </span>
            </div>
            
            <nav className="flex items-center gap-1 sm:gap-4">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
              >
                Intake Form
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors hover:bg-white/5 rounded-lg flex items-center gap-1.5"
              >
                Dashboard
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </Link>
              <Link
                href="/test-tools"
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors hover:bg-white/5 rounded-lg border border-slate-700 hover:border-indigo-500"
              >
                Test Panel
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-white/5 bg-slate-950/20 mt-auto text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            Prowider Mini Lead Distribution Engine &copy; {new Date().getFullYear()} · All rights reserved.
          </div>
        </footer>

        {/* Global Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
export const dynamic = "force-dynamic";
