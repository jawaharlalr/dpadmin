import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Bike, 
  LogOut, 
  UtensilsCrossed, 
  Layers, 
  Home,
  ChevronLeft,
  Menu,
  X,
  Users // Added Users icon for Customers
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, isCollapsed, onClick }) => (
  <Link to={path} title={isCollapsed ? label : ""} onClick={onClick}>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
      ? 'bg-white/20 text-white font-semibold shadow-lg' 
      : 'text-white/80 hover:bg-white/10 hover:text-white'
    } ${isCollapsed ? 'justify-center px-0' : ''}`}>
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && <span className="truncate transition-opacity duration-200">{label}</span>}
    </div>
  </Link>
);

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* --- MOBILE OVERLAY --- */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[70] flex flex-col text-white shadow-2xl transition-all duration-300 ease-in-out bg-gradient-to-b from-brand-red to-brand-orange md:relative 
        ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'} 
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute z-50 items-center justify-center hidden w-8 h-8 transition-transform bg-white rounded-full shadow-md -right-4 top-10 text-brand-red hover:scale-110 md:flex"
        >
          {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`p-6 ${isCollapsed ? 'md:px-2' : ''}`}>
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10 md:flex-col md:gap-4">
            <div className="relative flex justify-center w-full">
              {isCollapsed ? (
                <img src="/favicon.ico" alt="Icon" className="w-10 h-10 p-1 bg-white rounded-lg shadow-md" />
              ) : (
                <img src="/header.webp" alt="DP Header" className="w-full h-auto rounded-xl" />
              )}
            </div>
            
            <button className="md:hidden" onClick={() => setIsMobileOpen(false)}>
              <X size={24} />
            </button>

            {!isCollapsed && (
              <div className="hidden text-center md:block">
                <h1 className="text-lg font-black leading-tight tracking-tight uppercase">
                  DP Evening <br/> 
                  <span className="text-brand-yellow">Snacks & Sweets</span>
                </h1>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">Admin Dashboard</p>
              </div>
            )}
          </div>
          
          <nav className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={location.pathname === '/'} isCollapsed={isCollapsed} />
            <SidebarItem icon={Home} label="Home Editor" path="/editor" active={location.pathname === '/editor'} isCollapsed={isCollapsed} />
            <SidebarItem icon={Layers} label="Categories" path="/categories" active={location.pathname === '/categories'} isCollapsed={isCollapsed} />
            <SidebarItem icon={ShoppingBag} label="Orders" path="/orders" active={location.pathname === '/orders'} isCollapsed={isCollapsed} />
            <SidebarItem icon={UtensilsCrossed} label="Menu Items" path="/menu" active={location.pathname === '/menu'} isCollapsed={isCollapsed} />
            {/* Added Customers Item below Menu Items */}
            <SidebarItem icon={Users} label="Customers" path="/customers" active={location.pathname === '/customers'} isCollapsed={isCollapsed} />
            <SidebarItem icon={Bike} label="Delivery Team" path="/delivery" active={location.pathname === '/delivery'} isCollapsed={isCollapsed} />
          </nav>
        </div>

        <div className="p-6 mt-auto border-t border-white/10">
          <button 
            onClick={handleLogout} 
            className={`flex items-center w-full transition-colors text-white/90 hover:text-white group ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}
          >
            <div className={`p-2 rounded-lg group-hover:bg-white/10 ${isCollapsed ? 'md:mx-auto' : ''}`}>
                <LogOut size={20} />
            </div>
            {(!isCollapsed || isMobileOpen) && <span className="font-bold">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="relative flex-1 overflow-y-auto">
        <header className="flex items-center justify-between p-6 bg-white border-b md:hidden">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 transition-colors rounded-lg hover:bg-gray-100 text-brand-red">
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/favicon.ico" alt="Icon" className="w-8 h-8 p-0.5 bg-brand-red/5 rounded shadow-sm" />
                    <h1 className="text-lg font-black leading-none uppercase text-brand-red">DP Evening Snacks & Sweets</h1>
                </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-brand-red">
              <LogOut size={20}/>
            </button>
        </header>

        <div className="p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}