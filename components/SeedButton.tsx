'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Database, Check, Loader2, AlertCircle } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';

const INITIAL_PRODUCTS = [
  {
    name: "Aura Silver Pro",
    price: 3499,
    category: "Professional",
    image: "https://picsum.photos/seed/flute1/800/1000",
    description: "Hand-finished solid silver headjoint and body. Exceptional response and tonal colors.",
    featured: true,
    rating: 4.9,
    specs: ["Solid Silver", "B Foot", "Open Hole", "Offset G"]
  },
  {
    name: "Golden Aura Master",
    price: 12999,
    category: "Masterpiece",
    image: "https://picsum.photos/seed/flute2/800/1000",
    description: "14K Gold body with silver mechanism. The pinnacle of flute craftsmanship.",
    featured: true,
    rating: 5.0,
    specs: ["14K Gold", "B Foot", "Soldered Tone Holes", "E Mechanism"]
  },
  {
    name: "Artisan Wood Flute",
    price: 5499,
    category: "Artisan",
    image: "https://picsum.photos/seed/flute3/800/1000",
    description: "Grenadilla wood body with silver keys. Warm, organic sound for chamber music.",
    featured: true,
    rating: 4.8,
    specs: ["Grenadilla Wood", "Silver Keys", "C Foot", "Inline G"]
  },
  {
    name: "Aura Student Solo",
    price: 899,
    category: "Student",
    image: "https://picsum.photos/seed/flute4/800/1000",
    description: "Silver-plated body with easy-response headjoint. Perfect for beginners.",
    featured: false,
    rating: 4.7,
    specs: ["Silver Plated", "C Foot", "Closed Hole", "Offset G"]
  }
];

export default function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const seedData = async () => {
    if (!user) {
      setError("Please sign in to seed the database.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    const path = 'products';
    try {
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((product) => {
        const newDocRef = doc(collection(db, path));
        batch.set(newDocRef, {
          ...product,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err: any) {
      if (err.message.includes('insufficient permissions')) {
        setError("Admin permissions required to seed.");
      } else {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={seedData}
        disabled={loading || done}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-xs font-mono uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : done ? <Check size={14} className="text-green-400" /> : <Database size={14} />}
        {loading ? 'Seeding...' : done ? 'Database Seeded' : 'Seed Database'}
      </button>
      {error && (
        <div className="flex items-center gap-2 text-[10px] text-red-400 uppercase tracking-wider font-bold animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
