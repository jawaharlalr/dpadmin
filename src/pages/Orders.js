import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, orderBy, query, getDocs, where } from 'firebase/firestore';
import { Check, Truck, User, X, MapPin, Hash, ChevronDown, ChevronUp, Package, Store, Bike, PhoneCall, Copy, Ticket, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors = {
  placed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  packed: 'bg-purple-100 text-purple-700 border-purple-200',
  out_for_delivery: 'bg-orange-100 text-orange-700 border-orange-200',
  ready_for_pickup: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  picked_up: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchRiders = async () => {
      try {
        const riderQuery = query(collection(db, "delivery_partners"), where("status", "==", "active"));
        const riderSnap = await getDocs(riderQuery);
        setRiders(riderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.log("Rider fetch error:", err);
      }
    };
    fetchRiders();

    return unsubscribe;
  }, []);

  // --- HELPERS ---
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN').format(Math.round(amount || 0));

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Order ID Copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleOrder = (id) => {
    setExpandedOrderIds(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "orders", id), { status });
      toast.success(`Updated to ${status.replace(/_/g, " ")}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const updatePaymentStatus = async (id, method) => {
    try {
      await updateDoc(doc(db, "orders", id), { 
        paymentStatus: 'Paid',
        paymentMethod: method,
        paidAt: new Date().toISOString()
      });
      toast.success(`Marked as Paid via ${method}`);
    } catch (error) {
      toast.error("Failed to update payment");
    }
  };

  const handleAssignRider = async (rider) => {
    if (!selectedOrderId) return;
    try {
      await updateDoc(doc(db, "orders", selectedOrderId), {
        status: 'out_for_delivery',
        riderId: rider.id,
        riderUid: rider.id,
        riderName: rider.name,
        riderPhone: rider.phone,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Assigned to ${rider.name}`);
      setIsAssignModalOpen(false);
      setSelectedOrderId(null);
    } catch (error) {
      toast.error("Assignment failed");
    }
  };

  const renderActionButtons = (order) => {
    const status = order.status?.toLowerCase() || 'placed';
    const isHomeDelivery = order.deliveryMethod === 'Home Delivery';

    return (
      <div className="flex flex-wrap items-center gap-3 pt-5 mt-5 border-t border-gray-100">
        {status === 'placed' && (
          <button onClick={() => updateStatus(order.id, 'processing')} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Accept Order
          </button>
        )}
        {status === 'processing' && (
          <button onClick={() => updateStatus(order.id, 'packed')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700">
            <Package size={16} /> Mark Packed
          </button>
        )}
        {status === 'packed' && (
          isHomeDelivery ? (
            <button onClick={() => { setSelectedOrderId(order.id); setIsAssignModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
              <Truck size={16} /> Assign Rider
            </button>
          ) : (
            <button onClick={() => updateStatus(order.id, 'ready_for_pickup')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              <Store size={16} /> Ready for Pickup
            </button>
          )
        )}
        {status === 'ready_for_pickup' && (
          <button onClick={() => updateStatus(order.id, 'picked_up')} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">
            <Check size={16} /> Mark Picked Up
          </button>
        )}
        {status === 'out_for_delivery' && (
           <div className="flex items-center gap-4 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <span className="flex items-center gap-2 text-sm italic text-gray-500"><Bike size={16}/> Rider is on the way...</span>
              <button onClick={() => updateStatus(order.id, 'delivered')} className="text-xs font-bold text-blue-600 uppercase hover:underline">Complete Manually</button>
           </div>
        )}
        {!['delivered', 'picked_up', 'cancelled'].includes(status) && (
           <button onClick={() => { if(window.confirm('Cancel order?')) updateStatus(order.id, 'cancelled') }} className="px-4 py-2 ml-auto text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
             Cancel
           </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl px-4 pb-20 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black tracking-tight text-gray-800 uppercase">Order Management</h2>
        <div className="px-4 py-1 text-xs font-bold tracking-widest text-gray-500 uppercase bg-gray-100 rounded-full">
          {orders.length} Total Orders
        </div>
      </div>
      
      <div className="space-y-4">
        {orders.map((order, index) => {
          const status = order.status || 'placed';
          const isExpanded = expandedOrderIds.includes(order.id);
          const isHome = order.deliveryMethod === 'Home Delivery';
          const customerPhone = order.shippingAddress?.phone || order.userPhone || order.phone || 'N/A';
          const isPaid = order.paymentStatus === 'Paid';

          return (
            <div key={order.id} className={`bg-white border rounded-2xl transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-brand-orange/20 border-brand-orange/20 shadow-xl' : 'border-gray-100 shadow-sm'}`}>
              <div onClick={() => toggleOrder(order.id)} className="flex flex-col gap-4 p-4 cursor-pointer md:p-5 hover:bg-gray-50 md:flex-row md:items-center">
                <div className="flex items-center gap-4 min-w-[180px]">
                  <span className="flex items-center justify-center w-8 h-8 text-xs font-bold text-gray-500 bg-gray-100 rounded-full">{index + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-bold text-gray-900">{order.orderId}</p>
                      <button onClick={(e) => handleCopyId(e, order.orderId)} className="text-gray-400 hover:text-gray-600">
                        {copiedId === order.orderId ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="font-bold text-gray-800">{order.userName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      {isHome ? <Truck size={12}/> : <Store size={12}/>} {order.deliveryMethod}
                    </p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${isPaid ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                       {isPaid ? `Paid (${order.paymentMethod})` : 'Unpaid'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[status.toLowerCase()]}`}>
                    {status.replace(/_/g, " ")}
                  </span>
                  <p className="text-lg font-black text-brand-orange min-w-[80px] text-right">₹{formatCurrency(order.totalAmount)}</p>
                  {isExpanded ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                </div>
              </div>

              {isExpanded && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Customer */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Customer</h4>
                      <div className="p-4 space-y-2 text-sm bg-white border border-gray-100 rounded-xl">
                        <p className="font-bold">{order.userName}</p>
                        <p className="text-gray-500">{order.userEmail}</p>
                        <p className="flex items-center gap-1 font-medium text-gray-500"><PhoneCall size={12} className="text-brand-orange"/> {customerPhone}</p>
                        <p className="pt-2 text-xs leading-relaxed text-gray-600 border-t border-gray-50"><MapPin size={12} className="inline mr-1 text-brand-orange"/> 
                          {order.deliveryMethod === 'Store Pickup' ? 'Self Pickup from Store' : `${order.shippingAddress?.line1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.zip}`}
                        </p>
                      </div>

                      {/* Store Pickup Payment Selection */}
                      {!isHome && !isPaid && status !== 'cancelled' && (
                        <div className="p-4 space-y-3 border border-green-100 bg-green-50 rounded-xl">
                           <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14}/> Receive Payment</h4>
                           <div className="grid grid-cols-3 gap-2">
                              {['Cash', 'UPI', 'Card'].map((method) => (
                                <button 
                                  key={method}
                                  onClick={() => updatePaymentStatus(order.id, method)}
                                  className="py-2 text-[10px] font-bold bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                                >
                                  {method}
                                </button>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-4 md:col-span-2">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Hash size={14}/> Order Items ({order.items?.length})</h4>
                      <div className="overflow-hidden bg-white border border-gray-100 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                            <tr>
                              <th className="px-4 py-3 text-left">Product</th>
                              <th className="px-4 py-3 text-center">Qty</th>
                              <th className="px-4 py-3 text-right">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {order.items?.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-gray-800">{item.name}</p>
                                  <p className="text-[10px] text-gray-400 uppercase">{item.selectedWeight}</p>
                                </td>
                                <td className="px-4 py-3 font-bold text-center">{item.qty}</td>
                                <td className="px-4 py-3 font-medium text-right text-gray-600">₹{formatCurrency(item.price * item.qty)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {/* Bill Breakdown */}
                        <div className="p-4 space-y-2 border-t border-gray-100 bg-gray-50">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{formatCurrency(order.subtotal)}</span>
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="flex justify-between text-xs font-bold text-green-600">
                              <span className="flex items-center gap-1"><Ticket size={12}/> Discount ({order.appliedCode})</span>
                              <span>- ₹{formatCurrency(order.discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 text-sm font-black text-gray-800 border-t border-gray-200">
                            <span>Total Payable</span>
                            <span className="text-brand-orange">₹{formatCurrency(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rider Assign Logic */}
                  {isHome && (
                    <div className="p-4 mt-6 border border-blue-100 rounded-xl bg-blue-50/30">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Rider Status</h4>
                      {order.riderName ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 text-blue-600 bg-blue-100 rounded-full"><Bike size={18}/></div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{order.riderName}</p>
                              <p className="text-xs text-gray-500">{order.riderPhone}</p>
                            </div>
                          </div>
                          {status !== 'delivered' && (
                             <button onClick={() => { setSelectedOrderId(order.id); setIsAssignModalOpen(true); }} className="text-xs font-bold text-blue-600 hover:underline">Change Rider</button>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs italic text-gray-400">No rider assigned yet.</p>
                      )}
                    </div>
                  )}

                  {renderActionButtons(order)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RIDER ASSIGN MODAL */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-3xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-black tracking-tight text-gray-800 uppercase">Select Rider</h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-1 transition-all rounded-full hover:bg-gray-200"><X size={24}/></button>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {riders.length === 0 ? (
                  <p className="py-10 italic text-center text-gray-400">No active riders available.</p>
                ) : (
                  riders.map(rider => (
                    <button key={rider.id} onClick={() => handleAssignRider(rider)} className="flex items-center w-full gap-4 p-4 mb-2 text-left transition-all border border-transparent hover:bg-orange-50 rounded-2xl hover:border-orange-100 group">
                      <div className="flex items-center justify-center w-12 h-12 text-lg font-black text-white shadow-lg bg-brand-orange rounded-xl">{rider.name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 group-hover:text-brand-orange">{rider.name}</p>
                        <p className="text-xs font-medium text-gray-500">{rider.phone}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">Assign Now</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}