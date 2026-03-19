'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Tag, Plus, Search, Edit, Trash2, Loader2, X, Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FormattedDate from '../FormattedDate';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: any;
  active: boolean;
  createdAt: any;
}

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
      setCoupons(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'coupons');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCode(coupon.code);
      setType(coupon.type);
      setValue(coupon.value.toString());
      setMinPurchase(coupon.minPurchase?.toString() || '');
      setMaxUses(coupon.maxUses?.toString() || '');
      setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : coupon.expiresAt).toISOString().split('T')[0] : '');
      setActive(coupon.active);
    } else {
      setEditingCoupon(null);
      setCode('');
      setType('percentage');
      setValue('');
      setMinPurchase('');
      setMaxUses('');
      setExpiresAt('');
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const couponData = {
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minPurchase: minPurchase ? Number(minPurchase) : null,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), couponData);
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...couponData,
          usedCount: 0,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingCoupon ? OperationType.UPDATE : OperationType.CREATE, 'coupons');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `coupons/${id}`);
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', id), { active: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `coupons/${id}`);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-aura-gold" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-aura-gold/50"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-aura-gold text-aura-charcoal rounded-xl font-bold tracking-widest uppercase text-xs hover:bg-aura-gold/90 transition-colors"
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 font-bold tracking-widest uppercase text-[10px] text-white/40">Code</th>
                <th className="p-4 font-bold tracking-widest uppercase text-[10px] text-white/40">Discount</th>
                <th className="p-4 font-bold tracking-widest uppercase text-[10px] text-white/40">Usage</th>
                <th className="p-4 font-bold tracking-widest uppercase text-[10px] text-white/40">Expires</th>
                <th className="p-4 font-bold tracking-widest uppercase text-[10px] text-white/40">Status</th>
                <th className="p-4 font-bold tracking-widest uppercase text-[10px] text-white/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-aura-gold" />
                      <span className="font-mono font-bold bg-white/10 px-2 py-1 rounded">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                    {coupon.minPurchase && <span className="block text-[10px] text-white/40 font-normal mt-1">Min: ${coupon.minPurchase}</span>}
                  </td>
                  <td className="p-4">
                    <span className="font-mono">{coupon.usedCount}</span>
                    {coupon.maxUses && <span className="text-white/40"> / {coupon.maxUses}</span>}
                  </td>
                  <td className="p-4 text-white/60">
                    {coupon.expiresAt ? <FormattedDate date={coupon.expiresAt} /> : 'Never'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(coupon.id, coupon.active)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors ${
                        coupon.active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/10 text-white/40 border border-white/20'
                      }`}
                    >
                      {coupon.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(coupon)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/40">
                    No coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-aura-charcoal/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-aura-charcoal border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold">
                  {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-white/40">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50 font-mono uppercase"
                    placeholder="e.g., SUMMER20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Discount Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50 appearance-none"
                    >
                      <option value="percentage" className="bg-aura-charcoal">Percentage (%)</option>
                      <option value="fixed" className="bg-aura-charcoal">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step={type === 'percentage' ? '1' : '0.01'}
                      max={type === 'percentage' ? '100' : undefined}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      placeholder={type === 'percentage' ? '20' : '50.00'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Min. Purchase ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Max Uses</label>
                    <input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-widest uppercase text-white/40">Expiry Date</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                  />
                  <p className="text-[10px] text-white/40">Leave blank for no expiry.</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    active ? 'bg-aura-gold border-aura-gold' : 'border-white/20'
                  }`}>
                    {active && <Check size={14} className="text-aura-charcoal" />}
                  </div>
                  <span className="text-sm">Active</span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="hidden"
                  />
                </label>

                <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-aura-gold text-aura-charcoal rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-aura-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
