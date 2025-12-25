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
  Users,
  Coins // Icon for Min Order
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, isCollapsed, onClick }) => (
  <Link to={path} title={isCollapsed ? label : ""} onClick={onClick}>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
      ? 'bg-white/20 text-white font-semibold shadow-lg' 
      : 'text-white/80 hover:bg-white/10 hover:text-white'
    } ${isCollapsed ? 'justify-center px-0' : ''}`}>
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && <span className="truncate transition-opacity duration-200 uppercase text-[11px] tracking-wider font-black">{label}</span>}
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
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute z-50 items-center justify-center hidden w-8 h-8 transition-transform bg-white rounded-full shadow-md -right-4 top-10 text-brand-red hover:scale-110 md:flex"
        >
          {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Branding Section */}
        <div className={`p-6 shrink-0 ${isCollapsed ? 'md:px-2' : ''}`}>
          <div className="flex items-center justify-between pb-6 border-b border-white/10 md:flex-col md:gap-4">
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
          </div>
        </div>

        {/* Nav Items - SCROLLABLE AREA */}
        <div className="flex-1 px-6 py-2 space-y-1 overflow-y-auto scrollbar-hide">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={location.pathname === '/'} isCollapsed={isCollapsed} />
          <SidebarItem icon={Home} label="Home Editor" path="/editor" active={location.pathname === '/editor'} isCollapsed={isCollapsed} />
          <SidebarItem icon={Layers} label="Categories" path="/categories" active={location.pathname === '/categories'} isCollapsed={isCollapsed} />
          <SidebarItem icon={ShoppingBag} label="Orders" path="/orders" active={location.pathname === '/orders'} isCollapsed={isCollapsed} />
          <SidebarItem icon={UtensilsCrossed} label="Menu Items" path="/menu" active={location.pathname === '/menu'} isCollapsed={isCollapsed} />
          <SidebarItem icon={Users} label="Customers" path="/customers" active={location.pathname === '/customers'} isCollapsed={isCollapsed} />
          
          {/* New Min Order Item */}
          <SidebarItem icon={Coins} label="Min Order" path="/settings/min-order" active={location.pathname === '/settings/min-order'} isCollapsed={isCollapsed} />
          
          <SidebarItem icon={Bike} label="Delivery Team" path="/delivery" active={location.pathname === '/delivery'} isCollapsed={isCollapsed} />
        </div>

        {/* Footer Section - LOCKED TO BOTTOM */}
        <div className="p-6 border-t shrink-0 border-white/10 bg-black/5">
          <button 
            onClick={handleLogout} 
            className={`flex items-center w-full transition-colors text-white/90 hover:text-white group ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}
          >
            <div className={`p-2 rounded-lg group-hover:bg-brand-yellow/20 group-hover:text-brand-yellow transition-all ${isCollapsed ? 'md:mx-auto' : ''}`}>
                <LogOut size={20} />
            </div>
            {(!isCollapsed || isMobileOpen) && <span className="font-black uppercase text-[11px] tracking-widest">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="relative flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <header className="flex items-center justify-between p-6 bg-white border-b md:hidden">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 transition-colors rounded-lg hover:bg-gray-100 text-brand-red">
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/favicon.ico" alt="Icon" className="w-8 h-8 p-0.5 bg-brand-red/5 rounded shadow-sm" />
                    <h1 className="text-lg font-black leading-none uppercase text-brand-red">DP Evening</h1>
                </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-brand-red">
              <LogOut size={20}/>
            </button>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}