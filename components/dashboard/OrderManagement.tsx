'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { ShoppingBag, Search, Loader2, Clock, Truck, PackageCheck, Ban, CheckCircle2, MoreVertical, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FormattedDate from '@/components/FormattedDate';

interface Order {
  id: string;
  userId: string;
  items: any[];
  subtotal?: number;
  discountAmount?: number;
  couponCode?: string;
  shippingCost?: number;
  taxAmount?: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod?: string;
  paymentId?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [orderToShip, setOrderToShip] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (newStatus === 'shipped') {
      setOrderToShip(orderId);
      setTrackingNumber('');
      setCarrier('');
      setTrackingModalOpen(true);
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const submitTracking = async () => {
    if (!orderToShip) return;
    try {
      await updateDoc(doc(db, 'orders', orderToShip), { 
        status: 'shipped',
        trackingNumber: trackingNumber || null,
        carrier: carrier || null
      });
      setTrackingModalOpen(false);
      setOrderToShip(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderToShip}`);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    processing: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    shipped: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
    delivered: 'bg-green-400/10 text-green-400 border-green-400/20',
    cancelled: 'bg-red-400/10 text-red-400 border-red-400/20',
  };

  const statusIcons = {
    pending: Clock,
    processing: PackageCheck,
    shipped: Truck,
    delivered: CheckCircle2,
    cancelled: Ban,
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-aura-gold/50 transition-colors"
        />
      </div>

      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">Order ID</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">Date</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">Amount</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">Status</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-white/60">#{order.id.slice(0, 8)}...</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <FormattedDate date={order.createdAt} />
                </td>
                <td className="px-6 py-4 text-sm font-bold text-aura-gold">
                  ${order.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase ${statusColors[order.status]}`}>
                    {(() => {
                      const Icon = statusIcons[order.status];
                      return <Icon size={12} />;
                    })()}
                    {order.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    >
                      <Eye size={16} />
                    </button>
                    <div className="relative group">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                        <MoreVertical size={16} />
                      </button>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-aura-charcoal border border-white/10 rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
                        {Object.keys(statusColors).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status as any)}
                            className={`w-full text-left px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-lg transition-colors hover:bg-white/5 ${order.status === status ? 'text-aura-gold' : 'text-white/60'}`}
                          >
                            Mark as {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-aura-charcoal/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-aura-charcoal border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Order Details</h2>
                  <p className="text-sm text-white/40 font-mono mt-1">ID: {selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest uppercase text-white/40">Customer ID</p>
                    <p className="text-sm font-mono">{selectedOrder.userId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest uppercase text-white/40">Date</p>
                    <p className="text-sm"><FormattedDate date={selectedOrder.createdAt} /></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest uppercase text-white/40">Payment Method</p>
                    <p className="text-sm">{selectedOrder.paymentMethod || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest uppercase text-white/40">Status</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase ${statusColors[selectedOrder.status]}`}>
                      {selectedOrder.status}
                    </div>
                  </div>
                  {(selectedOrder.trackingNumber || selectedOrder.carrier) && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs font-bold tracking-widest uppercase text-white/40">Tracking Information</p>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
                        <Truck className="text-aura-gold" size={24} />
                        <div>
                          <p className="text-sm font-bold">{selectedOrder.carrier || 'Carrier Not Specified'}</p>
                          <p className="text-xs text-white/60 font-mono mt-1">{selectedOrder.trackingNumber || 'No tracking number provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-bold tracking-widest uppercase text-white/40">Items</p>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-white/10" />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(item.attributes).map(([key, value]) => (
                                  <span key={key} className="text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-white/60">
                                    {key}: {value as string}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-white/40 mt-1">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-bold text-aura-gold">${(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-3">
                  {selectedOrder.subtotal !== undefined && (
                    <div className="flex justify-between items-center text-sm text-white/60">
                      <p>Subtotal</p>
                      <p>${selectedOrder.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {selectedOrder.discountAmount !== undefined && selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm text-aura-gold">
                      <p>Discount ({selectedOrder.couponCode})</p>
                      <p>-${selectedOrder.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {selectedOrder.shippingCost !== undefined && (
                    <div className="flex justify-between items-center text-sm text-white/60">
                      <p>Shipping</p>
                      <p>{selectedOrder.shippingCost === 0 ? 'Complimentary' : `$${selectedOrder.shippingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
                    </div>
                  )}
                  {selectedOrder.taxAmount !== undefined && selectedOrder.taxAmount > 0 && (
                    <div className="flex justify-between items-center text-sm text-white/60">
                      <p>Taxes</p>
                      <p>${selectedOrder.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <p className="text-lg font-bold">Total Amount</p>
                    <p className="text-2xl font-bold text-aura-gold">${selectedOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      <AnimatePresence>
        {trackingModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTrackingModalOpen(false)}
              className="absolute inset-0 bg-aura-charcoal/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-aura-charcoal border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">Add Tracking Info</h2>
                <button onClick={() => setTrackingModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-white/40">Carrier (e.g., FedEx, UPS)</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    placeholder="Enter carrier name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-white/40">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    placeholder="Enter tracking number"
                  />
                </div>
                <button
                  onClick={submitTracking}
                  className="w-full py-3 bg-aura-gold text-aura-charcoal rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-aura-gold/90 transition-all mt-4"
                >
                  Mark as Shipped
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
