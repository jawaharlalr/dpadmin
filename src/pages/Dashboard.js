import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  TrendingUp, Package, Users, IndianRupee, 
  Calendar, Layout, Store, Globe, Loader2 
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="flex items-center justify-between p-6 text-left transition-all bg-white border border-gray-100 shadow-sm rounded-3xl hover:shadow-md">
    <div>
      <p className="mb-1 text-[10px] font-black tracking-widest text-gray-400 uppercase">{title}</p>
      <h3 className="text-3xl font-black text-gray-800">{value}</h3>
      {subtext && <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase italic">{subtext}</p>}
    </div>
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
      <Icon size={28} />
    </div>
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [shopStatus, setShopStatus] = useState({ isOpen: true, onlineOrders: true });
  const [toggling, setToggling] = useState(null);
  
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalProducts: 0,
    activeOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    totalEarnings: 0
  });

  const [waveYear, setWaveYear] = useState(new Date().getFullYear().toString());
  const [waveMonth, setWaveMonth] = useState('All');
  const [barYear, setBarYear] = useState(new Date().getFullYear().toString());
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    // Listen to Orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(orderData);

      let totalEarned = 0; let todayEarned = 0;
      let activeCount = 0; let completedCount = 0;
      const catMap = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      orderData.forEach(order => {
        const orderTotal = Number(order.totalAmount || 0);
        const status = order.status?.toLowerCase();
        
        // Handle different timestamp formats from Firestore
        const date = order.serverTimestamp?.toDate ? order.serverTimestamp.toDate() : new Date(order.createdAt);

        if (status === 'delivered') {
          totalEarned += orderTotal;
          completedCount++;
          if (date >= today) todayEarned += orderTotal;
        }
        if (['placed', 'processing', 'packed', 'out_for_delivery'].includes(status)) activeCount++;

        order.items?.forEach(item => {
          const cat = item.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + (Number(item.qty) || 0);
        });
      });

      setCategoryData(Object.keys(catMap).map(name => ({ name, value: catMap[name] })));
      setStats(prev => ({ ...prev, totalEarnings: totalEarned, todayRevenue: todayEarned, activeOrders: activeCount, completedOrders: completedCount }));
      setLoading(false);
    });

    // Listen to Shop Controls
    const unsubControls = onSnapshot(doc(db, "app_settings", "shop_controls"), (docSnap) => {
      if (docSnap.exists()) setShopStatus(docSnap.data());
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), snap => setStats(s => ({...s, totalUsers: snap.size})));
    const unsubProds = onSnapshot(collection(db, 'products'), snap => setStats(s => ({...s, totalProducts: snap.size})));

    return () => { unsubOrders(); unsubControls(); unsubUsers(); unsubProds(); };
  }, []);

  const toggleControl = async (field) => {
    setToggling(field);
    try {
      const newValue = !shopStatus[field];
      await updateDoc(doc(db, "app_settings", "shop_controls"), { [field]: newValue });
      toast.success(`${field === 'isOpen' ? 'Shop' : 'Ordering'} is now ${newValue ? 'ON' : 'OFF'}`);
    } catch (e) { toast.error("Failed to update status"); }
    setToggling(null);
  };

  // --- LOGIC TO GENERATE DATES FOR X-AXIS ---
  const processWaveData = () => {
    const dataMap = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // 1. Initialize timeline (to show all days even with 0 sales)
    if (waveMonth === 'All') {
      months.forEach((m, idx) => {
        dataMap[m] = { name: m, totalEarnings: 0, orders: 0, sortIdx: idx };
      });
    } else {
      const monthIdx = months.indexOf(waveMonth);
      const daysInMonth = new Date(parseInt(waveYear), monthIdx + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${waveMonth} ${String(i).padStart(2, '0')}`;
        dataMap[dateKey] = { name: dateKey, totalEarnings: 0, orders: 0, sortIdx: i };
      }
    }

    // 2. Fill with Firestore Data
    orders.forEach(order => {
      if (order.status?.toLowerCase() !== 'delivered') return;
      const date = order.serverTimestamp?.toDate ? order.serverTimestamp.toDate() : new Date(order.createdAt);
      const year = date.getFullYear().toString();
      const monthName = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();

      if (year === waveYear) {
        if (waveMonth === 'All') {
          dataMap[monthName].totalEarnings += Number(order.totalAmount || 0);
          dataMap[monthName].orders += 1;
        } else if (monthName === waveMonth) {
          const dateKey = `${waveMonth} ${String(day).padStart(2, '0')}`;
          if (dataMap[dateKey]) {
            dataMap[dateKey].totalEarnings += Number(order.totalAmount || 0);
            dataMap[dateKey].orders += 1;
          }
        }
      }
    });

    return Object.values(dataMap).sort((a, b) => a.sortIdx - b.sortIdx);
  };

  const processBarData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap = months.map(m => ({ name: m, totalEarnings: 0 }));
    orders.forEach(order => {
      if (order.status?.toLowerCase() !== 'delivered') return;
      const date = order.serverTimestamp?.toDate ? order.serverTimestamp.toDate() : new Date(order.createdAt);
      if (date.getFullYear().toString() === barYear) {
        dataMap[date.getMonth()].totalEarnings += Number(order.totalAmount || 0);
      }
    });
    return dataMap;
  };

  const COLORS = ['#FF4D4D', '#FFA500', '#4CAF50', '#2196F3', '#9C27B0'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="mb-4 animate-spin text-brand-orange" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Analytics...</p>
    </div>
  );

  return (
    <div className="pb-10 space-y-8">
      <div className="flex flex-col justify-between gap-6 text-left md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl italic font-black tracking-tighter text-gray-800 uppercase">Finance <span className="text-brand-orange">Dashboard</span></h2>
          <p className="text-sm font-medium tracking-widest text-gray-500 uppercase">Real-time performance metrics</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 p-3 px-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Store size={20} className={shopStatus.isOpen ? 'text-green-500' : 'text-red-500'} />
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase">Shop Status</span><span className="text-xs font-black uppercase">{shopStatus.isOpen ? 'Open' : 'Closed'}</span></div>
            <button onClick={() => toggleControl('isOpen')} disabled={toggling === 'isOpen'} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shopStatus.isOpen ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shopStatus.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 px-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Globe size={20} className={shopStatus.onlineOrders ? 'text-blue-500' : 'text-gray-400'} />
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase">Online Orders</span><span className="text-xs font-black uppercase">{shopStatus.onlineOrders ? 'On' : 'Off'}</span></div>
            <button onClick={() => toggleControl('onlineOrders')} disabled={toggling === 'onlineOrders'} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shopStatus.onlineOrders ? 'bg-blue-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shopStatus.onlineOrders ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Sales" value={`₹${stats.todayRevenue}`} icon={IndianRupee} color="bg-green-600" subtext="Net Sales Today" />
        <StatCard title="Active Orders" value={stats.activeOrders} icon={Package} color="bg-brand-orange" subtext="In Kitchen/Transit" />
        <StatCard title="Total Customers" value={stats.totalUsers} icon={Users} color="bg-blue-600" subtext="Registered Base" />
        <StatCard title="Net Earnings" value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`} icon={TrendingUp} color="bg-purple-600" subtext="Life-time Revenue" />
      </div>

      {/* --- EARNINGS WAVEFORM WITH DATES --- */}
      <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2.5rem]">
        <div className="flex flex-col justify-between gap-4 mb-10 text-left md:flex-row md:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-black tracking-tighter text-gray-800 uppercase"><TrendingUp className="text-brand-red" /> Performance Waveform</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue timeline for {waveMonth === 'All' ? 'Full Year' : waveMonth} {waveYear}</p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
            <select value={waveMonth} onChange={(e) => setWaveMonth(e.target.value)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white border-none rounded-xl focus:ring-0 shadow-sm">
              <option value="All">Full Year</option>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={waveYear} onChange={(e) => setWaveYear(e.target.value)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white border-none rounded-xl focus:ring-0 shadow-sm">
              {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processWaveData()}>
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fill: '#999', fontWeight: '800'}} 
                dy={15} 
                interval={waveMonth === 'All' ? 0 : 2} // Adaptive spacing for daily view
              />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999', fontWeight: 'bold'}} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }}
                itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                formatter={(value, name) => [name === 'totalEarnings' ? `₹${value.toLocaleString('en-IN')}` : value, name === 'totalEarnings' ? "Revenue" : "Orders"]}
              />
              <Area name="totalEarnings" type="monotone" dataKey="totalEarnings" stroke="#FF4D4D" strokeWidth={4} fillOpacity={1} fill="url(#waveGradient)" activeDot={{ r: 6, strokeWidth: 0 }} />
              <Area name="orders" type="monotone" dataKey="orders" stroke="#FFA500" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 text-left lg:grid-cols-3">
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2.5rem] lg:col-span-2">
          <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-black tracking-tighter text-gray-800 uppercase"><Calendar className="text-blue-500" /> Yearly Growth</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly sales comparison</p>
            </div>
            <select value={barYear} onChange={(e) => setBarYear(e.target.value)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-100 border-none rounded-2xl focus:ring-0">{["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processBarData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{fill: '#f8f8f8'}} contentStyle={{borderRadius: '15px'}} formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="totalEarnings" radius={[10, 10, 0, 0]}>
                  {processBarData().map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#60A5FA'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2.5rem]">
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tighter text-gray-800 uppercase"><Layout className="text-purple-500" size={18} /> Category Share</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{item.name}</span>
                </div>
                <span className="px-2 py-1 text-[10px] font-black text-gray-800 rounded-lg bg-gray-50">{item.value} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}