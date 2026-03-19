'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, doc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { ShoppingBag, Heart, Package, Clock, CheckCircle2, Truck, Ban, Loader2, User, Mail, Calendar, ChevronRight, Search, Award } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import FormattedDate from '@/components/FormattedDate';

interface Order {
  id: string;
  items: any[];
  totalAmount: number;
  subtotal?: number;
  discountAmount?: number;
  couponCode?: string;
  shippingCost?: number;
  taxAmount?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  trackingNumber?: string;
  carrier?: string;
}

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubOrders = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    let unsubProducts: (() => void) | null = null;

    const unsubWishlist = onSnapshot(doc(db, 'wishlist', user.uid), (snap) => {
      if (snap.exists()) {
        const productIds = snap.data().productIds || [];
        setWishlistCount(productIds.length);
        
        // Fetch product details for wishlist
        if (productIds.length > 0) {
          // Unsubscribe from previous products listener if it exists
          if (unsubProducts) unsubProducts();

          const productsQ = query(collection(db, 'products'), where('__name__', 'in', productIds.slice(0, 10)));
          unsubProducts = onSnapshot(productsQ, (pSnap) => {
            const items = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWishlistProducts(items);
          });
        } else {
          if (unsubProducts) unsubProducts();
          setWishlistProducts([]);
        }
      } else {
        if (unsubProducts) unsubProducts();
        setWishlistCount(0);
        setWishlistProducts([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `wishlist/${user.uid}`);
    });

    return () => {
      unsubOrders();
      unsubWishlist();
      if (unsubProducts) unsubProducts();
    };
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-aura-gold" /></div>;
  }

  const statusColors = {
    pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    processing: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    shipped: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
    delivered: 'bg-green-400/10 text-green-400 border-green-400/20',
    cancelled: 'bg-red-400/10 text-red-400 border-red-400/20',
  };

  const getTierProgress = () => {
    const spent = profile?.totalSpent || 0;
    if (spent >= 10000) return { current: 'Platinum', next: null, progress: 100, remaining: 0 };
    if (spent >= 5000) return { current: 'Gold', next: 'Platinum', progress: ((spent - 5000) / 5000) * 100, remaining: 10000 - spent };
    if (spent >= 1000) return { current: 'Silver', next: 'Gold', progress: ((spent - 1000) / 4000) * 100, remaining: 5000 - spent };
    return { current: 'Bronze', next: 'Silver', progress: (spent / 1000) * 100, remaining: 1000 - spent };
  };

  const tierInfo = getTierProgress();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Profile & Stats */}
      <div className="lg:col-span-1 space-y-8">
        {/* Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.name || ''} className="w-24 h-24 rounded-full border-2 border-aura-gold/20 p-1" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-aura-gold/10 flex items-center justify-center border-2 border-aura-gold/20">
                  <User className="text-aura-gold" size={40} />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{profile?.name || user?.displayName}</h2>
              <p className="text-white/40 text-sm">{profile?.email || user?.email}</p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Award className="text-aura-gold" size={18} />
                  <span className="text-white/60">Tier: <span className="text-aura-gold font-bold">{tierInfo.current}</span></span>
                </div>
                {tierInfo.next && (
                  <span className="text-white/40 text-xs">${tierInfo.remaining.toLocaleString()} to {tierInfo.next}</span>
                )}
              </div>
              {tierInfo.next && (
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${tierInfo.progress}%` }}
                    className="h-full bg-aura-gold"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShoppingBag className="text-aura-gold" size={18} />
              <span className="text-white/60">
                Total Spent: <span className="text-white font-bold">${(profile?.totalSpent || 0).toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="text-aura-gold" size={18} />
              <span className="text-white/60">{profile?.email || user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="text-aura-gold" size={18} />
              <span className="text-white/60">Joined <FormattedDate date={profile?.createdAt || ''} /></span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/orders" className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group">
            <ShoppingBag className="text-aura-gold mb-4 group-hover:scale-110 transition-transform" size={24} />
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mt-1">Orders</p>
          </Link>
          <Link href="/wishlist" className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group">
            <Heart className="text-aura-gold mb-4 group-hover:scale-110 transition-transform" size={24} />
            <p className="text-2xl font-bold">{wishlistCount}</p>
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mt-1">Wishlist</p>
          </Link>
          <Link href="/products" className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all group col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <Search className="text-aura-gold mb-4 group-hover:scale-110 transition-transform" size={24} />
                <p className="text-lg font-bold">Find Instruments</p>
                <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mt-1">Explore Collection</p>
              </div>
              <ChevronRight className="text-white/20 group-hover:text-aura-gold transition-colors" size={24} />
            </div>
          </Link>
        </div>
      </div>

      {/* Right Column: Order History */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <Package className="text-aura-gold" />
            Recent Orders
          </h2>
          {orders.length > 0 && (
            <Link href="/orders" className="text-aura-gold text-xs font-bold tracking-widest uppercase hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="text-white/20" size={32} />
            </div>
            <p className="text-white/40">You haven't placed any orders yet.</p>
            <Link 
              href="/products" 
              className="inline-block px-8 py-3 bg-aura-gold text-aura-charcoal rounded-full text-xs font-bold tracking-widest uppercase hover:bg-aura-gold/90 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                      <Package className="text-aura-gold" size={24} />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-white/40">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm font-medium mt-1"><FormattedDate date={order.createdAt} /></p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    {(order.trackingNumber || order.carrier) && (
                      <div className="hidden sm:block text-right mr-4">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-white/40">{order.carrier || 'Carrier'}</p>
                        <p className="text-xs font-mono text-white/60">{order.trackingNumber || 'No tracking number'}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs font-bold tracking-widest uppercase text-white/40">Total</p>
                      <p className="text-lg font-bold text-aura-gold">${order.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase ${statusColors[order.status]}`}>
                      {order.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <Heart className="text-aura-gold" />
            My Wishlist
          </h2>
          {wishlistCount > 0 && (
            <Link href="/wishlist" className="text-aura-gold text-xs font-bold tracking-widest uppercase hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Heart className="text-white/20" size={32} />
            </div>
            <p className="text-white/40">Your wishlist is empty.</p>
            <Link 
              href="/products" 
              className="inline-block px-8 py-3 bg-aura-gold text-aura-charcoal rounded-full text-xs font-bold tracking-widest uppercase hover:bg-aura-gold/90 transition-all"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistProducts.map(product => (
              <Link 
                key={product.id} 
                href={`/products/${product.id}`}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all group"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-white/5">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                  <p className="text-aura-gold font-bold mt-1">${product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
