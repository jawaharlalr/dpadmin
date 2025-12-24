import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Image as ImageIcon, X, 
  Package, Search, Filter, BarChart3, IndianRupee, Loader2, Eye, EyeOff 
} from 'lucide-react';

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const initialFormState = { 
    name: '', 
    category: '', 
    type: 'veg',
    isAvailable: true,
    variants: [{ weight: '', unit: 'gms', price: '', stock: '', active: true }] 
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // --- REAL-TIME DATA SYNC ---
  useEffect(() => {
    const qProducts = query(collection(db, "products"), orderBy("name", "asc"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setFetching(false);
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (snapshot) => {
      const cats = snapshot.docs.map(doc => doc.data().name);
      setCategoryOptions(cats);
    });

    return () => {
      unsubProducts();
      unsubCats();
    };
  }, []);

  useEffect(() => {
    let result = products;
    if (filterCategory !== 'All') {
      result = result.filter(item => item.category === filterCategory);
    }
    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [products, searchTerm, filterCategory]);

  // --- LIVE STATS CALCULATION ---
  const totalItems = products.length;
  const totalStock = products.reduce((acc, item) => 
    acc + (item.variants?.reduce((vAcc, v) => vAcc + (Number(v.stock) || 0), 0) || 0), 0
  );
  const totalWorth = products.reduce((acc, item) => 
    acc + (item.variants?.reduce((vAcc, v) => vAcc + ((Number(v.price) || 0) * (Number(v.stock) || 0)), 0) || 0), 0
  );

  // --- VARIANT HANDLERS ---
  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { weight: '', unit: 'gms', price: '', stock: '', active: true }]
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData({ ...formData, variants: formData.variants.filter((_, i) => i !== index) });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  // --- FORM HANDLERS ---
  const handleEditClick = (item) => {
    setEditId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      type: item.type || 'veg',
      isAvailable: item.isAvailable ?? true,
      variants: item.variants?.map(v => ({...v, active: v.active ?? true})) || [{ weight: '', unit: 'gms', price: '', stock: '', active: true }]
    });
    setImagePreview(item.imageUrl);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setFormData({ ...initialFormState, category: categoryOptions[0] || '' });
    setImagePreview(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = imagePreview; 
      if (imageFile) {
        const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const processedVariants = formData.variants.map(v => ({
        ...v,
        weight: Number(v.weight),
        price: Number(v.price),
        stock: Number(v.stock),
        active: v.active ?? true
      }));

      const productData = {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        isAvailable: formData.isAvailable,
        imageUrl: imageUrl || '',
        variants: processedVariants,
        updatedAt: new Date()
      };

      if (editId) {
        await updateDoc(doc(db, "products", editId), productData);
        toast.success("Inventory Sync Successful!");
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
        toast.success("New Item Added Live!");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to sync inventory.");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Permanent delete? This cannot be undone.")) {
      await deleteDoc(doc(db, "products", id));
      toast.success("Removed from database");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getPriceDisplay = (variants) => {
    const activeVariants = variants?.filter(v => v.active) || [];
    if (activeVariants.length === 0) return "Unavailable";
    const prices = activeVariants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  };

  if (fetching) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-brand-red" size={40} /></div>;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl italic font-bold tracking-tight text-gray-800 uppercase">Menu <span className="text-brand-orange">Live Inventory</span></h2>
          <p className="mt-1 text-sm font-medium text-gray-500">Real-time stock management dashboard.</p>
        </div>
        <button 
          onClick={handleAddNewClick}
          className="flex items-center gap-2 px-6 py-3 text-xs font-black tracking-widest text-white uppercase transition-all rounded-2xl bg-gradient-to-r from-brand-red to-brand-orange hover:shadow-xl hover:scale-105"
        >
          <Plus size={18} /> Add New Item
        </button>
      </div>

      {/* LIVE STATS CARDS */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="flex items-center gap-5 p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
          <div className="p-4 text-blue-600 shadow-inner rounded-2xl bg-blue-50"><Package size={28} /></div>
          <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Items</p><h3 className="text-3xl font-black text-gray-800">{totalItems}</h3></div>
        </div>
        <div className="flex items-center gap-5 p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
          <div className="p-4 text-orange-600 shadow-inner rounded-2xl bg-orange-50"><BarChart3 size={28} /></div>
          <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Units</p><h3 className="text-3xl font-black text-gray-800">{totalStock}</h3></div>
        </div>
        <div className="flex items-center gap-5 p-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
          <div className="p-4 text-green-600 shadow-inner rounded-2xl bg-green-50"><IndianRupee size={28} /></div>
          <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Value</p><h3 className="text-3xl font-black text-gray-800">₹{totalWorth.toLocaleString()}</h3></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" size={18} />
          <input type="text" placeholder="Search live products..." className="w-full py-4 pl-12 pr-4 text-sm font-bold bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand-orange" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative w-full md:w-56">
          <Filter className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" size={18} />
          <select className="w-full py-4 pl-12 pr-4 text-sm font-bold bg-white border-none shadow-sm appearance-none rounded-2xl focus:ring-2 focus:ring-brand-orange" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categoryOptions.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((item) => (
          <div key={item.id} className="flex flex-col overflow-hidden transition-all bg-white border border-gray-100 shadow-sm rounded-[2rem] hover:shadow-2xl hover:-translate-y-1 group">
            <div className="relative w-full aspect-[5/4] bg-gray-100">
              <img src={item.imageUrl || 'https://via.placeholder.com/300'} alt="" className={`object-cover w-full h-full transition-all duration-500 group-hover:scale-110 ${!item.isAvailable ? 'opacity-40 grayscale' : ''}`} />
              <div className="absolute flex gap-2 top-3 left-3">
                <span className="px-3 py-1 text-[10px] font-black tracking-widest text-gray-800 uppercase rounded-full shadow-lg bg-white/90 backdrop-blur-md">{item.category}</span>
              </div>
              <div className="absolute top-3 right-3">
                <div className={`w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-lg border-2 ${item.type === 'veg' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className={`w-3 h-3 rounded-full ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-black leading-tight text-gray-800 uppercase transition-colors group-hover:text-brand-red">{item.name}</h3>
                <p className="text-sm font-black text-brand-orange">{getPriceDisplay(item.variants)}</p>
              </div>
              
              <div className="mb-4 space-y-2">
                {item.variants?.map((v, idx) => (
                   <div key={idx} className={`flex items-center justify-between p-2 border rounded-xl bg-gray-50 ${!v.active ? 'opacity-50 grayscale border-dashed' : 'border-gray-100'}`}>
                      <span className="text-[10px] font-black text-gray-500 uppercase">{v.weight} {v.unit}</span>
                      <div className="flex items-center gap-2">
                         {!v.active && <EyeOff size={12} className="text-red-400" />}
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${!v.active ? 'bg-gray-200 text-gray-400' : v.stock <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                           {v.active ? `${v.stock} LEFT` : 'HIDDEN'}
                         </span>
                      </div>
                   </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 mt-auto border-t border-gray-50">
                  <button onClick={() => handleEditClick(item)} className="flex items-center justify-center flex-1 gap-2 py-3 text-[10px] font-black text-gray-600 uppercase tracking-widest transition rounded-xl bg-gray-100 hover:bg-gray-200">
                    <Edit2 size={14}/> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="flex items-center justify-center px-4 text-red-500 transition rounded-xl bg-red-50 hover:bg-red-500 hover:text-white">
                    <Trash2 size={16}/>
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl flex flex-col max-h-[90vh] bg-white shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0 bg-gray-50/50">
              <h3 className="text-xl italic font-black tracking-tighter text-gray-800 uppercase">{editId ? 'Sync' : 'New'} Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 transition-colors rounded-full hover:bg-gray-200"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="flex flex-col gap-6 md:flex-row">
                    <div className="w-full md:w-1/3">
                        <div className="relative aspect-square overflow-hidden transition border-4 border-gray-100 border-dashed cursor-pointer rounded-[2rem] hover:bg-gray-50 hover:border-brand-orange group">
                            <input type="file" onChange={handleImageChange} className="absolute inset-0 z-10 opacity-0 cursor-pointer" />
                            {imagePreview ? <img src={imagePreview} className="object-cover w-full h-full p-2 rounded-[1.5rem]" alt="" /> : 
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-brand-orange">
                                <ImageIcon size={40} /><span className="mt-2 text-[10px] font-black uppercase">Click Upload</span>
                            </div>}
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Name</label>
                            <input className="w-full p-4 mt-1 text-sm font-bold border-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-brand-orange" placeholder="Name..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                <select className="w-full p-4 mt-1 text-sm font-bold border-none appearance-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-brand-orange" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Food Type</label>
                                <div className="flex gap-2 mt-1">
                                    <button type="button" onClick={() => setFormData({...formData, type: 'veg'})} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase border-2 transition ${formData.type === 'veg' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-100 text-gray-400'}`}>Veg</button>
                                    <button type="button" onClick={() => setFormData({...formData, type: 'non-veg'})} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase border-2 transition ${formData.type === 'non-veg' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-100 text-gray-400'}`}>Non</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Variants & Stock (Live)</label>
                        <button type="button" onClick={handleAddVariant} className="text-[10px] font-black text-brand-orange hover:underline uppercase tracking-tighter">+ Add size</button>
                    </div>
                    {formData.variants.map((variant, index) => (
                        <div key={index} className={`flex flex-col gap-3 p-4 border rounded-3xl transition-colors ${!variant.active ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variant #{index + 1}</span>
                                <div className="flex items-center gap-3">
                                    {/* --- ACTIVE TOGGLE FOR VARIANT --- */}
                                    <button 
                                      type="button" 
                                      onClick={() => handleVariantChange(index, 'active', !variant.active)}
                                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${variant.active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                    >
                                      {variant.active ? <Eye size={12}/> : <EyeOff size={12}/>}
                                      <span className="text-[9px] font-black uppercase">{variant.active ? 'Active' : 'Hidden'}</span>
                                    </button>

                                    <button type="button" onClick={() => handleRemoveVariant(index)} className="p-2 text-red-400 transition-colors hover:text-red-600" disabled={formData.variants.length === 1}><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                <input type="number" placeholder="Wt" className="w-full p-3 text-xs font-bold bg-white rounded-xl" value={variant.weight} onChange={e => handleVariantChange(index, 'weight', e.target.value)} required />
                                <select className="w-full p-3 text-xs font-bold bg-white appearance-none rounded-xl" value={variant.unit} onChange={e => handleVariantChange(index, 'unit', e.target.value)}>
                                    <option value="gms">gms</option><option value="kg">kg</option><option value="ml">ml</option><option value="ltr">ltr</option><option value="pcs">pcs</option><option value="pc">pc</option>
                                </select>
                                <input type="number" placeholder="₹" className="w-full p-3 text-xs font-bold bg-white rounded-xl text-brand-red" value={variant.price} onChange={e => handleVariantChange(index, 'price', e.target.value)} required />
                                <input type="number" placeholder="Stock" className="w-full p-3 text-xs font-bold bg-white rounded-xl text-brand-orange" value={variant.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} required />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50 rounded-3xl">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Visibility (Main Product)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
              </div>

              <div className="flex gap-4 p-8 bg-white border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-xs font-black tracking-widest text-gray-400 uppercase transition-colors hover:bg-gray-50 rounded-2xl">Discard</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 text-xs font-black text-white uppercase tracking-widest bg-brand-red rounded-2xl shadow-xl shadow-red-100 hover:bg-brand-dark transition-all">
                  {loading ? 'Syncing...' : (editId ? 'Commit Changes' : 'Publish Product')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}