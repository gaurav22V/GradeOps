import "./globals.css";
import Link from "next/link";
import { GraduationCap, LayoutDashboard, UploadCloud } from "lucide-react";

export const metadata = {
  title: "GradeOps AI",
  description: "Agentic Examination Grading Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased selection:bg-blue-500/30">
        <div className="flex h-screen flex-col">
          <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-500" />
              <span className="font-mono text-lg font-black tracking-wider text-white">
                GRADE<span className="text-blue-500">OPS</span>
              </span>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <LayoutDashboard className="h-4 w-4" /> TA Dashboard
              </Link>
              <Link href="/instructor" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <UploadCloud className="h-4 w-4" /> Instructor Panel
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-gray-500">v1.0.0-prod</span>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}