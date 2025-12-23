import React from 'react';
import { Plus, Trash2, Type, AlignLeft, MousePointer2 } from 'lucide-react';

export default function BannerManager({ banners, onUpload, onRemove, onUpdate }) {
  // onUpdate(id, field, value) will be called from HomeEditor to save changes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Promotional Banners</h3>
        <label className="flex items-center gap-2 px-4 py-2 text-sm font-bold transition border cursor-pointer border-brand-red text-brand-red rounded-xl hover:bg-red-50">
          <Plus size={16}/> Upload New Banner
          <input type="file" className="hidden" onChange={onUpload} accept="image/*" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {banners.map((banner) => (
          <div key={banner.id} className="flex flex-col gap-4 p-4 transition-all bg-white border border-gray-200 shadow-sm md:flex-row rounded-3xl hover:border-brand-orange/30">
            
            {/* Image Preview Area */}
            <div className="relative w-full overflow-hidden border border-gray-100 md:w-48 aspect-video md:aspect-square shrink-0 rounded-2xl bg-gray-50">
              <img src={banner.imageUrl} alt="Banner" className="object-cover w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center transition opacity-0 bg-black/40 hover:opacity-100">
                <button 
                  onClick={() => onRemove(banner.id)} 
                  className="p-2 text-red-600 transition bg-white rounded-full shadow-xl hover:scale-110"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>

            {/* Content Editing Area */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Type size={12} /> Banner Title
                </label>
                <input 
                  type="text"
                  placeholder="e.g. 50% Off on Sweets"
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange"
                  value={banner.title || ''}
                  onChange={(e) => onUpdate(banner.id, 'title', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <AlignLeft size={12} /> Description
                </label>
                <textarea 
                  placeholder="Short catchy line..."
                  rows="1"
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange"
                  value={banner.description || ''}
                  onChange={(e) => onUpdate(banner.id, 'description', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <MousePointer2 size={12} /> Button Text
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Order Now"
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange"
                  value={banner.buttonText || ''}
                  onChange={(e) => onUpdate(banner.id, 'buttonText', e.target.value)}
                />
              </div>
            </div>

          </div>
        ))}

        {banners.length === 0 && (
          <div className="py-20 text-center text-gray-400 border-2 border-gray-100 border-dashed rounded-3xl col-span-full">
            <p>No banners yet. Click 'Upload New' to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}