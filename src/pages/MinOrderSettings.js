import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; // Changed updateDoc to setDoc
import { 
  Coins, 
  Save, 
  Info, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MinOrderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    minOrderAmount: 99
  });

  // --- REAL-TIME DATA SYNC ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_settings", "delivery_config"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig({
          minOrderAmount: docSnap.data().minOrderAmount || 0
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Using setDoc with merge: true ensures the document is created if it doesn't exist
      await setDoc(doc(db, "app_settings", "delivery_config"), {
        minOrderAmount: Number(config.minOrderAmount),
        updatedAt: new Date()
      }, { merge: true });
      
      toast.success("Minimum order threshold updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center pt-32">
      <Loader2 className="mb-4 animate-spin text-brand-red" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fetching Global Config...</p>
    </div>
  );

  return (
    <div className="max-w-4xl pb-20 mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-10 text-left">
        <h2 className="flex items-center gap-3 text-3xl italic font-black tracking-tighter text-gray-800 uppercase">
          <Coins className="text-brand-orange" size={28} />
          Order <span className="text-brand-orange">Minimums</span>
        </h2>
        <p className="text-sm font-medium tracking-widest text-gray-500 uppercase">Set the base requirement for delivery orders</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Settings Form */}
        <div className="p-8 bg-white border border-gray-100 shadow-2xl rounded-[3rem] text-left h-fit">
          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                Minimum Bill Amount (₹)
              </label>
              <div className="relative group">
                <span className="absolute text-lg font-black transition-transform -translate-y-1/2 left-5 top-1/2 text-brand-orange group-focus-within:scale-110">₹</span>
                <input 
                  type="number"
                  className="w-full p-6 pl-12 text-3xl font-black transition-all border-none outline-none bg-gray-50 rounded-3xl focus:ring-4 focus:ring-brand-orange/10"
                  value={config.minOrderAmount}
                  onChange={(e) => setConfig({ minOrderAmount: e.target.value })}
                  required
                  placeholder="0"
                />
              </div>
              <p className="text-[9px] text-gray-400 font-bold uppercase ml-2 italic leading-relaxed">
                Customers must reach this subtotal to enable the "Home Delivery" option.
              </p>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full py-5 font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl bg-gradient-to-r from-brand-red to-brand-orange rounded-[2rem] hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? "Syncing..." : "Update Live App"}
            </button>
          </form>
        </div>

        {/* Live App Logic Status */}
        <div className="space-y-6">
          <div className="p-8 bg-brand-dark text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <h3 className="flex items-center gap-2 mb-6 text-xs font-black tracking-widest uppercase text-brand-orange">
              <Info size={16} /> Order Logic Summary
            </h3>

            <div className="relative z-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Current Rule</p>
                  <p className="text-sm font-bold leading-relaxed">
                    Orders below <span className="text-lg text-brand-orange">₹{config.minOrderAmount}</span> will be restricted to 
                    <span className="ml-1 italic text-white underline">Store Pickup only</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/10">
                  <CheckCircle2 size={18} className="text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">User Experience</p>
                  <p className="text-sm font-bold leading-relaxed text-gray-300">
                    A warning message will appear in the cart if the total is less than ₹{config.minOrderAmount}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-start gap-4">
            <AlertCircle className="text-brand-orange shrink-0" />
            <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
              <strong>Note:</strong> This setting is applied globally to all users. Changes take effect the next time a user opens their cart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}