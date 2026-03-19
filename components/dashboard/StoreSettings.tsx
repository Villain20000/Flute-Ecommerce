'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  country: string;
  state: string;
  city: string;
  postcode: string;
  shipping: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  methods: ShippingMethod[];
}

interface ShippingMethod {
  id: string;
  type: 'flat_rate' | 'free_shipping' | 'local_pickup';
  title: string;
  cost: number;
  minOrderAmount?: number;
}

interface StoreSettings {
  taxEnabled: boolean;
  pricesIncludeTax: boolean;
  taxRates: TaxRate[];
  shippingZones: ShippingZone[];
}

const DEFAULT_SETTINGS: StoreSettings = {
  taxEnabled: false,
  pricesIncludeTax: false,
  taxRates: [],
  shippingZones: []
};

export default function StoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'tax' | 'shipping'>('tax');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'store');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/store');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'store'), settings);
      alert('Settings saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/store');
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const addTaxRate = () => {
    setSettings(prev => ({
      ...prev,
      taxRates: [
        ...prev.taxRates,
        {
          id: Date.now().toString(),
          name: '',
          rate: 0,
          country: '*',
          state: '*',
          city: '*',
          postcode: '*',
          shipping: false
        }
      ]
    }));
  };

  const removeTaxRate = (id: string) => {
    setSettings(prev => ({
      ...prev,
      taxRates: prev.taxRates.filter(rate => rate.id !== id)
    }));
  };

  const updateTaxRate = (id: string, field: keyof TaxRate, value: any) => {
    setSettings(prev => ({
      ...prev,
      taxRates: prev.taxRates.map(rate => 
        rate.id === id ? { ...rate, [field]: value } : rate
      )
    }));
  };

  const addShippingZone = () => {
    setSettings(prev => ({
      ...prev,
      shippingZones: [
        ...prev.shippingZones,
        {
          id: Date.now().toString(),
          name: 'New Zone',
          regions: [],
          methods: []
        }
      ]
    }));
  };

  const removeShippingZone = (id: string) => {
    setSettings(prev => ({
      ...prev,
      shippingZones: prev.shippingZones.filter(zone => zone.id !== id)
    }));
  };

  const addShippingMethod = (zoneId: string) => {
    setSettings(prev => ({
      ...prev,
      shippingZones: prev.shippingZones.map(zone => 
        zone.id === zoneId ? {
          ...zone,
          methods: [
            ...zone.methods,
            {
              id: Date.now().toString(),
              type: 'flat_rate',
              title: 'Flat Rate',
              cost: 0
            }
          ]
        } : zone
      )
    }));
  };

  const removeShippingMethod = (zoneId: string, methodId: string) => {
    setSettings(prev => ({
      ...prev,
      shippingZones: prev.shippingZones.map(zone => 
        zone.id === zoneId ? {
          ...zone,
          methods: zone.methods.filter(m => m.id !== methodId)
        } : zone
      )
    }));
  };

  const updateShippingMethod = (zoneId: string, methodId: string, field: keyof ShippingMethod, value: any) => {
    setSettings(prev => ({
      ...prev,
      shippingZones: prev.shippingZones.map(zone => 
        zone.id === zoneId ? {
          ...zone,
          methods: zone.methods.map(m => 
            m.id === methodId ? { ...m, [field]: value } : m
          )
        } : zone
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-aura-gold" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold">Store Settings</h2>
          <p className="text-white/40 text-sm">Manage taxes and shipping</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-aura-gold text-aura-charcoal font-bold rounded-lg hover:bg-aura-gold/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 font-bold tracking-widest uppercase text-sm border-b-2 transition-colors ${
            activeTab === 'tax' ? 'border-aura-gold text-aura-gold' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          Tax Settings
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`px-4 py-2 font-bold tracking-widest uppercase text-sm border-b-2 transition-colors ${
            activeTab === 'shipping' ? 'border-aura-gold text-aura-gold' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          Shipping Settings
        </button>
      </div>

      {activeTab === 'tax' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-serif font-bold">Tax Options</h3>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="taxEnabled"
                checked={settings.taxEnabled}
                onChange={(e) => setSettings({ ...settings, taxEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-aura-gold focus:ring-aura-gold focus:ring-offset-aura-charcoal"
              />
              <label htmlFor="taxEnabled" className="text-white/80">Enable taxes and tax calculations</label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="pricesIncludeTax"
                checked={settings.pricesIncludeTax}
                onChange={(e) => setSettings({ ...settings, pricesIncludeTax: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-aura-gold focus:ring-aura-gold focus:ring-offset-aura-charcoal"
              />
              <label htmlFor="pricesIncludeTax" className="text-white/80">Yes, I will enter prices inclusive of tax</label>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif font-bold">Standard Rates</h3>
              <button
                onClick={addTaxRate}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                Add Rate
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                    <th className="p-3 font-medium">Country Code</th>
                    <th className="p-3 font-medium">State Code</th>
                    <th className="p-3 font-medium">Postcode / ZIP</th>
                    <th className="p-3 font-medium">City</th>
                    <th className="p-3 font-medium">Rate %</th>
                    <th className="p-3 font-medium">Tax Name</th>
                    <th className="p-3 font-medium">Shipping</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {settings.taxRates.map((rate) => (
                    <tr key={rate.id} className="border-b border-white/5">
                      <td className="p-2">
                        <input
                          type="text"
                          value={rate.country}
                          onChange={(e) => updateTaxRate(rate.id, 'country', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                          placeholder="*"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rate.state}
                          onChange={(e) => updateTaxRate(rate.id, 'state', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                          placeholder="*"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rate.postcode}
                          onChange={(e) => updateTaxRate(rate.id, 'postcode', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                          placeholder="*"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rate.city}
                          onChange={(e) => updateTaxRate(rate.id, 'city', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                          placeholder="*"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={rate.rate}
                          onChange={(e) => updateTaxRate(rate.id, 'rate', parseFloat(e.target.value))}
                          className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                          step="0.001"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rate.name}
                          onChange={(e) => updateTaxRate(rate.id, 'name', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                          placeholder="VAT"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={rate.shipping}
                          onChange={(e) => updateTaxRate(rate.id, 'shipping', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5 text-aura-gold"
                        />
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => removeTaxRate(rate.id)}
                          className="p-1 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {settings.taxRates.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-white/40 italic">
                        No tax rates defined.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'shipping' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-serif font-bold">Shipping Zones</h3>
            <button
              onClick={addShippingZone}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
            >
              <Plus size={16} />
              Add Zone
            </button>
          </div>

          {settings.shippingZones.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/40 italic">
              No shipping zones defined. Add a zone to configure shipping methods.
            </div>
          ) : (
            settings.shippingZones.map((zone) => (
              <div key={zone.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1 max-w-md">
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-white/60 mb-2">Zone Name</label>
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          shippingZones: prev.shippingZones.map(z => z.id === zone.id ? { ...z, name: e.target.value } : z)
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aura-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-white/60 mb-2">Zone Regions (comma separated)</label>
                      <input
                        type="text"
                        value={zone.regions.join(', ')}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          shippingZones: prev.shippingZones.map(z => z.id === zone.id ? { ...z, regions: e.target.value.split(',').map(r => r.trim()) } : z)
                        }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aura-gold"
                        placeholder="US, CA, GB"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeShippingZone(zone.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-white/80">Shipping Methods</h4>
                    <button
                      onClick={() => addShippingMethod(zone.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-xs"
                    >
                      <Plus size={14} />
                      Add Method
                    </button>
                  </div>

                  <div className="space-y-3">
                    {zone.methods.map((method) => (
                      <div key={method.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                        <select
                          value={method.type}
                          onChange={(e) => updateShippingMethod(zone.id, method.id, 'type', e.target.value)}
                          className="bg-aura-charcoal border border-white/10 rounded px-3 py-1.5 text-sm"
                        >
                          <option value="flat_rate">Flat Rate</option>
                          <option value="free_shipping">Free Shipping</option>
                          <option value="local_pickup">Local Pickup</option>
                        </select>
                        <input
                          type="text"
                          value={method.title}
                          onChange={(e) => updateShippingMethod(zone.id, method.id, 'title', e.target.value)}
                          className="flex-1 bg-aura-charcoal border border-white/10 rounded px-3 py-1.5 text-sm"
                          placeholder="Method Title"
                        />
                        {method.type !== 'free_shipping' && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/40">$</span>
                            <input
                              type="number"
                              value={method.cost}
                              onChange={(e) => updateShippingMethod(zone.id, method.id, 'cost', parseFloat(e.target.value))}
                              className="w-24 bg-aura-charcoal border border-white/10 rounded px-3 py-1.5 text-sm"
                              placeholder="Cost"
                            />
                          </div>
                        )}
                        {method.type === 'free_shipping' && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 text-xs">Min Order: $</span>
                            <input
                              type="number"
                              value={method.minOrderAmount || 0}
                              onChange={(e) => updateShippingMethod(zone.id, method.id, 'minOrderAmount', parseFloat(e.target.value))}
                              className="w-24 bg-aura-charcoal border border-white/10 rounded px-3 py-1.5 text-sm"
                              placeholder="0"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => removeShippingMethod(zone.id, method.id)}
                          className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {zone.methods.length === 0 && (
                      <div className="text-sm text-white/40 italic">No methods added to this zone.</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
