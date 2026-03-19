import { CheckCircle2, Clock, Package, Truck, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderTimelineProps {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
}

export default function OrderTimeline({ status, trackingNumber, carrier }: OrderTimelineProps) {
  const steps = [
    { id: 'pending', label: 'Order Placed', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getCurrentStepIndex = () => {
    if (status === 'cancelled') return -1;
    return steps.findIndex(s => s.id === status);
  };

  const currentIndex = getCurrentStepIndex();

  if (status === 'cancelled') {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
        <p className="text-red-500 font-bold uppercase tracking-widest text-sm">Order Cancelled</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="relative flex justify-between items-center max-w-3xl mx-auto">
        {/* Connecting Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0" />
        
        {/* Active Line */}
        <motion.div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-aura-gold rounded-full z-0"
          initial={{ width: '0%' }}
          animate={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.2 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                  isCompleted 
                    ? 'bg-aura-gold border-aura-gold text-aura-charcoal' 
                    : 'bg-aura-charcoal border-white/20 text-white/40'
                } ${isCurrent ? 'ring-4 ring-aura-gold/20' : ''}`}
              >
                <Icon size={20} className={isCompleted ? 'text-aura-charcoal' : ''} />
              </motion.div>
              <div className="text-center absolute top-16 w-32 -ml-10">
                <p className={`text-[10px] font-bold tracking-widest uppercase ${
                  isCompleted ? 'text-aura-gold' : 'text-white/40'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {trackingNumber && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-20 p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-aura-gold/10 rounded-full flex items-center justify-center text-aura-gold">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1">Carrier</p>
              <p className="font-bold">{carrier || 'Standard Shipping'}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1">Tracking Number</p>
            <p className="font-mono text-aura-gold">{trackingNumber}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
