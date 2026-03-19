'use client';

import { useAuth } from '@/hooks/use-auth';
import { Loader2, LayoutDashboard, User, ShieldCheck } from 'lucide-react';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import UserDashboard from '@/components/dashboard/UserDashboard';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aura-charcoal">
        <Loader2 className="animate-spin text-aura-gold" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aura-charcoal p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10"
        >
          <div className="w-16 h-16 bg-aura-gold/10 rounded-full flex items-center justify-center mx-auto">
            <User className="text-aura-gold" size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-white/60">Please sign in to view your dashboard.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aura-charcoal pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-aura-gold" />
              Dashboard
            </h1>
            <p className="text-white/60 mt-1">
              Welcome back, {profile?.name || user.displayName}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-2 bg-aura-gold/10 border border-aura-gold/20 rounded-full text-aura-gold text-xs font-bold tracking-widest uppercase">
              <ShieldCheck size={16} />
              Administrator
            </div>
          )}
        </div>

        {isAdmin ? <AdminDashboard /> : <UserDashboard />}
      </div>
    </div>
  );
}
