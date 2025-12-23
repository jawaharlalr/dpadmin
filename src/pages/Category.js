import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase'; // Ensure storage is exported from your firebase.js
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, Layers, Search, Image as ImageIcon } from 'lucide-react';

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const initialFormState = { name: '' };
  const [formData, setFormData] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const results = categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(results);
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // --- HANDLERS ---

  const handleAddNewClick = () => {
    setEditId(null);
    setFormData(initialFormState);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (category) => {
    setEditId(category.id);
    setFormData({ name: category.name });
    setImagePreview(category.imageUrl || null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this category? Items in this category might lose their filter association.")) {
      try {
        await deleteDoc(doc(db, "categories", id));
        fetchCategories();
        toast.success("Category deleted");
      } catch (error) {
        toast.error("Failed to delete category");
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalImageUrl = imagePreview;

      // 1. Upload Image if a new file was selected
      if (imageFile) {
        const storageRef = ref(storage, `categories/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const categoryData = {
        name: formData.name,
        imageUrl: finalImageUrl || '',
        updatedAt: new Date()
      };

      if (editId) {
        await updateDoc(doc(db, "categories", editId), categoryData);
        toast.success("Category updated!");
      } else {
        await addDoc(collection(db, "categories"), {
          ...categoryData,
          createdAt: new Date()
        });
        toast.success("Category created!");
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category.");
    }
    setLoading(false);
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
          <p className="mt-1 text-sm text-gray-500">Manage grouping for your menu items.</p>
        </div>
        <button 
          onClick={handleAddNewClick}
          className="flex items-center gap-2 px-5 py-2.5 text-white transition-all rounded-xl bg-gradient-to-r from-brand-red to-brand-orange hover:shadow-lg hover:scale-105"
        >
          <Plus size={20} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
        <input 
          type="text" 
          placeholder="Search categories..." 
          className="w-full pl-10 bg-white input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-300 border-dashed rounded-2xl">
           <Layers className="mx-auto mb-3 text-gray-300" size={48} />
           <p className="text-gray-500">No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="relative overflow-hidden transition-all bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-lg group">
              
              {/* Category Image */}
              <div className="relative w-full h-32 overflow-hidden bg-gray-100">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-300">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="mb-4 text-lg font-bold text-gray-800 truncate">{cat.name}</h3>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(cat)} 
                    className="flex items-center justify-center flex-1 gap-2 py-2 text-sm font-medium text-gray-700 transition rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    <Edit2 size={16}/> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)} 
                    className="flex items-center justify-center px-3 text-red-500 transition rounded-lg bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">{editId ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Image Upload Section */}
              <div className="flex flex-col items-center">
                <div className="relative w-full h-32 overflow-hidden transition border-2 border-gray-300 border-dashed cursor-pointer rounded-xl group hover:bg-gray-50">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="absolute inset-0 z-10 opacity-0 cursor-pointer" 
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ImageIcon size={32} />
                      <span className="mt-2 text-xs">Upload Category Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category Name</label>
                <input 
                  className="mt-1 input-field"
                  placeholder="e.g., Spicy Snacks"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-medium text-gray-600 transition hover:bg-gray-50 rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 font-bold text-white transition shadow-lg bg-brand-red rounded-xl hover:bg-brand-dark shadow-red-200">
                  {loading ? 'Saving...' : (editId ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}