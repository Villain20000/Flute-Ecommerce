'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['All', 'Professional', 'Masterpiece', 'Artisan', 'Intermediate', 'Student'];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest Arrival' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const path = 'products';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProducts(products);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = allProducts
    .filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesStock = !inStockOnly || p.stockStatus === 'in_stock' || p.stockQuantity > 0;
      return matchesCategory && matchesSearch && matchesPrice && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      // Default: newest (by createdAt if available, otherwise by ID)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <div className="h-[1px] w-8 bg-aura-gold" />
          <span className="text-aura-gold font-serif italic tracking-widest uppercase text-xs">The Collection</span>
          <div className="h-[1px] w-8 bg-aura-gold" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-tight"
        >
          Explore Our <span className="text-gradient-gold">Instruments</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/40 text-lg leading-relaxed font-light"
        >
          From professional masterpieces to student models, each Aura flute is crafted to provide the highest level of musical expression.
        </motion.p>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-8 mb-12">
        <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aura-gold transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search for an instrument..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-aura-gold/50 transition-all placeholder:text-white/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} className="text-white/40" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-4 rounded-full border flex items-center justify-center gap-2 font-bold tracking-widest uppercase text-xs transition-all ${
              showFilters 
                ? 'bg-aura-gold text-aura-charcoal border-aura-gold' 
                : 'bg-white/5 border-white/10 text-white hover:border-white/30'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`relative px-6 py-2 text-[10px] font-bold tracking-widest uppercase transition-all rounded-full ${
                  activeCategory === category ? 'text-aura-charcoal' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeCategory === category && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-aura-gold rounded-full -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {category}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden md:block mx-2" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-white/60 focus:outline-none focus:border-aura-gold/50 transition-colors cursor-pointer appearance-none"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.id} value={option.id} className="bg-aura-charcoal text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-xs font-bold tracking-widest uppercase text-white/40 block mb-4">Price Range</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Min ($)</span>
                    <input 
                      type="number" 
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-aura-gold/50"
                    />
                  </div>
                  <div className="text-white/20 mt-4">-</div>
                  <div className="flex-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1 block">Max ($)</span>
                    <input 
                      type="number" 
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-aura-gold/50"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold tracking-widest uppercase text-white/40 block mb-4">Availability</label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    inStockOnly ? 'bg-aura-gold border-aura-gold' : 'border-white/20 group-hover:border-white/40'
                  }`}>
                    {inStockOnly && <div className="w-2 h-2 bg-aura-charcoal rounded-sm" />}
                  </div>
                  <span className="text-sm text-white/80 group-hover:text-white transition-colors">In Stock Only</span>
                  <input 
                    type="checkbox" 
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button
                onClick={() => {
                  setPriceRange([0, 10000]);
                  setInStockOnly(false);
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                className="text-[10px] font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}

        {(searchQuery || inStockOnly || priceRange[0] > 0 || priceRange[1] < 10000) && (
          <div className="flex items-center justify-center gap-4">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
              {filteredProducts.length} Results Found
            </span>
          </div>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-white/10 rounded-3xl bg-white/5">
          <p className="text-white/40 font-serif italic">No products found matching your criteria.</p>
          <button 
            onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
            className="mt-4 text-aura-gold text-xs font-bold uppercase tracking-widest hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-aura-gold" /></div>}>
        <ProductsContent />
      </Suspense>
    </main>
  );
}

import { Loader2 } from 'lucide-react';
