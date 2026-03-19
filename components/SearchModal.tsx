'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-aura-charcoal/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-aura-charcoal border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <Search className="absolute left-6 text-white/40" size={24} />
              <input
                type="text"
                placeholder="Search for masterpieces..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent py-6 pl-16 pr-16 text-xl text-white placeholder:text-white/20 focus:outline-none"
                autoFocus
              />
              <button 
                type="button" 
                onClick={onClose} 
                className="absolute right-6 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </form>
            <div className="px-6 pb-6 pt-2 border-t border-white/5">
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/20 mb-4">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['Professional', 'Silver', 'Gold', 'Beginner', 'Masterpiece'].map(term => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => { 
                      setQuery(term);
                      router.push(`/products?search=${encodeURIComponent(term)}`);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold tracking-widest uppercase transition-colors border border-white/5 text-white/60 hover:text-white"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
