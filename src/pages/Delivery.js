import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Bike, Search, Edit2, Trash2, X, Phone, Mail, CheckCircle, User, Lock } from 'lucide-react';

export default function Delivery() {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const initialFormState = { 
    name: '', 
    phone: '', 
    email: '', 
    password: '', 
    status: 'active' 
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchRiders();
  }, []);

  // Filter riders
  useEffect(() => {
    const results = riders.filter(rider => 
      rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.phone.includes(searchTerm)
    );
    setFilteredRiders(results);
  }, [searchTerm, riders]);

  const fetchRiders = async () => {
    try {
      const snap = await getDocs(collection(db, "delivery_partners"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRiders(data);
    } catch (error) {
      console.error("Error fetching riders:", error);
    }
  };

  // --- STATS ---
  const totalRiders = riders.length;
  const activeRiders = riders.filter(r => r.status === 'active').length;

  // --- HANDLERS ---

  const handleEditClick = (rider) => {
    setEditId(rider.id);
    setFormData({
      name: rider.name,
      phone: rider.phone,
      email: rider.email,
      password: rider.password || '', 
      status: rider.status
    });
    setIsModalOpen(true);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    // Optimistic UI update
    setRiders(riders.map(r => r.id === id ? { ...r, status: newStatus } : r)); 

    try {
      await updateDoc(doc(db, "delivery_partners", id), { status: newStatus });
      toast.success(newStatus === 'active' ? "Rider Activated" : "Rider Deactivated");
    } catch (error) {
      toast.error("Failed to update status");
      fetchRiders(); // Revert on error
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to remove this rider? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "delivery_partners", id));
        setRiders(riders.filter(r => r.id !== id));
        toast.success("Rider removed successfully");
      } catch (error) {
        toast.error("Failed to delete rider");
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editId) return; // Safety check

    setLoading(true);
    try {
      const riderData = {
        name: formData.name,
        phone: formData.phone,
        status: formData.status,
        // Note: We avoid updating email/password here to keep Auth synced safely
      };

      await updateDoc(doc(db, "delivery_partners", editId), riderData);
      toast.success("Rider details updated");
      setIsModalOpen(false);
      fetchRiders();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
    setLoading(false);
  };

  return (
    <div className="pb-10">
      
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Delivery Partners</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your delivery fleet and their status.</p>
        </div>
        {/* 'Add Rider' Button Removed */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="p-3 text-orange-600 rounded-full bg-orange-50">
            <Bike size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Riders</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalRiders}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="p-3 text-green-600 rounded-full bg-green-50">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Now</p>
            <h3 className="text-2xl font-bold text-gray-800">{activeRiders}</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or phone number..." 
          className="w-full pl-10 bg-white input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Riders Grid */}
      {filteredRiders.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-300 border-dashed rounded-2xl">
           <Bike className="mx-auto mb-3 text-gray-300" size={48} />
           <p className="text-gray-500">No riders found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRiders.map((rider) => (
            <div key={rider.id} className="flex flex-col overflow-hidden transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-lg">
              
              {/* Card Header (Avatar Area) */}
              <div className="flex items-center gap-4 p-6 bg-gray-50">
                <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white rounded-full bg-brand-orange">
                  {rider.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{rider.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full ${rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {rider.status}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col flex-1 p-6 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone size={18} className="text-gray-400" />
                    <span className="font-medium">{rider.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-sm truncate" title={rider.email}>{rider.email}</span>
                  </div>
                  {rider.password && (
                     <div className="flex items-center gap-3 text-xs text-gray-400">
                       <Lock size={14} />
                       <span className="px-2 py-1 font-mono bg-gray-100 rounded">Pass: {rider.password}</span>
                     </div>
                  )}
                </div>

                <div className="pt-4 mt-auto space-y-4 border-t border-gray-100">
                  
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Account Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={rider.status === 'active'}
                        onChange={() => toggleStatus(rider.id, rider.status)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClick(rider)} 
                      className="flex items-center justify-center flex-1 gap-2 py-2 text-sm font-medium text-gray-700 transition rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Edit2 size={16}/> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(rider.id)} 
                      className="flex items-center justify-center px-3 text-red-500 transition rounded-lg bg-red-50 hover:bg-red-100"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Edit Rider</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
                  <input 
                    className="pl-10 input-field"
                    placeholder="John Doe"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <div className="relative mt-1">
                   <Phone className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
                   <input 
                    className="pl-10 input-field"
                    placeholder="9876543210"
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                <div className="relative mt-1">
                   <Mail className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
                   <input 
                    type="email"
                    className="pl-10 text-gray-500 bg-gray-100 cursor-not-allowed input-field"
                    value={formData.email} 
                    disabled 
                    title="Email cannot be changed here"
                  />
                </div>
              </div>

              {/* Status Toggle in Modal */}
              <div className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50 rounded-xl">
                 <span className="font-medium text-gray-700">Active Account</span>
                 <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.status === 'active'}
                    onChange={e => setFormData({...formData, status: e.target.checked ? 'active' : 'inactive'})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-medium text-gray-600 transition hover:bg-gray-50 rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 font-bold text-white transition shadow-lg bg-brand-red rounded-xl hover:bg-brand-dark shadow-red-200">
                  {loading ? 'Updating...' : 'Update Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}