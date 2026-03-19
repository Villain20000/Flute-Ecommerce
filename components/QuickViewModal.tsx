'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const router = useRouter();

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-aura-charcoal/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-aura-charcoal border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:h-auto min-h-[300px]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-aura-charcoal/60 to-transparent md:hidden" />
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-aura-gold font-bold">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 text-aura-gold">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-mono">{product.rating || 5.0}</span>
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{product.name}</h2>
              <div className="flex items-center gap-3 mb-6">
                {product.type === 'variable' ? (
                  <p className="text-2xl md:text-3xl font-mono font-light text-white/80">
                    From ${product.price.toLocaleString()}
                  </p>
                ) : product.salePrice ? (
                  <>
                    <p className="text-2xl md:text-3xl font-mono font-light text-aura-gold">
                      ${product.salePrice.toLocaleString()}
                    </p>
                    <p className="text-lg font-mono font-light text-white/40 line-through">
                      ${product.price.toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl md:text-3xl font-mono font-light text-white/80">
                    ${product.price.toLocaleString()}
                  </p>
                )}
              </div>
              
              <p className="text-white/60 leading-relaxed mb-8 line-clamp-4 md:line-clamp-none">
                {product.shortDescription || product.description || "Experience the pinnacle of musical craftsmanship. This instrument has been meticulously designed to offer unparalleled resonance, precise intonation, and a truly expressive tonal palette."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                <button
                  onClick={() => {
                    if (product.type === 'variable') {
                      router.push(`/products/${product.id}`);
                      onClose();
                    } else {
                      addToCart(product);
                      onClose();
                    }
                  }}
                  disabled={product.stockStatus === 'out_of_stock'}
                  className="flex-1 bg-aura-gold text-aura-charcoal py-4 px-6 rounded-full font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-aura-gold/20 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={18} />
                  {product.type === 'variable' ? 'Select Options' : 'Add to Cart'}
                </button>
                <Link
                  href={`/products/${product.id}`}
                  onClick={onClose}
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold tracking-widest uppercase text-xs flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  View Details
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
