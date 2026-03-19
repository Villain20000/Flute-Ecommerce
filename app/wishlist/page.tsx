'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { useWishlist } from '@/hooks/use-wishlist';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { motion } from 'motion/react';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const path = 'products';
      try {
        // Firestore 'in' query supports up to 10 IDs, but for this demo we'll assume it's fine or handle chunks
        const q = query(collection(db, path), where(documentId(), 'in', wishlist));
        const snapshot = await getDocs(q);
        const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetchedProducts);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      } finally {
        setLoading(false);
      }
    };

    if (!wishlistLoading) {
      fetchWishlistProducts();
    }
  }, [wishlist, wishlistLoading]);

  if (wishlistLoading || (loading && wishlist.length > 0)) {
    return (
      <div className="min-h-screen bg-aura-charcoal flex items-center justify-center">
        <Loader2 className="animate-spin text-aura-gold" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-6">
      <Navbar />
      
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <Heart size={20} className="text-aura-gold fill-aura-gold" />
            <span className="text-aura-gold font-serif italic tracking-widest uppercase text-xs">Your Collection</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Wishlist</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">Instruments you've fallen in love with</p>
        </header>

        {wishlist.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 md:p-24 text-center space-y-8">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10">
              <Heart size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-serif font-bold">Your wishlist is empty</h2>
              <p className="text-white/40 max-w-md mx-auto">
                Explore our collection of handcrafted flutes and save your favorites here for later.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 px-10 py-4 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase rounded-full hover:scale-105 transition-all shadow-xl shadow-aura-gold/20"
            >
              Browse Collection
              <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
