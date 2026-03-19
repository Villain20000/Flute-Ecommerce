'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  country: string;
  state: string;
  city: string;
  postcode: string;
  shipping: boolean;
}

export interface ShippingMethod {
  id: string;
  type: 'flat_rate' | 'free_shipping' | 'local_pickup';
  title: string;
  cost: number;
  minOrderAmount?: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  methods: ShippingMethod[];
}

export interface StoreSettings {
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

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'store');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/store');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calculateShipping = (country: string, subtotal: number): ShippingMethod[] => {
    if (!settings.shippingZones || settings.shippingZones.length === 0) return [];

    // Find applicable zones (matching country or wildcard '*')
    const applicableZones = settings.shippingZones.filter(zone => 
      zone.regions.includes(country) || zone.regions.includes('*')
    );

    if (applicableZones.length === 0) return [];

    // Combine methods from all applicable zones
    const availableMethods: ShippingMethod[] = [];
    applicableZones.forEach(zone => {
      zone.methods.forEach(method => {
        if (method.type === 'free_shipping') {
          if (!method.minOrderAmount || subtotal >= method.minOrderAmount) {
            availableMethods.push(method);
          }
        } else {
          availableMethods.push(method);
        }
      });
    });

    return availableMethods;
  };

  const calculateTaxes = (country: string, subtotal: number, shippingCost: number = 0) => {
    if (!settings.taxEnabled || !settings.taxRates || settings.taxRates.length === 0) {
      return { totalTax: 0, taxes: [] };
    }

    // Find applicable tax rates
    const applicableRates = settings.taxRates.filter(rate => 
      rate.country === country || rate.country === '*'
    );

    let totalTax = 0;
    const taxes: { name: string; amount: number }[] = [];

    applicableRates.forEach(rate => {
      let taxableAmount = subtotal;
      if (rate.shipping) {
        taxableAmount += shippingCost;
      }

      let taxAmount = 0;
      if (settings.pricesIncludeTax) {
        // Tax is included in the price: Tax = Price - (Price / (1 + Rate))
        taxAmount = taxableAmount - (taxableAmount / (1 + (rate.rate / 100)));
      } else {
        // Tax is added to the price: Tax = Price * Rate
        taxAmount = taxableAmount * (rate.rate / 100);
      }

      totalTax += taxAmount;
      taxes.push({ name: rate.name, amount: taxAmount });
    });

    return { totalTax, taxes };
  };

  return { settings, loading, calculateShipping, calculateTaxes };
}
