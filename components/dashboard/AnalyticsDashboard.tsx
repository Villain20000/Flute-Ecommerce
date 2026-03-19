'use client';

import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Package, ShoppingCart, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#D4AF37', '#8B7355', '#C0C0C0', '#A0522D', '#CD853F'];

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalUsers: 0
  });

  useEffect(() => {
    // Fetch Orders for Revenue and Status
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      let totalRev = 0;
      const statusCounts: Record<string, number> = {
        pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
      };
      
      // Group revenue by date (last 7 days simplified)
      const revByDate: Record<string, number> = {};
      
      // Product sales count
      const productSales: Record<string, { name: string, count: number, revenue: number }> = {};

      snap.docs.forEach(doc => {
        const order = doc.data();
        totalRev += order.totalAmount || 0;
        
        if (order.status) {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        }

        // Process date for chart
        if (order.createdAt) {
          const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          revByDate[date] = (revByDate[date] || 0) + (order.totalAmount || 0);
        }

        // Process items for top products
        if (order.items && order.status !== 'cancelled') {
          order.items.forEach((item: any) => {
            if (!productSales[item.productId]) {
              productSales[item.productId] = { name: item.name, count: 0, revenue: 0 };
            }
            productSales[item.productId].count += item.quantity;
            productSales[item.productId].revenue += (item.price * item.quantity);
          });
        }
      });

      // Format Revenue Data
      const formattedRevData = Object.entries(revByDate)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Last 7 days

      // Format Status Data
      const formattedStatusData = Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

      // Format Top Products
      const formattedTopProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setRevenueData(formattedRevData);
      setOrderStatusData(formattedStatusData);
      setTopProducts(formattedTopProducts);
      
      setStats(prev => ({
        ...prev,
        totalRevenue: totalRev,
        totalOrders: snap.size,
        averageOrderValue: snap.size > 0 ? totalRev / snap.size : 0
      }));
    });

    // Fetch Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    // Fetch Low Stock Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const lowStock: any[] = [];
      snap.docs.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as any;
        if (product.type === 'simple' && product.stockQuantity !== undefined && product.stockQuantity <= 5) {
          lowStock.push(product);
        } else if (product.type === 'variable' && product.variations) {
          const hasLowStockVar = product.variations.some((v: any) => v.stockQuantity !== undefined && v.stockQuantity <= 5);
          if (hasLowStockVar) lowStock.push(product);
        }
      });
      setLowStockProducts(lowStock);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubProducts();
    };
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-aura-gold" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp} 
          color="text-aura-gold" 
          bg="bg-aura-gold/10"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={ShoppingCart} 
          color="text-blue-400" 
          bg="bg-blue-400/10"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`$${stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Package} 
          color="text-green-400" 
          bg="bg-green-400/10"
        />
        <StatCard 
          title="Total Customers" 
          value={stats.totalUsers} 
          icon={Users} 
          color="text-purple-400" 
          bg="bg-purple-400/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-aura-gold" size={20} />
            Revenue Overview (Last 7 Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#D4AF37' }}
                  formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="text-aura-gold" size={20} />
            Order Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products Bar Chart */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Package className="text-aura-gold" size={20} />
            Top Products by Revenue
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff40" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <YAxis dataKey="name" type="category" stroke="#ffffff40" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#ffffff20', borderRadius: '8px' }}
                  cursor={{ fill: '#ffffff05' }}
                  formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} />
            Low Stock Alerts
          </h3>
          
          {lowStockProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Package className="text-green-500" size={32} />
              </div>
              <p className="text-white/60">All products are well stocked.</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2" style={{ maxHeight: '320px' }}>
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm line-clamp-1">{product.name}</p>
                      <p className="text-xs text-white/40 font-mono mt-1">SKU: {product.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400">
                      {product.type === 'simple' ? `${product.stockQuantity} Left` : 'Variations Low'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">{title}</p>
        <p className="text-2xl font-serif font-bold">{value}</p>
      </div>
    </div>
  );
}
