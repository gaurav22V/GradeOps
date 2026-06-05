"use client";
import { loginUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import Link from 'next/link'; // <-- Added this to make routing work

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // <-- Added this so you can see login errors

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Clear previous errors

    try {
      // 1. Call the API function we just built
      const data = await loginUser(email, password);
      
      // 2. Redirect to the dashboard ONLY after successful login
      if (data.access_token) {
         router.push('/dashboard');
      }
    } catch (err) {
      console.error("Login failed!", err);
      setError("Invalid email or password."); // Show error on screen
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 font-sans text-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-10 shadow-2xl backdrop-blur-xl">
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-900/30">
            <GraduationCap className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            GRADE<span className="text-blue-500">OPS</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Agentic Examination Grading Platform
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          
          {/* Displays error if login fails */}
          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ta@university.edu"
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder-gray-700 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder-gray-700 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Initialize Session
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* --- ADDED SIGN UP LINK HERE --- */}
        <div className="mt-6 border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
          <p>Don't have an account?</p>
          <Link href="/signup" className="mt-2 inline-block font-bold text-blue-500 transition-colors hover:text-blue-400">
            Request Access / Sign Up &rarr;
          </Link>
        </div>
        {/* ------------------------------- */}

        <div className="mt-6 text-center text-xs text-gray-600">
          <p>Demo Access: Use any email containing "instructor" to view the config panel, or anything else for the TA dashboard.</p>
        </div>
      </div>
    </div>
  );
}