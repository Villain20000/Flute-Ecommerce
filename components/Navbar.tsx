'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Menu, X, Wind, Search, Heart, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import CartDrawer from './CartDrawer';
import UserAuth from './UserAuth';
import SearchModal from './SearchModal';

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Collection', href: '/products' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const router = useRouter();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-aura-charcoal/80 backdrop-blur-lg border-b border-white/10 py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-aura-gold flex items-center justify-center text-aura-charcoal transition-transform group-hover:scale-110">
              <Wind size={24} />
            </div>
            <span className="text-2xl font-serif font-bold tracking-wider text-gradient-gold">AURA</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium tracking-widest uppercase hover:text-aura-gold transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search size={20} className={isSearchModalOpen ? 'text-aura-gold' : ''} />
              </button>
            </div>

            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-white/5 rounded-full transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={20} className={wishlist.length > 0 ? 'fill-aura-gold text-aura-gold' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-aura-gold text-aura-charcoal text-[8px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <UserAuth />

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <ShoppingBag size={24} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-aura-gold text-aura-charcoal text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-aura-charcoal border-b border-white/10 p-6 md:hidden"
            >
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchModalOpen(true);
                  }} 
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white/40 hover:text-white transition-colors mb-4"
                >
                  <Search size={18} />
                  <span>Search flutes...</span>
                </button>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-serif tracking-widest uppercase py-2 border-b border-white/5"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-sm font-bold uppercase tracking-widest"
                  >
                    <Heart size={16} />
                    Wishlist
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 bg-aura-gold text-aura-charcoal rounded-xl text-sm font-bold uppercase tracking-widest"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
