'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc, increment } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { ShoppingBag, CreditCard, Truck, CheckCircle2, ArrowRight, Loader2, AlertCircle, Tag, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import AuraGooglePayButton from '@/components/GooglePayButton';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gpay'>('card');
  const [country, setCountry] = useState('US'); // Default to US for now
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | null>(null);
  
  const { settings, loading: settingsLoading } = useStoreSettings();

  // Calculate shipping and taxes
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [availableShippingMethods, setAvailableShippingMethods] = useState<any[]>([]);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (settingsLoading) return;

    // Find applicable shipping zone
    const applicableZone = settings.shippingZones.find(zone => 
      zone.regions.includes(country) || zone.regions.includes('*')
    );

    let methods: any[] = [];
    if (applicableZone && applicableZone.methods.length > 0) {
      methods = applicableZone.methods.filter(m => {
        if (m.type === 'free_shipping') {
          return !m.minOrderAmount || totalPrice >= m.minOrderAmount;
        }
        return true;
      });
    }
    setAvailableShippingMethods(methods);

    if (methods.length > 0) {
      if (!selectedShippingMethodId || !methods.find(m => m.id === selectedShippingMethodId)) {
        setSelectedShippingMethodId(methods[0].id);
      }
    } else {
      setSelectedShippingMethodId(null);
      setShippingCost(0);
    }
  }, [settings, settingsLoading, country, totalPrice]);

  useEffect(() => {
    if (!selectedShippingMethodId || availableShippingMethods.length === 0) {
      setShippingCost(0);
      return;
    }
    const method = availableShippingMethods.find(m => m.id === selectedShippingMethodId);
    if (method) {
      setShippingCost(method.cost || 0);
    } else {
      setShippingCost(0);
    }
  }, [selectedShippingMethodId, availableShippingMethods]);

  useEffect(() => {
    if (settingsLoading) return;
    // Calculate taxes
    if (settings.taxEnabled) {
      const applicableRates = settings.taxRates.filter(rate => 
        rate.country === country || rate.country === '*'
      );

      let totalTax = 0;
      applicableRates.forEach(rate => {
        let taxableAmount = Math.max(0, totalPrice - discountAmount);
        if (rate.shipping) {
          taxableAmount += shippingCost;
        }

        if (settings.pricesIncludeTax) {
          totalTax += taxableAmount - (taxableAmount / (1 + (rate.rate / 100)));
        } else {
          totalTax += taxableAmount * (rate.rate / 100);
        }
      });
      setTaxAmount(totalTax);
    } else {
      setTaxAmount(0);
    }
  }, [settings, settingsLoading, country, totalPrice, shippingCost, discountAmount]);

  // Handle Coupon Application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError('Invalid coupon code');
        setAppliedCoupon(null);
        setDiscountAmount(0);
        return;
      }

      const couponDoc = querySnapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as any;

      if (!coupon.active) {
        setCouponError('This coupon is no longer active');
        return;
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : coupon.expiresAt) < new Date()) {
        setCouponError('This coupon has expired');
        return;
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        setCouponError('This coupon has reached its usage limit');
        return;
      }

      if (coupon.minPurchase && totalPrice < coupon.minPurchase) {
        setCouponError(`Minimum purchase of $${coupon.minPurchase} required`);
        return;
      }

      setAppliedCoupon(coupon);
      
      // Calculate discount
      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = totalPrice * (coupon.value / 100);
      } else {
        discount = coupon.value;
      }
      
      // Ensure discount doesn't exceed total price
      setDiscountAmount(Math.min(discount, totalPrice));
      setCouponCode('');
    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError(null);
  };

  const finalTotal = settings.pricesIncludeTax 
    ? Math.max(0, totalPrice - discountAmount) + shippingCost 
    : Math.max(0, totalPrice - discountAmount) + shippingCost + taxAmount;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePlaceOrder = async (paymentInfo?: { method: string; id: string }) => {
    if (!user) {
      setError("Please sign in to complete your purchase.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const orderData = {
      userId: user.uid,
      items: cart.map(item => ({
        productId: item.productId,
        variationId: item.variationId || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        attributes: item.attributes || null
      })),
      subtotal: totalPrice,
      discountAmount,
      couponCode: appliedCoupon?.code || null,
      shippingCost,
      taxAmount,
      totalAmount: finalTotal,
      status: 'pending',
      paymentMethod: paymentInfo?.method || 'manual_card',
      paymentId: paymentInfo?.id || `manual_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      
      // Update coupon usage count
      if (appliedCoupon) {
        await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
          usedCount: (appliedCoupon.usedCount || 0) + 1
        });
      }

      // Update user's total spent and tier
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentSpent = (userSnap.data().totalSpent || 0) + finalTotal;
        let newTier = 'Bronze';
        if (currentSpent >= 10000) newTier = 'Platinum';
        else if (currentSpent >= 5000) newTier = 'Gold';
        else if (currentSpent >= 1000) newTier = 'Silver';

        await updateDoc(userRef, {
          totalSpent: currentSpent,
          tier: newTier
        });
      }

      setIsSuccess(true);
      clearCart();
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/orders');
      }, 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
      setError("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGooglePaySuccess = (paymentData: any) => {
    console.log('Google Pay Success', paymentData);
    handlePlaceOrder({
      method: 'Google Pay',
      id: paymentData.paymentMethodData.tokenizationData.token || 'gpay_test_token'
    });
  };

  const handleGooglePayError = (error: any) => {
    console.error("Google Pay payment failed:", error);
    setError("Google Pay payment failed. Please try again.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-aura-charcoal flex items-center justify-center">
        <Loader2 className="animate-spin text-aura-gold" size={40} />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-aura-charcoal flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-4xl font-serif font-bold">Order Placed!</h1>
          <p className="text-white/60">
            Thank you for your purchase. Your handcrafted instrument is now being prepared for its journey.
          </p>
          <p className="text-sm text-aura-gold font-mono uppercase tracking-widest">
            Redirecting to your orders...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-24 px-6">
      <Navbar />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Checkout</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">Complete your acquisition</p>
        </div>

        {!user ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Authentication Required</h2>
            <p className="text-white/40 max-w-md mx-auto">
              Please sign in to your account to proceed with the checkout process and track your order.
            </p>
            <div className="flex justify-center">
              {/* The UserAuth component in Navbar handles login, but we can add a prompt here */}
              <p className="text-aura-gold font-bold uppercase tracking-widest text-sm">
                Use the Sign In button in the navigation bar
              </p>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Your Cart is Empty</h2>
            <p className="text-white/40">Add some masterpieces to your collection before checking out.</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase rounded-full">
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Order Summary */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-white/5">
                  <h2 className="font-serif font-bold text-xl uppercase tracking-wider">Order Summary</h2>
                </div>
                <div className="p-6 space-y-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-6">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <h3 className="font-serif font-bold text-lg">{item.name}</h3>
                          {item.attributes && Object.keys(item.attributes).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2 mb-2">
                              {Object.entries(item.attributes).map(([key, value]) => (
                                <span key={key} className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-white/60">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-white/40 text-sm">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-mono text-aura-gold">
                          ${(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-4 text-aura-gold">
                  <Truck size={24} />
                  <h2 className="font-serif font-bold text-xl uppercase tracking-wider">Shipping Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="EU">European Union</option>
                      <option value="*">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Shipping Method</label>
                    {availableShippingMethods.length > 0 ? (
                      <div className="space-y-2">
                        {availableShippingMethods.map(method => (
                          <label key={method.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedShippingMethodId === method.id ? 'border-aura-gold bg-aura-gold/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedShippingMethodId === method.id ? 'border-aura-gold' : 'border-white/40'}`}>
                                {selectedShippingMethodId === method.id && <div className="w-2 h-2 rounded-full bg-aura-gold" />}
                              </div>
                              <span className="text-sm">{method.name}</span>
                            </div>
                            <span className="text-sm font-bold text-aura-gold">
                              {method.cost === 0 ? 'Free' : `$${method.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={method.id}
                              checked={selectedShippingMethodId === method.id}
                              onChange={() => setSelectedShippingMethodId(method.id)}
                              className="hidden"
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm">
                        No shipping methods available for this location.
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Full Name</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white/60">{user.displayName}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Email Address</label>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white/60">{user.email}</div>
                  </div>
                </div>
                <p className="text-xs text-white/30 italic">
                  * Shipping address will be confirmed during the final step of the artisan crafting process.
                </p>
              </section>
            </div>

            {/* Right Column: Payment & Total */}
            <div className="space-y-8">
              <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8 sticky top-32">
                <div className="flex items-center gap-4 text-aura-gold">
                  <CreditCard size={24} />
                  <h2 className="font-serif font-bold text-xl uppercase tracking-wider">Payment</h2>
                </div>

                {/* Payment Method Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'card'
                        ? 'bg-aura-gold/10 border-aura-gold text-aura-gold'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('gpay')}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'gpay'
                        ? 'bg-aura-gold/10 border-aura-gold text-aura-gold'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold">G</span>
                      <span className="text-sm">Pay</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold">Google Pay</span>
                  </button>
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <Tag size={12} />
                    Promo Code
                  </h3>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-aura-gold/10 border border-aura-gold/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Tag size={16} className="text-aura-gold" />
                        <div>
                          <p className="text-sm font-bold text-aura-gold">{appliedCoupon.code}</p>
                          <p className="text-[10px] text-aura-gold/60 uppercase tracking-widest">
                            {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% OFF` : `$${appliedCoupon.value} OFF`}
                          </p>
                        </div>
                      </div>
                      <button onClick={removeCoupon} className="p-1 hover:bg-aura-gold/20 rounded-full text-aura-gold transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50 font-mono uppercase text-sm"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || isApplyingCoupon}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                        >
                          {isApplyingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle size={12} />
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-aura-gold">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    {shippingCost === 0 ? (
                      <span className="text-green-400 uppercase text-xs font-bold tracking-widest">Complimentary</span>
                    ) : (
                      <span>${shippingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    )}
                  </div>
                  {settings.taxEnabled && (
                    <div className="flex justify-between text-white/60">
                      <span>Taxes {settings.pricesIncludeTax ? '(Included)' : ''}</span>
                      <span>${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="h-[1px] bg-white/10 my-4" />
                  <div className="flex justify-between items-end">
                    <span className="text-lg uppercase tracking-widest font-bold">Total</span>
                    <span className="text-3xl font-serif font-bold text-aura-gold">
                      ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                {paymentMethod === 'card' ? (
                  <button
                    onClick={() => handlePlaceOrder()}
                    disabled={isProcessing}
                    className="w-full py-5 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-aura-gold/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                ) : (
                  <AuraGooglePayButton
                    onPaymentSuccess={handleGooglePaySuccess}
                    onPaymentError={handleGooglePayError}
                  />
                )}

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Secure SSL Encryption
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Authenticity Guaranteed
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
