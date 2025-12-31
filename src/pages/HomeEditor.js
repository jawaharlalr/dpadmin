import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, onSnapshot, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { Save, Loader2, LayoutDashboard } from 'lucide-react';

import BannerManager from '../components/home-editor/BannerManager';
import OfferManager from '../components/home-editor/OfferManager';
import BestSellerManager from '../components/home-editor/BestSellerManager';
import LayoutManager from '../components/home-editor/LayoutManager';
import PromotionManager from '../components/home-editor/PromotionManager';

export default function HomeEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('banners');
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  const [settings, setSettings] = useState({
    banners: [],
    offers: [], 
    promotions: [], 
    categoryAlignment: 'grid',
    categoryOrder: [],
    bestSellers: []
  });

  // --- REAL-TIME DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const cats = catSnap.docs.map(doc => doc.data().name);
        
        const prodSnap = await getDocs(collection(db, "products"));
        setAllProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const unsub = onSnapshot(doc(db, "app_settings", "home_screen"), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSettings({ 
              ...data, 
              categoryOrder: data.categoryOrder || cats,
              banners: data.banners || [],
              offers: data.offers || [],
              promotions: data.promotions || [],
              bestSellers: data.bestSellers || []
            });
          } else {
            setSettings(prev => ({ ...prev, categoryOrder: cats }));
          }
          setLoading(false);
        });

        return () => unsub();
      } catch (e) {
        console.error("Data Fetch Error:", e);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "app_settings", "home_screen"), settings);
      toast.success("Mobile App Configurations Published!");
    } catch (e) { 
      toast.error("Cloud Sync Failed"); 
    }
    setSaving(false);
  };

  // --- Banner Upload Handlers ---
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const tid = toast.loading("Processing banner...");
    try {
      const sRef = ref(storage, `banners/${Date.now()}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setSettings({ 
        ...settings, 
        banners: [...settings.banners, { 
          id: Date.now(), 
          imageUrl: url,
          order: settings.banners.length + 1,
          duration: 5 
        }] 
      });
      toast.success("Banner added!", { id: tid });
    } catch (err) {
      toast.error("Upload failed", { id: tid });
    }
  };

  // --- Promotion Image Upload Handler ---
  const handlePromotionImageUpload = async (id, file) => {
    if (!file) return;
    const tid = toast.loading("Uploading promotion banner...");
    try {
      const sRef = ref(storage, `promotions/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      
      setSettings(prev => ({
        ...prev,
        promotions: prev.promotions.map(p => 
          p.id === id ? { ...p, imageUrl: url } : p
        )
      }));
      
      toast.success("Banner image updated!", { id: tid });
    } catch (err) {
      toast.error("Upload failed", { id: tid });
    }
  };

  const updateBanner = (id, field, val) => {
    setSettings({
      ...settings,
      banners: settings.banners.map(b => b.id === id ? { ...b, [field]: val } : b)
    });
  };

  const updateOffer = (id, field, val) => {
    setSettings({
      ...settings,
      offers: settings.offers.map(o => o.id === id ? { ...o, [field]: val } : o)
    });
  };

  const updatePromotion = (id, field, val) => {
    setSettings({
      ...settings,
      promotions: settings.promotions.map(p => p.id === id ? { ...p, [field]: val } : p)
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center pt-32">
      <Loader2 className="mb-4 animate-spin text-brand-red" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Initializing...</p>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="flex flex-col justify-between gap-6 mb-10 md:flex-row md:items-center">
        <div className="text-left">
          <h2 className="flex items-center gap-3 text-3xl italic font-black tracking-tighter text-gray-800 uppercase">
            <LayoutDashboard className="text-brand-orange" size={28} />
            Home <span className="text-brand-orange">Editor</span>
          </h2>
          <p className="text-sm font-medium text-gray-500">Manage promotional content and app layout logic.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center justify-center gap-2 px-8 py-3 text-xs font-black text-white uppercase shadow-xl bg-gradient-to-r from-brand-red to-brand-orange rounded-2xl active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} 
          Publish Changes
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-2 mb-8 bg-white border border-gray-100 rounded-[2rem] w-fit shadow-sm overflow-x-auto max-w-full">
        {[
          { id: 'banners', label: 'Banners' },
          { id: 'promos', label: 'Promotions' },
          { id: 'offers', label: 'Discounts' },
          { id: 'sellers', label: 'Best Sellers' },
          { id: 'alignment', label: 'Layout' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-red text-white shadow-lg shadow-red-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-8 bg-white border border-gray-50 shadow-2xl rounded-[3rem]">
        {activeTab === 'banners' && (
          <BannerManager 
            banners={settings.banners} 
            onUpload={handleBannerUpload} 
            onRemove={id => setSettings({...settings, banners: settings.banners.filter(b => b.id !== id)})} 
            onUpdate={updateBanner}
          />
        )}

        {activeTab === 'promos' && (
          <PromotionManager 
            promotions={settings.promotions}
            onAdd={() => setSettings({
              ...settings, 
              promotions: [...settings.promotions, {
                id: Date.now(), 
                text: '', 
                subText: '', 
                emoji: '✨', 
                deadline: '', 
                imageUrl: ''
              }]
            })}
            onUpdate={updatePromotion}
            onRemove={id => setSettings({
              ...settings, 
              promotions: settings.promotions.filter(p => p.id !== id)
            })}
            onImageUpload={handlePromotionImageUpload}
          />
        )}

        {activeTab === 'offers' && (
          <OfferManager 
            offers={settings.offers} 
            onAdd={() => setSettings({...settings, offers: [...settings.offers, {id: Date.now(), title:'', discount:'', minAmount: 0}]})} 
            onUpdate={updateOffer} 
            onRemove={id => setSettings({...settings, offers: settings.offers.filter(o => o.id !== id)})} 
          />
        )}

        {activeTab === 'sellers' && (
          <BestSellerManager 
            products={allProducts} 
            selectedIds={settings.bestSellers} 
            search={productSearch} 
            onSearchChange={setProductSearch} 
            onToggle={id => setSettings({...settings, bestSellers: settings.bestSellers.includes(id) ? settings.bestSellers.filter(x => x !== id) : [...settings.bestSellers, id]})} 
          />
        )}

        {activeTab === 'alignment' && (
          <LayoutManager 
            order={settings.categoryOrder} 
            alignment={settings.categoryAlignment} 
            onAlignmentChange={v => setSettings({...settings, categoryAlignment: v})} 
            onMove={(i, d) => {
              const n = [...settings.categoryOrder]; 
              const x = n.splice(i,1)[0]; 
              n.splice(i+d, 0, x); 
              setSettings({...settings, categoryOrder: n})
            }} 
          />
        )}
      </div>
    </div>
  );
}