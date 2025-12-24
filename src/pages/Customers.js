import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
  Users, 
  Search, 
  Mail, 
  Phone,  
  MapPin, 
  Loader2,
  ChevronDown,
  Info,
  UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null); // Track which row is open

  // --- REAL-TIME DATA SYNC ---
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(docs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center pt-32">
      <Loader2 className="mb-4 animate-spin text-brand-red" size={40} />
      <p className="text-xs font-black tracking-widest text-gray-400 uppercase">Accessing Customer Vault...</p>
    </div>
  );

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-3xl italic font-black tracking-tighter text-gray-800 uppercase">
            <Users className="text-brand-orange" size={28} />
            Customer <span className="text-brand-orange">Database</span>
          </h2>
          <p className="text-sm font-medium text-gray-500">View profile depths and fulfillment history.</p>
        </div>
        
        <div className="px-6 py-3 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Profiles</p>
            <h3 className="text-xl font-black text-brand-red">{customers.length} Accounts</h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" size={18} />
        <input 
          type="text" 
          placeholder="Search name, email, or phone..." 
          className="w-full py-4 pl-12 pr-4 text-sm font-bold bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand-orange"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-xl rounded-[2rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-tools-table border-spacing-0">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">S.No</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Info</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((customer, index) => (
                <React.Fragment key={customer.id}>
                  <motion.tr 
                    layout
                    className={`transition-colors cursor-pointer hover:bg-gray-50/80 ${expandedId === customer.id ? 'bg-orange-50/30' : ''}`}
                    onClick={() => toggleExpand(customer.id)}
                  >
                    {/* S.No */}
                    <td className="p-6 text-xs font-black tracking-tighter text-gray-400">
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    {/* Name */}
                    <td className="p-6">
                      <div className="flex items-center gap-4 text-left">
                        <div className="flex items-center justify-center w-10 h-10 text-sm font-black text-white shadow-lg rounded-xl bg-gradient-to-br from-brand-red to-brand-orange">
                          {customer.name?.charAt(0) || 'U'}
                        </div>
                        <h4 className="text-sm font-black tracking-tight text-gray-800 uppercase line-clamp-1">
                          {customer.name || 'Anonymous'}
                        </h4>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                          <Mail size={12} className="text-brand-orange" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                            <Phone size={12} className="text-brand-orange" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Quick Stats */}
                    <td className="p-6">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl w-fit shadow-sm">
                        <MapPin size={12} className="text-blue-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase">
                          {customer.addresses?.length || 0} Places
                        </span>
                      </div>
                    </td>

                    {/* Toggle Arrow */}
                    <td className="p-6 text-right">
                      <div className={`inline-flex p-2 transition-transform duration-300 rounded-lg ${expandedId === customer.id ? 'rotate-180 bg-brand-orange text-white' : 'text-gray-300 bg-gray-100'}`}>
                        <ChevronDown size={18} />
                      </div>
                    </td>
                  </motion.tr>

                  {/* EXPANDABLE AREA */}
                  <AnimatePresence>
                    {expandedId === customer.id && (
                      <tr>
                        <td colSpan="5" className="p-0 border-none">
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-gray-50/50"
                          >
                            <div className="grid grid-cols-1 gap-8 p-8 border-b border-gray-100 lg:grid-cols-3">
                              
                              {/* Profile Summary */}
                              <div className="space-y-4">
                                <h5 className="flex items-center gap-2 text-[10px] font-black text-brand-orange uppercase tracking-widest">
                                  <UserCircle size={14} /> Profile Summary
                                </h5>
                                <div className="p-4 space-y-3 bg-white border border-gray-100 rounded-2xl">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Full Name</span>
                                    <span className="text-xs font-black text-gray-800 uppercase">{customer.name}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">User Email</span>
                                    <span className="text-xs font-bold text-gray-600">{customer.email}</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Member Since</span>
                                    <span className="text-xs font-bold text-gray-600">
                                      {customer.createdAt ? new Date(customer.createdAt.seconds * 1000).toDateString() : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Addresses List */}
                              <div className="space-y-4 text-left lg:col-span-2">
                                <h5 className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                  <MapPin size={14} /> Saved Delivery Locations
                                </h5>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  {customer.addresses && customer.addresses.length > 0 ? (
                                    customer.addresses.map((addr, aIdx) => (
                                      <div key={aIdx} className="p-4 transition-colors bg-white border border-gray-100 shadow-sm rounded-2xl hover:border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded uppercase tracking-tighter">
                                            {addr.type || 'Other'}
                                          </span>
                                        </div>
                                        <p className="text-xs font-bold leading-tight text-gray-800 uppercase">{addr.line1}</p>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase mt-1">{addr.city}, {addr.state} - {addr.zip}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-6 border border-gray-200 border-dashed col-span-full bg-gray-100/50 rounded-2xl">
                                      <Info size={20} className="mb-1 text-gray-300" />
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">No addresses provided</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xs font-bold tracking-widest uppercase">No matching customer files found</p>
          </div>
        )}
      </div>
    </div>
  );
}