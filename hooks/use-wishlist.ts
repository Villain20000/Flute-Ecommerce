'use client';

import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      if (!user) {
        setWishlist([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const path = `wishlist/${userId}`;
    const unsubscribe = onSnapshot(doc(db, 'wishlist', userId), (snapshot) => {
      if (snapshot.exists()) {
        setWishlist(snapshot.data().productIds || []);
      } else {
        setWishlist([]);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const toggleWishlist = async (productId: string) => {
    if (!userId) return;

    const isWishlisted = wishlist.includes(productId);
    const docRef = doc(db, 'wishlist', userId);
    const path = `wishlist/${userId}`;

    try {
      if (wishlist.length === 0 && !isWishlisted) {
        // Create document if it doesn't exist
        await setDoc(docRef, {
          userId,
          productIds: [productId],
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(docRef, {
          productIds: isWishlisted ? arrayRemove(productId) : arrayUnion(productId),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return { wishlist, toggleWishlist, isInWishlist, loading };
}
