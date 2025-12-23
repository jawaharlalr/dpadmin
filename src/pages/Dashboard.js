import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  TrendingUp, Package, Users, IndianRupee, 
  Calendar, Layout, Store, Globe, Loader2 
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="flex items-center justify-between p-6 transition-all bg-white border border-gray-100 shadow-sm rounded-3xl hover:shadow-md">
    <div>
      <p className="mb-1 text-sm font-medium tracking-wider text-gray-500 uppercase">{title}</p>
      <h3 className="text-3xl font-black text-gray-800">{value}</h3>
      {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
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
  const [toggling, setToggling] = useState(null); // Tracking active updates
  
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalProducts: 0,
    activeOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    totalEarnings: 0
  });

  // Filter States
  const [waveYear, setWaveYear] = useState(new Date().getFullYear().toString());
  const [waveMonth, setWaveMonth] = useState('All');
  const [barYear, setBarYear] = useState(new Date().getFullYear().toString());
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    // 1. Listen to Orders
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(orderData);

      let totalEarned = 0; let todayEarned = 0;
      let activeCount = 0; let completedCount = 0;
      const catMap = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      orderData.forEach(order => {
        const orderTotal = Number(order.totalAmount || order.total || 0);
        const status = order.status?.toLowerCase();
        const date = order.serverTimestamp?.toDate() || order.createdAt?.toDate() || new Date();

        if (status === 'delivered') {
          totalEarned += orderTotal;
          completedCount++;
          if (date >= today) todayEarned += orderTotal;
        }

        if (['placed', 'processing', 'packed', 'out_for_delivery'].includes(status)) {
          activeCount++;
        }

        order.items?.forEach(item => {
          const cat = item.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + (Number(item.qty) || 0);
        });
      });

      setCategoryData(Object.keys(catMap).map(name => ({ name, value: catMap[name] })));
      setStats(prev => ({
        ...prev,
        totalEarnings: totalEarned,
        todayRevenue: todayEarned,
        activeOrders: activeCount,
        completedOrders: completedCount,
      }));
      setLoading(false);
    });

    // 2. Listen to Shop Controls
    const unsubControls = onSnapshot(doc(db, "app_settings", "shop_controls"), (docSnap) => {
      if (docSnap.exists()) {
        setShopStatus(docSnap.data());
      } else {
        // Initialize if doc doesn't exist
        setDoc(doc(db, "app_settings", "shop_controls"), { isOpen: true, onlineOrders: true });
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), snap => setStats(s => ({...s, totalUsers: snap.size})));
    const unsubProds = onSnapshot(collection(db, 'products'), snap => setStats(s => ({...s, totalProducts: snap.size})));

    return () => { unsubOrders(); unsubControls(); unsubUsers(); unsubProds(); };
  }, []);

  // --- TOGGLE HANDLER ---
  const toggleControl = async (field) => {
    setToggling(field);
    try {
      const newValue = !shopStatus[field];
      await updateDoc(doc(db, "app_settings", "shop_controls"), {
        [field]: newValue
      });
      toast.success(`${field === 'isOpen' ? 'Shop' : 'Ordering'} is now ${newValue ? 'ON' : 'OFF'}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
    setToggling(null);
  };

  const processWaveData = () => {
    const dataMap = {};
    orders.forEach(order => {
      const status = order.status?.toLowerCase();
      if (status !== 'delivered') return;

      const date = order.serverTimestamp?.toDate() || order.createdAt?.toDate() || new Date();
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate().toString();

      if (year === waveYear && (waveMonth === 'All' || month === waveMonth)) {
        const key = waveMonth === 'All' ? month : `Day ${day}`;
        if (!dataMap[key]) dataMap[key] = { name: key, totalEarnings: 0, orders: 0, sortIdx: waveMonth === 'All' ? date.getMonth() : date.getDate() };
        dataMap[key].totalEarnings += Number(order.totalAmount || order.total || 0);
        dataMap[key].orders += 1;
      }
    });
    return Object.values(dataMap).sort((a, b) => a.sortIdx - b.sortIdx);
  };

  const processBarData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap = months.map(m => ({ name: m, totalEarnings: 0 }));
    orders.forEach(order => {
      if (order.status?.toLowerCase() !== 'delivered') return;
      const date = order.serverTimestamp?.toDate() || order.createdAt?.toDate() || new Date();
      if (date.getFullYear().toString() === barYear) {
        dataMap[date.getMonth()].totalEarnings += Number(order.totalAmount || order.total || 0);
      }
    });
    return dataMap;
  };

  const COLORS = ['#FF4D4D', '#FFA500', '#4CAF50', '#2196F3', '#9C27B0'];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 rounded-full border-brand-orange border-t-transparent animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-10 space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl italic font-black tracking-tighter text-gray-800 uppercase">
            Finance <span className="text-brand-orange">Dashboard</span>
          </h2>
          <p className="text-sm text-gray-500">Shop controls & net performance data</p>
        </div>

        {/* --- SHOP CONTROL TOGGLES --- */}
        <div className="flex flex-wrap gap-4">
          {/* Shop Open Toggle */}
          <div className="flex items-center gap-3 p-3 px-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Store size={20} className={shopStatus.isOpen ? 'text-green-500' : 'text-red-500'} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Shop Status</span>
              <span className="text-xs font-black uppercase">{shopStatus.isOpen ? 'Open' : 'Closed'}</span>
            </div>
            <button 
              onClick={() => toggleControl('isOpen')}
              disabled={toggling === 'isOpen'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${shopStatus.isOpen ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shopStatus.isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
              {toggling === 'isOpen' && <Loader2 size={10} className="absolute text-gray-400 -translate-x-1/2 left-1/2 animate-spin"/>}
            </button>
          </div>

          {/* Online Orders Toggle */}
          <div className="flex items-center gap-3 p-3 px-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Globe size={20} className={shopStatus.onlineOrders ? 'text-blue-500' : 'text-gray-400'} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Online Orders</span>
              <span className="text-xs font-black uppercase">{shopStatus.onlineOrders ? 'On' : 'Off'}</span>
            </div>
            <button 
              onClick={() => toggleControl('onlineOrders')}
              disabled={toggling === 'onlineOrders'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${shopStatus.onlineOrders ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shopStatus.onlineOrders ? 'translate-x-6' : 'translate-x-1'}`} />
              {toggling === 'onlineOrders' && <Loader2 size={10} className="absolute text-gray-400 -translate-x-1/2 left-1/2 animate-spin"/>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Earnings" value={`₹${stats.todayRevenue}`} icon={IndianRupee} color="bg-green-600" subtext="Delivered today" />
        <StatCard title="Active" value={stats.activeOrders} icon={Package} color="bg-brand-orange" subtext="Pending Delivery" />
        <StatCard title="Customers" value={stats.totalUsers} icon={Users} color="bg-blue-600" subtext="Total Registered" />
        <StatCard title="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`} icon={TrendingUp} color="bg-purple-600" subtext="Net Profit" />
      </div>

      {/* --- RECHART 1: TOTAL EARNINGS WAVEFORM (Net) --- */}
      <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2.5rem]">
        <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <TrendingUp className="text-brand-red" /> Total Earnings Waveform
            </h3>
            <p className="text-xs text-gray-400">Net earnings from delivered orders only</p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
            <select 
              value={waveMonth} 
              onChange={(e) => setWaveMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white border-none rounded-xl focus:ring-0 shadow-sm"
            >
              <option value="All">All Months</option>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={waveYear} 
              onChange={(e) => setWaveYear(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white border-none rounded-xl focus:ring-0 shadow-sm"
            >
              {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processWaveData()}>
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999', fontWeight: 'bold'}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                formatter={(value, name) => [name === 'totalEarnings' ? `₹${value.toLocaleString('en-IN')}` : value, name === 'totalEarnings' ? "EARNINGS" : "ORDERS"]}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area name="totalEarnings" type="monotone" dataKey="totalEarnings" stroke="#FF4D4D" strokeWidth={4} fillOpacity={1} fill="url(#waveGradient)" />
              <Area name="orders" type="monotone" dataKey="orders" stroke="#FFA500" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- RECHART 2: YEARLY BAR CHART --- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2.5rem] lg:col-span-2">
          <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Calendar className="text-blue-500" /> Yearly Earnings Deep-Dive
              </h3>
              <p className="text-xs text-gray-400">Net monthly earnings breakdown</p>
            </div>
            
            <select 
              value={barYear} 
              onChange={(e) => setBarYear(e.target.value)}
              className="px-4 py-2 text-xs font-bold bg-gray-100 border-none rounded-2xl focus:ring-0"
            >
              {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processBarData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{fill: '#f8f8f8'}} contentStyle={{borderRadius: '15px'}} formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Net Earnings']} />
                <Bar dataKey="totalEarnings" radius={[10, 10, 0, 0]}>
                  {processBarData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#60A5FA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie */}
        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-[2.5rem]">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
             <Layout className="text-purple-500" size={18} /> Sales by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
                  <span className="text-xs font-bold text-gray-600">{item.name}</span>
                </div>
                <span className="px-2 py-1 text-xs font-black text-gray-800 rounded-lg bg-gray-50">{item.value} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}