'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Search, Edit, Trash2, Loader2, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '@/types/product';
import ProductFormModal from './ProductFormModal';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: Partial<Product>) => {
    setLoading(true);

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-aura-gold/50 transition-colors"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-aura-gold text-aura-charcoal rounded-xl text-sm font-bold tracking-widest uppercase hover:bg-aura-gold/90 transition-all"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">Product</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">SKU</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">Stock</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40">Price</th>
              <th className="px-6 py-4 text-xs font-bold tracking-widest uppercase text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-white/10" />
                    <div>
                      <span className="font-medium block">{product.name}</span>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">{product.type || 'simple'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-white/60">{product.sku || '-'}</td>
                <td className="px-6 py-4">
                  {product.type === 'variable' ? (
                    <span className="text-sm text-white/60">Variable</span>
                  ) : product.stockStatus === 'in_stock' ? (
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold tracking-widest uppercase rounded">In Stock ({product.stockQuantity || 0})</span>
                  ) : product.stockStatus === 'out_of_stock' ? (
                    <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold tracking-widest uppercase rounded">Out of Stock</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold tracking-widest uppercase rounded">Backorder</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-aura-gold">
                  {product.type === 'variable' ? (
                    <span className="text-white/60 font-normal text-xs">Variable Price</span>
                  ) : product.salePrice ? (
                    <div className="flex flex-col">
                      <span>${product.salePrice}</span>
                      <span className="text-[10px] text-white/40 line-through">${product.price}</span>
                    </div>
                  ) : (
                    `$${product.price}`
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(product)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        initialData={editingProduct}
        loading={loading}
      />
    </div>
  );
}
