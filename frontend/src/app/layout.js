"use client";
import "./globals.css";
import Link from "next/link";
import { GraduationCap, LayoutDashboard, UploadCloud, LogOut } from "lucide-react";
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { usePathname } from 'next/navigation';

function AppContent({ children }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (loading) return <div className="bg-gray-950 h-screen" />; // Wait for state

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100 antialiased selection:bg-blue-500/30">
      
      {/* Show Navbar ONLY if user is logged in AND not on login/signup page */}
      {user && !isAuthPage && (
        <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-6 shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-500" />
            <span className="font-mono text-lg font-black tracking-wider text-white">
              GRADE<span className="text-blue-500">OPS</span>
            </span>
          </div>
          
          <nav className="flex items-center gap-6">
            {user.role?.toLowerCase() === 'ta' && (
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <LayoutDashboard className="h-4 w-4" /> TA Dashboard
              </Link>
            )}
            {user.role?.toLowerCase() === 'instructor' && (
              <Link href="/instructor" className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <UploadCloud className="h-4 w-4" /> Instructor Panel
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400 font-mono">{user.email}</span>
              <span className="text-[10px] text-blue-500 uppercase tracking-widest">{user.role}</span>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-sm font-bold text-red-500/80 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}