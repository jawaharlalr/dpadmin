import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { Save, Loader2, Trash2 } from 'lucide-react';

import BannerManager from '../components/home-editor/BannerManager';
import OfferManager from '../components/home-editor/OfferManager';
import BestSellerManager from '../components/home-editor/BestSellerManager';
import LayoutManager from '../components/home-editor/LayoutManager';

export default function HomeEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('banners');
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  const [settings, setSettings] = useState({
    banners: [],
    importantNotes: [],
    offers: [], 
    categoryAlignment: 'grid',
    categoryOrder: [],
    bestSellers: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const cats = catSnap.docs.map(doc => doc.data().name);
        
        const prodSnap = await getDocs(collection(db, "products"));
        setAllProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const docSnap = await getDoc(doc(db, "app_settings", "home_screen"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({ 
            ...data, 
            categoryOrder: data.categoryOrder || cats,
            importantNotes: data.importantNotes || [],
            banners: data.banners || [],
            offers: data.offers || [],
            bestSellers: data.bestSellers || []
          });
        } else {
          setSettings(prev => ({ ...prev, categoryOrder: cats }));
        }
      } catch (e) {
        toast.error("Failed to load data");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "app_settings", "home_screen"), settings);
      toast.success("Home screen updated!");
    } catch (e) { 
      toast.error("Save failed"); 
    }
    setSaving(false);
  };

  // --- Banner Handlers ---
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const tid = toast.loading("Uploading image...");
    try {
      const sRef = ref(storage, `banners/${Date.now()}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setSettings({ 
        ...settings, 
        banners: [...settings.banners, { 
          id: Date.now(), 
          imageUrl: url,
          title: '',
          description: '',
          buttonText: 'Order Now' 
        }] 
      });
      toast.success("Image uploaded", { id: tid });
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

  // --- Offer Handlers ---
  const updateOffer = (id, field, val) => {
    setSettings({
      ...settings,
      offers: settings.offers.map(o => o.id === id ? { ...o, [field]: val } : o)
    });
  };

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand-red" size={40} /></div>;

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Home Editor</h2>
          <p className="text-sm text-gray-500">Manage banners, offers, and layout for the customer app.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 text-white transition-all shadow-lg bg-brand-red rounded-xl hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} 
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1.5 mb-8 bg-gray-100 rounded-2xl w-fit overflow-x-auto max-w-full">
        {['banners', 'offers', 'sellers', 'notes', 'alignment'].map(id => (
          <button 
            key={id} 
            onClick={() => setActiveTab(id)} 
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === id ? 'bg-white text-brand-red shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {id.toUpperCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="p-6 bg-white border shadow-sm rounded-3xl">
        {/* Banner Section */}
        {activeTab === 'banners' && (
          <BannerManager 
            banners={settings.banners} 
            onUpload={handleBannerUpload} 
            onRemove={id => setSettings({...settings, banners: settings.banners.filter(b => b.id !== id)})} 
            onUpdate={updateBanner}
          />
        )}

        {/* Offers Section */}
        {activeTab === 'offers' && (
          <OfferManager 
            offers={settings.offers} 
            onAdd={() => setSettings({...settings, offers: [...settings.offers, {id: Date.now(), title:'', discount:''}]})} 
            onUpdate={updateOffer} 
            onRemove={id => setSettings({...settings, offers: settings.offers.filter(o => o.id !== id)})} 
          />
        )}

        {/* Best Sellers Section */}
        {activeTab === 'sellers' && (
          <BestSellerManager 
            products={allProducts} 
            selectedIds={settings.bestSellers} 
            search={productSearch} 
            onSearchChange={setProductSearch} 
            onToggle={id => setSettings({...settings, bestSellers: settings.bestSellers.includes(id) ? settings.bestSellers.filter(x => x !== id) : [...settings.bestSellers, id]})} 
          />
        )}

        {/* Alignment & Layout Section */}
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
        
        {/* Notes Section */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Scrolling Announcements</h3>
            <p className="text-xs italic text-gray-400">These appear as a scrolling ticker at the top of the app.</p>
            {settings.importantNotes.map(n => (
              <div key={n.id} className="flex gap-2">
                <input 
                  className="flex-1 p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" 
                  placeholder="e.g. 🎉 Get 20% off on your first order!"
                  value={n.text} 
                  onChange={e => setSettings({...settings, importantNotes: settings.importantNotes.map(x => x.id === n.id ? {...x, text: e.target.value} : x)})} 
                />
                <button 
                  onClick={() => setSettings({...settings, importantNotes: settings.importantNotes.filter(x => x.id !== n.id)})} 
                  className="p-3 text-red-500 transition-colors hover:bg-red-50 rounded-xl"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            ))}
            <button 
              onClick={() => setSettings({...settings, importantNotes: [...settings.importantNotes, {id: Date.now(), text: ''}]})} 
              className="px-2 mt-2 text-sm font-bold text-brand-orange hover:underline"
            >
              + Add New Line
            </button>
          </div>
        )}
      </div>
    </div>
  );
}