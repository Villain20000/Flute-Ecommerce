'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Eye, Star, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import QuickViewModal from './QuickViewModal';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  return (
    <>
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-aura-gold/5"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-aura-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {product.salePrice && (
            <span className="bg-aura-gold text-aura-charcoal px-2 py-1 text-[10px] font-bold tracking-widest uppercase rounded">
              Sale
            </span>
          )}
          {product.stockStatus === 'out_of_stock' && (
            <span className="bg-red-500 text-white px-2 py-1 text-[10px] font-bold tracking-widest uppercase rounded">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Toggle */}
        <button
          onClick={() => toggleWishlist(product.id)}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
            isWishlisted 
              ? 'bg-aura-gold text-aura-charcoal' 
              : 'bg-black/20 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100'
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} className={isWishlisted ? 'fill-aura-charcoal' : ''} />
        </button>

        {/* Quick Actions */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => addToCart(product)}
            disabled={product.stockStatus === 'out_of_stock' || product.type === 'variable'}
            className="flex-1 bg-aura-gold text-aura-charcoal py-3 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
            {product.type === 'variable' ? 'Select Options' : 'Quick Add'}
          </button>
          <button
            onClick={() => setIsQuickViewOpen(true)}
            className="w-12 h-12 bg-white/10 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <Eye size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-aura-gold font-bold">
            {product.category}
          </span>
          <div className="flex items-center gap-1 text-aura-gold">
            <Star size={12} fill="currentColor" />
            <span className="text-xs font-mono">{product.rating || 5.0}</span>
          </div>
        </div>
        <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-aura-gold transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-3">
          {product.type === 'variable' ? (
            <p className="text-2xl font-mono font-light text-white/80">
              From ${product.price.toLocaleString()}
            </p>
          ) : product.salePrice ? (
            <>
              <p className="text-2xl font-mono font-light text-aura-gold">
                ${product.salePrice.toLocaleString()}
              </p>
              <p className="text-sm font-mono font-light text-white/40 line-through">
                ${product.price.toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-2xl font-mono font-light text-white/80">
              ${product.price.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
    <QuickViewModal isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} product={product} />
    </>
  );
}
