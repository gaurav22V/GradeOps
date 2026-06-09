"use client";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { GraduationCap, UserPlus, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { signupUser, loginUser } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth(); 
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signupUser(email, password, role);
      const authData = await loginUser(email, password);
      login(authData.token, authData.role, authData.email); 
      
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 font-sans text-gray-100 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-10 shadow-2xl backdrop-blur-xl">
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/30">
            <UserPlus className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Join GRADE<span className="text-emerald-500">OPS</span></h1>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400 text-center">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.edu"
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder-gray-700 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder-gray-700 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="ta">Teaching Assistant (Reviewer)</option>
                <option value="instructor">Instructor (Uploader)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-70">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}