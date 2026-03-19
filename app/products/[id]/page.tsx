'use client';

import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Minus, Shield, Truck, RotateCcw, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Product, ProductVariation } from '@/types/product';
import ProductReviews from '@/components/ProductReviews';

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isWishlisted = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    if (!id) return;
    const path = `products/${id}`;
    const unsubscribe = onSnapshot(doc(db, 'products', id as string), (snapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() } as Product;
        setProduct(data);
        
        // Auto-select first available variation if it's a variable product
        if (data.type === 'variable' && data.variations && data.variations.length > 0) {
          const firstVariation = data.variations[0];
          setSelectedAttributes(firstVariation.attributes);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const selectedVariation = useMemo(() => {
    if (product?.type !== 'variable' || !product.variations) return null;
    return product.variations.find(v => 
      Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
    );
  }, [product, selectedAttributes]);

  const currentPrice = selectedVariation?.salePrice || selectedVariation?.price || product?.salePrice || product?.price || 0;
  const originalPrice = selectedVariation?.price || product?.price || 0;
  const isOnSale = currentPrice < originalPrice;
  const currentImage = selectedVariation?.image || product?.image || '';
  const currentStockStatus = selectedVariation?.stockStatus || product?.stockStatus || 'in_stock';
  const isOutOfStock = currentStockStatus === 'out_of_stock';

  const handleAttributeSelect = (attributeName: string, option: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: option
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.type === 'variable' && !selectedVariation) {
      alert('Please select all options before adding to cart.');
      return;
    }
    addToCart(product, selectedVariation || undefined, quantity);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-aura-charcoal flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-aura-gold/20 border-t-aura-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-aura-charcoal flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-serif font-bold mb-4">Product Not Found</h1>
        <p className="text-white/40 mb-8">The instrument you are looking for does not exist or has been removed.</p>
        <Link href="/products" className="px-8 py-3 bg-aura-gold text-aura-charcoal font-bold rounded-full uppercase tracking-widest">
          Back to Collection
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-6">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div 
              className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-white/5 cursor-crosshair group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              {isOnSale && (
                <div className="absolute top-4 left-4 z-10 bg-aura-gold text-aura-charcoal text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Sale
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Out of Stock
                </div>
              )}
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className={`object-cover transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                style={isZoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : {}}
                priority
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Gallery (if available) */}
            {product.gallery && product.gallery.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-aura-gold transition-colors">
                  <Image src={product.image} alt={product.name} fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                {product.gallery.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer hover:border-aura-gold transition-colors">
                    <Image src={img} alt={`${product.name} gallery ${idx}`} fill className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <span className="text-aura-gold font-serif italic tracking-widest uppercase text-sm block mb-4">
                {product.category} Collection
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-3xl font-mono font-light text-white">
                  ${currentPrice.toLocaleString()}
                </p>
                {isOnSale && (
                  <p className="text-xl font-mono font-light text-white/40 line-through">
                    ${originalPrice.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <p className="text-white/60 text-lg leading-relaxed font-light">
              {product.shortDescription || product.description}
            </p>

            {/* Variations */}
            {product.type === 'variable' && product.attributes && (
              <div className="space-y-6 py-6 border-y border-white/10">
                {product.attributes.map((attribute) => (
                  <div key={attribute.name} className="space-y-3">
                    <label className="text-xs uppercase tracking-widest font-bold text-white/60">
                      {attribute.name}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {attribute.options.map((option) => {
                        const isSelected = selectedAttributes[attribute.name] === option;
                        return (
                          <button
                            key={option}
                            onClick={() => handleAttributeSelect(attribute.name, option)}
                            className={`px-4 py-2 rounded-full border text-sm transition-all ${
                              isSelected 
                                ? 'border-aura-gold bg-aura-gold/10 text-aura-gold' 
                                : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center border border-white/20 rounded-full px-4 py-2 bg-white/5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:text-aura-gold transition-colors text-white/60"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-mono">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:text-aura-gold transition-colors text-white/60"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || (product.type === 'variable' && !selectedVariation)}
                className="flex-1 px-8 py-4 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-aura-gold/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={`px-6 py-4 border font-bold tracking-widest uppercase rounded-full transition-all flex items-center justify-center gap-3 ${
                  isWishlisted 
                    ? 'bg-aura-gold/10 border-aura-gold text-aura-gold' 
                    : 'border-white/20 hover:bg-white/5 text-white'
                }`}
              >
                <Heart size={20} className={isWishlisted ? 'fill-aura-gold' : ''} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Shield size={24} className="text-aura-gold" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Lifetime Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Truck size={24} className="text-aura-gold" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Global Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <RotateCcw size={24} className="text-aura-gold" />
                <span className="text-[10px] uppercase tracking-widest font-bold">30-Day Returns</span>
              </div>
            </div>

            {/* Additional Information */}
            <div className="pt-12">
              <h2 className="text-2xl font-serif font-bold mb-6">Additional Information</h2>
              <div className="space-y-4">
                {product.weight && (
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Weight</span>
                    <span className="font-mono">{product.weight} kg</span>
                  </div>
                )}
                {product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height) && (
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">Dimensions</span>
                    <span className="font-mono">
                      {product.dimensions.length || 0} × {product.dimensions.width || 0} × {product.dimensions.height || 0} cm
                    </span>
                  </div>
                )}
                {product.attributes && product.attributes.map(attr => (
                  <div key={attr.name} className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-white/60">{attr.name}</span>
                    <span className="text-right">{attr.options.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 pt-12 border-t border-white/10">
          <h2 className="text-3xl font-serif font-bold mb-12 text-center">Customer Reviews</h2>
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </div>
    </main>
  );
}
