'use client';

import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs } from 'firebase/firestore';
import { Star, User, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FormattedDate from './FormattedDate';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedBuyer: boolean;
  createdAt: any;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(revs);
      
      if (user) {
        setHasReviewed(revs.some(r => r.userId === user.uid));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [productId, user]);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          where('status', 'in', ['delivered', 'shipped'])
        );
        const snapshot = await getDocs(q);
        
        let purchased = false;
        snapshot.forEach(doc => {
          const order = doc.data();
          if (order.items && order.items.some((item: any) => item.productId === productId || item.id === productId)) {
            purchased = true;
          }
        });
        setHasPurchased(purchased);
      } catch (error) {
        console.error("Error checking purchase status:", error);
      }
    };

    checkPurchaseStatus();
  }, [user, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        rating,
        comment,
        verifiedBuyer: hasPurchased,
        createdAt: serverTimestamp()
      });

      // Update product average rating
      const newTotalRating = reviews.reduce((sum, r) => sum + r.rating, 0) + rating;
      const newCount = reviews.length + 1;
      const newAverage = newTotalRating / newCount;

      await updateDoc(doc(db, 'products', productId), {
        rating: newAverage,
        reviewsCount: newCount
      });

      setShowForm(false);
      setComment('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-aura-gold" /></div>;
  }

  return (
    <div className="space-y-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 bg-white/5 border border-white/10 rounded-3xl p-8">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-serif font-bold text-aura-gold">{averageRating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-aura-gold">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} fill={star <= Math.round(averageRating) ? "currentColor" : "none"} className={star <= Math.round(averageRating) ? "text-aura-gold" : "text-white/20"} />
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest font-bold">{reviews.length} Reviews</p>
          </div>
          <div className="hidden md:block w-px h-20 bg-white/10" />
          <div className="space-y-2 flex-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-3 text-white/40">{star}</span>
                  <Star size={12} className="text-aura-gold" fill="currentColor" />
                  <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-aura-gold rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-white/40 text-xs w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {user && !hasReviewed && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-8 py-3 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase text-xs rounded-full hover:bg-aura-gold/90 transition-colors whitespace-nowrap"
          >
            {showForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        )}
        {!user && (
          <p className="text-sm text-white/40">Sign in to leave a review.</p>
        )}
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 overflow-hidden"
          >
            <h3 className="text-xl font-serif font-bold">Review {productName}</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-white/40">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={28}
                      fill={star <= rating ? "currentColor" : "none"}
                      className={star <= rating ? "text-aura-gold" : "text-white/20"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-white/40">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-aura-gold/50 resize-none text-white"
                placeholder="Share your thoughts about this product..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-8 py-3 bg-aura-gold text-aura-charcoal font-bold tracking-widest uppercase text-xs rounded-full hover:bg-aura-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Submit Review
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/40">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white/60" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{review.userName}</p>
                      {review.verifiedBuyer && (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      {review.createdAt ? <FormattedDate date={review.createdAt.toDate ? review.createdAt.toDate().toISOString() : review.createdAt} /> : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= review.rating ? "currentColor" : "none"}
                      className={star <= review.rating ? "text-aura-gold" : "text-white/20"}
                    />
                  ))}
                </div>
              </div>
              <p className="text-white/80 leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
