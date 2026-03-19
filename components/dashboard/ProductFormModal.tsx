'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Product, ProductAttribute, ProductVariation } from '@/types/product';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  initialData: Partial<Product> | null;
  loading: boolean;
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData, loading }: ProductFormModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Partial<Product>>({
    type: 'simple',
    name: '',
    price: 0,
    category: 'Professional',
    image: '',
    description: '',
    shortDescription: '',
    featured: false,
    specs: [],
    tags: [],
    gallery: [],
    stockStatus: 'in_stock',
    taxStatus: 'taxable',
    attributes: [],
    variations: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: 'simple',
        stockStatus: 'in_stock',
        taxStatus: 'taxable',
        attributes: [],
        variations: [],
        ...initialData
      });
    } else {
      setFormData({
        type: 'simple',
        name: '',
        price: 0,
        category: 'Professional',
        image: '',
        description: '',
        shortDescription: '',
        featured: false,
        specs: [],
        tags: [],
        gallery: [],
        stockStatus: 'in_stock',
        taxStatus: 'taxable',
        attributes: [],
        variations: []
      });
    }
    setActiveTab('general');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleAddAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), { name: '', options: [] }]
    }));
  };

  const handleAttributeChange = (index: number, field: keyof ProductAttribute, value: string) => {
    const newAttributes = [...(formData.attributes || [])];
    if (field === 'options') {
      newAttributes[index].options = value.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      newAttributes[index].name = value;
    }
    setFormData({ ...formData, attributes: newAttributes });
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = [...(formData.attributes || [])];
    newAttributes.splice(index, 1);
    setFormData({ ...formData, attributes: newAttributes });
  };

  const generateVariations = () => {
    if (!formData.attributes || formData.attributes.length === 0) return;
    
    // Simple cartesian product for variations
    const generateCombinations = (attrs: ProductAttribute[], currentIndex: number, currentCombo: Record<string, string>, result: Record<string, string>[]) => {
      if (currentIndex === attrs.length) {
        result.push({ ...currentCombo });
        return;
      }
      const attr = attrs[currentIndex];
      if (!attr.options || attr.options.length === 0) {
        generateCombinations(attrs, currentIndex + 1, currentCombo, result);
        return;
      }
      for (const option of attr.options) {
        currentCombo[attr.name] = option;
        generateCombinations(attrs, currentIndex + 1, currentCombo, result);
      }
    };

    const combinations: Record<string, string>[] = [];
    generateCombinations(formData.attributes, 0, {}, combinations);

    const newVariations: ProductVariation[] = combinations.map((combo, i) => ({
      id: `var_${Date.now()}_${i}`,
      attributes: combo,
      price: formData.price || 0,
      stockStatus: 'in_stock'
    }));

    setFormData({ ...formData, variations: newVariations });
  };

  const handleVariationChange = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = [...(formData.variations || [])];
    newVariations[index] = { ...newVariations[index], [field]: value };
    setFormData({ ...formData, variations: newVariations });
  };

  const handleRemoveVariation = (index: number) => {
    const newVariations = [...(formData.variations || [])];
    newVariations.splice(index, 1);
    setFormData({ ...formData, variations: newVariations });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'attributes', label: 'Attributes' },
    ...(formData.type === 'variable' ? [{ id: 'variations', label: 'Variations' }] : []),
    { id: 'content', label: 'Content & Media' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-aura-charcoal/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-aura-charcoal border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-white/10 bg-white/5 overflow-y-auto shrink-0">
            <div className="p-4 border-b border-white/10">
              <label className="text-[10px] font-bold tracking-widest uppercase text-white/40 block mb-2">Product Type</label>
              <select
                value={formData.type || 'simple'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'simple' | 'variable' })}
                className="w-full bg-aura-charcoal border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-aura-gold/50"
              >
                <option value="simple">Simple Product</option>
                <option value="variable">Variable Product</option>
              </select>
            </div>
            <div className="py-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-aura-gold/10 text-aura-gold border-r-2 border-aura-gold' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="product-form" onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
              
              {/* GENERAL TAB */}
              <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Product Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    />
                  </div>
                  
                  {formData.type === 'simple' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest uppercase text-white/40">Regular Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest uppercase text-white/40">Sale Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.salePrice || ''}
                          onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-white/40">Tax Status</label>
                      <select
                        value={formData.taxStatus || 'taxable'}
                        onChange={(e) => setFormData({ ...formData, taxStatus: e.target.value as any })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      >
                        <option value="taxable">Taxable</option>
                        <option value="shipping">Shipping only</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-white/40">Tax Class</label>
                      <select
                        value={formData.taxClass || 'standard'}
                        onChange={(e) => setFormData({ ...formData, taxClass: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      >
                        <option value="standard">Standard</option>
                        <option value="reduced">Reduced Rate</option>
                        <option value="zero">Zero Rate</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* INVENTORY TAB */}
              <div className={activeTab === 'inventory' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">SKU</label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    />
                  </div>
                  
                  {formData.type === 'simple' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest uppercase text-white/40">Stock Status</label>
                        <select
                          value={formData.stockStatus || 'in_stock'}
                          onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value as any })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="on_backorder">On Backorder</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold tracking-widest uppercase text-white/40">Stock Quantity</label>
                        <input
                          type="number"
                          value={formData.stockQuantity || ''}
                          onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SHIPPING TAB */}
              <div className={activeTab === 'shipping' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Dimensions (cm)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="number"
                        placeholder="Length"
                        value={formData.dimensions?.length || ''}
                        onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: Number(e.target.value), width: formData.dimensions?.width || 0, height: formData.dimensions?.height || 0 } })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      />
                      <input
                        type="number"
                        placeholder="Width"
                        value={formData.dimensions?.width || ''}
                        onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: Number(e.target.value), length: formData.dimensions?.length || 0, height: formData.dimensions?.height || 0 } })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={formData.dimensions?.height || ''}
                        onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: Number(e.target.value), length: formData.dimensions?.length || 0, width: formData.dimensions?.width || 0 } })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Shipping Class</label>
                    <select
                      value={formData.shippingClass || ''}
                      onChange={(e) => setFormData({ ...formData, shippingClass: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    >
                      <option value="">No shipping class</option>
                      <option value="bulky">Bulky Item</option>
                      <option value="fragile">Fragile</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ATTRIBUTES TAB */}
              <div className={activeTab === 'attributes' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  {formData.attributes?.map((attr, index) => (
                    <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold">Attribute {index + 1}</h4>
                        <button type="button" onClick={() => handleRemoveAttribute(index)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold tracking-widest uppercase text-white/40">Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Material"
                            value={attr.name}
                            onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                            className="w-full bg-aura-charcoal border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-aura-gold/50"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold tracking-widest uppercase text-white/40">Values (comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. Silver, Gold, Platinum"
                            value={attr.options.join(', ')}
                            onChange={(e) => handleAttributeChange(index, 'options', e.target.value)}
                            className="w-full bg-aura-charcoal border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-aura-gold/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddAttribute}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Plus size={16} />
                    Add Attribute
                  </button>
                </div>
              </div>

              {/* VARIATIONS TAB */}
              {formData.type === 'variable' && (
                <div className={activeTab === 'variations' ? 'block' : 'hidden'}>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-white/60">Add attributes first, then generate variations.</p>
                      <button
                        type="button"
                        onClick={generateVariations}
                        className="px-4 py-2 bg-aura-gold/10 text-aura-gold hover:bg-aura-gold/20 rounded-lg text-sm font-bold transition-colors"
                      >
                        Generate Variations
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.variations?.map((variation, index) => (
                        <div key={variation.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-aura-gold">
                              {Object.entries(variation.attributes).map(([k, v]) => `${v}`).join(' - ')}
                            </h4>
                            <button type="button" onClick={() => handleRemoveVariation(index)} className="text-red-400 hover:text-red-300">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">SKU</label>
                              <input
                                type="text"
                                value={variation.sku || ''}
                                onChange={(e) => handleVariationChange(index, 'sku', e.target.value)}
                                className="w-full bg-aura-charcoal border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-aura-gold/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Price</label>
                              <input
                                type="number"
                                step="0.01"
                                value={variation.price || ''}
                                onChange={(e) => handleVariationChange(index, 'price', Number(e.target.value))}
                                className="w-full bg-aura-charcoal border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-aura-gold/50"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Stock</label>
                              <select
                                value={variation.stockStatus || 'in_stock'}
                                onChange={(e) => handleVariationChange(index, 'stockStatus', e.target.value)}
                                className="w-full bg-aura-charcoal border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-aura-gold/50"
                              >
                                <option value="in_stock">In Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">Qty</label>
                              <input
                                type="number"
                                value={variation.stockQuantity || ''}
                                onChange={(e) => handleVariationChange(index, 'stockQuantity', Number(e.target.value))}
                                className="w-full bg-aura-charcoal border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-aura-gold/50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT TAB */}
              <div className={activeTab === 'content' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-white/40">Category</label>
                      <select
                        value={formData.category || 'Professional'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Student">Student</option>
                        <option value="Alto">Alto</option>
                        <option value="Bass">Bass</option>
                        <option value="Piccolo">Piccolo</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-widest uppercase text-white/40">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Main Image URL</label>
                    <input
                      required
                      type="text"
                      value={formData.image || ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Gallery URLs (comma separated)</label>
                    <textarea
                      rows={2}
                      value={formData.gallery?.join(',\n') || ''}
                      onChange={(e) => setFormData({ ...formData, gallery: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Short Description</label>
                    <textarea
                      rows={2}
                      value={formData.shortDescription || ''}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-widest uppercase text-white/40">Full Description</label>
                    <textarea
                      rows={6}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured || false}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-aura-gold focus:ring-aura-gold/50"
                    />
                    <label htmlFor="featured" className="text-sm font-medium">Feature this product on the home page</label>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-white/5 shrink-0 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="px-8 py-3 bg-aura-gold text-aura-charcoal rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-aura-gold/90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
