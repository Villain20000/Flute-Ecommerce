'use client';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import SeedButton from '@/components/SeedButton';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'products';
    const q = query(collection(db, path), where('featured', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeaturedProducts(products);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />

      {/* Featured Collection */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="h-[1px] w-8 bg-aura-gold" />
              <span className="text-aura-gold font-serif italic tracking-widest uppercase text-xs">Curated Selection</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold leading-tight">
              Featured <span className="text-gradient-gold">Masterpieces</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase hover:text-aura-gold transition-colors"
          >
            View All Collection
            <div className="w-10 h-[1px] bg-white/20 group-hover:bg-aura-gold transition-all group-hover:w-16" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
            <p className="text-white/40 font-serif italic mb-6">No featured products found.</p>
            <SeedButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Craftsmanship Section */}
      <section className="py-24 bg-white/5 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10">
            <Image
              src="https://picsum.photos/seed/craft/1000/1000"
              alt="Craftsmanship"
              fill
              className="object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-aura-charcoal/40" />
          </div>
          <div>
            <span className="text-aura-gold font-serif italic tracking-widest uppercase text-sm block mb-4">Our Heritage</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 leading-tight">
              Crafted with <span className="text-gradient-gold">Precision</span> and Soul
            </h2>
            <p className="text-white/60 text-lg mb-8 leading-relaxed font-light">
              Every Aura flute is a testament to our commitment to musical excellence. We combine traditional techniques with modern acoustic science to create instruments that respond to your every breath.
            </p>
            <ul className="space-y-4 mb-12">
              {['Hand-finished headjoints', 'Acoustically optimized bore', 'Precision-engineered mechanism'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm tracking-widest uppercase font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-aura-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/about"
              className="inline-block px-10 py-4 bg-white/5 border border-white/20 hover:bg-white/10 rounded-full font-bold tracking-widest uppercase transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/10 bg-aura-charcoal">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-serif font-bold tracking-wider text-gradient-gold">AURA</span>
            </Link>
            <p className="text-white/40 max-w-sm leading-relaxed mb-8">
              Elevating the art of flute making through passion, precision, and a deep understanding of the flutist's journey.
            </p>
            <SeedButton />
          </div>
          <div>
            <h4 className="font-serif font-bold uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li><Link href="/products" className="hover:text-aura-gold transition-colors">Collection</Link></li>
              <li><Link href="/about" className="hover:text-aura-gold transition-colors">Our Story</Link></li>
              <li><Link href="/contact" className="hover:text-aura-gold transition-colors">Contact</Link></li>
              <li><Link href="/shipping" className="hover:text-aura-gold transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-bold uppercase tracking-widest mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-white/40">
              <li>123 Artisan Way, Flute City</li>
              <li>contact@auraflutes.com</li>
              <li>+1 (555) 123-4567</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">
          <p>© 2026 Aura Flutes. All Rights Reserved.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
