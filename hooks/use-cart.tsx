'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, ProductVariation } from '@/types/product';

export interface CartItem {
  id: string; // This will be productId_variationId if it's a variation
  productId: string;
  variationId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  attributes?: Record<string, string>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variation?: ProductVariation, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const isLoaded = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoaded.current) {
      const savedCart = localStorage.getItem('aura-flutes-cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error("Failed to parse cart from localStorage", e);
        }
      }
      isLoaded.current = true;
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem('aura-flutes-cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product: Product, variation?: ProductVariation, quantity: number = 1) => {
    setCart(prev => {
      const cartItemId = variation ? `${product.id}_${variation.id}` : product.id;
      const existing = prev.find(item => item.id === cartItemId);
      
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      
      return [...prev, {
        id: cartItemId,
        productId: product.id,
        variationId: variation?.id,
        name: product.name,
        price: variation?.salePrice || variation?.price || product.salePrice || product.price,
        image: variation?.image || product.image,
        quantity,
        attributes: variation?.attributes
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
