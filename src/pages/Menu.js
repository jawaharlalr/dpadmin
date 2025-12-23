import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, Image as ImageIcon, X, Package, Search, Filter, DollarSign, BarChart3} from 'lucide-react';

export default function Menu() {
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Updated Form State to support Variants
  const initialFormState = { 
    name: '', 
    category: '', 
    type: 'veg',
    isAvailable: true,
    variants: [{ weight: '', unit: 'gms', price: '', stock: '' }] // Start with one empty variant
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      const prodSnap = await getDocs(collection(db, "products"));
      const items = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);

      const catSnap = await getDocs(collection(db, "categories"));
      const cats = catSnap.docs.map(doc => doc.data().name);
      setCategoryOptions(cats);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // --- STATS CALCULATION ---
  const totalItems = products.length;
  
  const totalStock = products.reduce((acc, item) => {
    if (item.variants && Array.isArray(item.variants)) {
      return acc + item.variants.reduce((vAcc, v) => vAcc + (Number(v.stock) || 0), 0);
    }
    return acc; // Backward compatibility if needed
  }, 0);

  const totalWorth = products.reduce((acc, item) => {
    if (item.variants && Array.isArray(item.variants)) {
      return acc + item.variants.reduce((vAcc, v) => vAcc + ((Number(v.price) || 0) * (Number(v.stock) || 0)), 0);
    }
    return acc;
  }, 0);

  // --- VARIANT HANDLERS ---
  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { weight: '', unit: 'gms', price: '', stock: '' }]
    });
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  // --- FORM HANDLERS ---
  const handleEditClick = (item) => {
    setEditId(item.id);
    // Ensure variants exist, otherwise create a default structure from old data format if necessary
    const variants = item.variants || [{ 
      weight: item.quantity, 
      unit: item.unit, 
      price: item.price, 
      stock: item.stockCount 
    }];

    setFormData({
      name: item.name,
      category: item.category,
      type: item.type || 'veg',
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      variants: variants
    });
    setImagePreview(item.imageUrl);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditId(null);
    setFormData({ ...initialFormState, category: categoryOptions[0] || 'Snacks' });
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

      // Process variants to ensure numbers
      const processedVariants = formData.variants.map(v => ({
        weight: Number(v.weight),
        unit: v.unit,
        price: Number(v.price),
        stock: Number(v.stock)
      }));

      const productData = {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        isAvailable: formData.isAvailable,
        imageUrl: imageUrl || '',
        variants: processedVariants, // Save the array
        updatedAt: new Date()
      };

      if (editId) {
        await updateDoc(doc(db, "products", editId), productData);
        toast.success("Product updated successfully!");
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: new Date()
        });
        toast.success("Product added successfully!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product.");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this item?")) {
      await deleteDoc(doc(db, "products", id));
      fetchData();
      toast.success("Product deleted");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Helper to display price range
  const getPriceDisplay = (variants) => {
    if (!variants || variants.length === 0) return "₹0";
    const prices = variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage snacks, sweets, and inventory.</p>
        </div>
        <button 
          onClick={handleAddNewClick}
          className="flex items-center gap-2 px-5 py-2.5 text-white transition-all rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:shadow-lg hover:scale-105"
        >
          <Plus size={20} /> Add New Item
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
        <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="p-3 text-blue-600 rounded-full bg-blue-50">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Items</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalItems}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="p-3 text-orange-600 rounded-full bg-orange-50">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Stock (All Variants)</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalStock} units</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="p-3 text-green-600 rounded-full bg-green-50">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Inventory Worth</p>
            <h3 className="text-2xl font-bold text-gray-800">₹{totalWorth.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 bg-white input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-48">
          <Filter className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
          <select 
            className="w-full pl-10 bg-white input-field"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categoryOptions.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((item) => (
          <div key={item.id} className="flex flex-col overflow-hidden transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-lg">
            
            {/* Image Area */}
            <div className="relative w-full aspect-[4/3] bg-gray-100">
              <img 
                src={item.imageUrl || 'https://via.placeholder.com/300'} 
                alt={item.name} 
                className={`object-cover w-full h-full transition-opacity duration-300 ${!item.isAvailable ? 'opacity-60 grayscale' : ''}`} 
              />
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 text-xs font-bold tracking-wide text-gray-700 uppercase rounded-lg shadow-sm bg-white/90 backdrop-blur-sm">
                  {item.category}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <div className={`w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm border-2 ${item.type === 'veg' ? 'border-green-600' : 'border-red-600'}`}>
                  <div className={`w-3 h-3 rounded-full ${item.type === 'veg' ? 'bg-green-600' : 'bg-red-600'}`} />
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col flex-1 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                <p className="text-lg font-bold text-brand-orange">{getPriceDisplay(item.variants)}</p>
              </div>
              
              {/* Variants Display */}
              <div className="mb-4 space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase">Available Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {item.variants?.map((v, idx) => (
                     <span key={idx} className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md">
                        {v.weight} {v.unit}
                     </span>
                  ))}
                </div>
              </div>

              {/* Total Stock */}
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                 <Package size={14} />
                 <span>Total Stock: <span className="font-bold text-gray-800">{item.variants?.reduce((acc, v) => acc + (v.stock || 0), 0)}</span></span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 mt-auto border-t border-gray-100">
                  <button 
                      onClick={() => handleEditClick(item)} 
                      className="flex items-center justify-center flex-1 gap-2 py-2 text-sm font-medium text-gray-700 transition rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                      <Edit2 size={16}/> Edit
                  </button>
                  <button 
                      onClick={() => handleDelete(item.id)} 
                      className="flex items-center justify-center px-3 text-red-500 transition rounded-lg bg-red-50 hover:bg-red-100"
                  >
                      <Trash2 size={16}/>
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl flex flex-col max-h-[90vh] bg-white shadow-2xl rounded-2xl">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{editId ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* Top Section: Image & Basic Info */}
                <div className="flex flex-col gap-6 md:flex-row">
                    {/* Image Upload */}
                    <div className="w-full md:w-1/3">
                        <div className="relative w-full h-40 overflow-hidden transition border-2 border-gray-300 border-dashed cursor-pointer rounded-xl hover:bg-gray-50 group">
                            <input type="file" onChange={handleImageChange} className="absolute inset-0 z-10 opacity-0 cursor-pointer" />
                            {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="object-contain w-full h-full p-2" />
                            ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-brand-orange">
                                <ImageIcon size={32} />
                                <span className="mt-2 text-xs font-medium text-center">Click to upload</span>
                            </div>
                            )}
                        </div>
                    </div>

                    {/* Basic Fields */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Item Name</label>
                            <input 
                                className="mt-1 input-field"
                                placeholder="e.g., Spicy Mixture"
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                                <select 
                                    className="mt-1 input-field"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {categoryOptions.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                <div className="flex gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'veg'})}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${formData.type === 'veg' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        Veg
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, type: 'non-veg'})}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${formData.type === 'non-veg' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        Non-Veg
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants Section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Product Variants (Size & Price)</label>
                        <button type="button" onClick={handleAddVariant} className="flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline">
                            <Plus size={14}/> Add Variant
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {formData.variants.map((variant, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 bg-gray-50 rounded-xl">
                                <div className="grid flex-1 grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Weight</label>
                                        <input 
                                            type="number"
                                            placeholder="250" 
                                            className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-brand-orange"
                                            value={variant.weight}
                                            onChange={e => handleVariantChange(index, 'weight', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Unit</label>
                                        <select 
                                            className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-brand-orange"
                                            value={variant.unit}
                                            onChange={e => handleVariantChange(index, 'unit', e.target.value)}
                                        >
                                            <option value="gms">gms</option>
                                            <option value="kg">kg</option>
                                            <option value="ml">ml</option>
                                            <option value="ltr">ltr</option>
                                            <option value="pcs">pcs</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Price (₹)</label>
                                        <input 
                                            type="number"
                                            placeholder="0" 
                                            className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-brand-orange"
                                            value={variant.price}
                                            onChange={e => handleVariantChange(index, 'price', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Stock</label>
                                        <input 
                                            type="number"
                                            placeholder="Qty" 
                                            className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-brand-orange"
                                            value={variant.stock}
                                            onChange={e => handleVariantChange(index, 'stock', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveVariant(index)}
                                    className="p-2 mt-6 text-red-500 transition rounded-lg hover:bg-red-50"
                                    disabled={formData.variants.length === 1} // Prevent removing last variant
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">Available for Sale</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.isAvailable}
                            onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 pt-2 bg-white border-t border-gray-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-medium text-gray-600 transition hover:bg-gray-50 rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 font-bold text-white transition shadow-lg bg-brand-red rounded-xl hover:bg-brand-dark shadow-red-200">
                  {loading ? 'Saving...' : (editId ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}