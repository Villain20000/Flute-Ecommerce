'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-aura-charcoal border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag size={24} className="text-aura-gold" />
                <h2 className="text-xl font-serif font-bold tracking-wider uppercase">Your Cart</h2>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                    <ShoppingBag size={40} />
                  </div>
                  <p className="text-white/40 font-serif italic">Your cart is currently empty.</p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase rounded-full hover:scale-105 transition-transform"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-serif font-bold text-lg leading-tight">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {Object.entries(item.attributes).map(([key, value]) => (
                              <span key={key} className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-white/60">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-aura-gold font-mono text-sm mt-1">
                          ${item.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-white/10 rounded-full px-2 py-1 bg-white/5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:text-aura-gold transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:text-aura-gold transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-white/5 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-white/40 text-sm uppercase tracking-widest">Subtotal</span>
                  <span className="text-2xl font-serif font-bold text-aura-gold">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest text-center">
                  Shipping and taxes calculated at checkout
                </p>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full py-4 bg-aura-gold text-aura-charcoal text-center font-bold tracking-widest uppercase rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-aura-gold/20"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
