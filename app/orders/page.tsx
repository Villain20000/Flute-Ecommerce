'use client';

import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { ShoppingBag, Package, Calendar, Clock, ChevronRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import FormattedDate from '@/components/FormattedDate';
import OrderTimeline from '@/components/OrderTimeline';

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const path = 'orders';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribeOrders();
  }, [user]);

  if (loading) {
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
        <div className="mb-12">
          <Link href="/products" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 uppercase tracking-widest text-xs font-bold">
            <ArrowLeft size={16} />
            Back to Collection
          </Link>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">My Orders</h1>
          <p className="text-white/40 uppercase tracking-widest text-sm">Track your acquisition history</p>
        </div>

        {!user ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Authentication Required</h2>
            <p className="text-white/40 max-w-md mx-auto">
              Please sign in to view your order history and track current acquisitions.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold">No Orders Yet</h2>
            <p className="text-white/40">You haven't placed any orders yet. Start your journey by exploring our collection.</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase rounded-full">
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6 md:p-8 border-b border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-aura-gold/10 text-aura-gold rounded-full flex items-center justify-center">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Order ID</p>
                      <p className="font-mono text-sm">{order.id}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-white/20" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Date</p>
                        <p className="text-sm"><FormattedDate date={order.createdAt} /></p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Total</p>
                      <p className="text-xl font-serif font-bold text-aura-gold">${order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-6 md:p-8 border-b border-white/10">
                  <OrderTimeline status={order.status} trackingNumber={order.trackingNumber} carrier={order.carrier} />
                </div>

                {/* Order Items */}
                <div className="p-6 md:p-8 space-y-6">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-6 group">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <h3 className="font-serif font-bold text-lg">{item.name}</h3>
                          <p className="text-white/40 text-sm">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-mono text-white/60">
                          ${item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                  <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-aura-gold hover:text-white transition-colors">
                    View Details
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
