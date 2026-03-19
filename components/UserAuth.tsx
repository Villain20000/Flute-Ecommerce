'use client';

import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { LogIn, LogOut, User as UserIcon, Loader2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export default function UserAuth() {
  const { user, profile, loading } = useAuth();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return <Loader2 className="animate-spin text-white/20" size={20} />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-bold tracking-wider uppercase">{profile?.name || user.displayName}</span>
          <span className="text-[10px] text-white/40">{profile?.email || user.email}</span>
        </div>
        <div className="relative group">
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            {profile?.photoURL || user.photoURL ? (
              <img src={profile?.photoURL || user.photoURL || ''} alt={profile?.name || user.displayName || 'User'} className="w-6 h-6 rounded-full border border-white/10" />
            ) : (
              <UserIcon size={20} />
            )}
          </button>
          <div className="absolute top-full right-0 mt-2 w-48 bg-aura-charcoal border border-white/10 rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
            <Link
              href="/dashboard"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <div className="h-[1px] bg-white/10 my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors text-red-400"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-xs font-bold tracking-widest uppercase"
    >
      <LogIn size={16} />
      Sign In
    </button>
  );
}
