import React from 'react';
import { Plus, Trash2, Timer, ArrowUpAz } from 'lucide-react';

export default function BannerManager({ banners, onUpload, onRemove, onUpdate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-bold tracking-tight text-gray-800 uppercase">Promotional Banners</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manage visual slides for the Home Screen</p>
        </div>
        <label className="flex items-center gap-2 px-6 py-2.5 text-xs font-black transition-all bg-brand-red text-white rounded-2xl cursor-pointer hover:bg-brand-dark shadow-lg shadow-red-100">
          <Plus size={16}/> UPLOAD BANNER
          <input type="file" className="hidden" onChange={onUpload} accept="image/*" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {banners.map((banner, index) => (
          <div key={banner.id} className="flex flex-col gap-6 p-5 transition-all bg-white border border-gray-100 shadow-sm md:flex-row rounded-[2rem] hover:shadow-xl group">
            
            {/* Image Preview Area */}
            <div className="relative w-full overflow-hidden border border-gray-100 md:w-44 aspect-video md:aspect-square shrink-0 rounded-2xl bg-gray-50">
              <img src={banner.imageUrl} alt="Banner" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 flex items-center justify-center transition opacity-0 bg-black/40 group-hover:opacity-100">
                <button 
                  onClick={() => onRemove(banner.id)} 
                  className="p-3 text-white transition bg-red-600 rounded-full shadow-2xl hover:scale-110 hover:bg-red-700"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>

            {/* Banner Logic Area */}
            <div className="flex-1 py-1 space-y-4">
              {/* ALIGNMENT / ORDER */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5 tracking-widest">
                  <ArrowUpAz size={14} className="text-brand-orange" /> Display Order
                </label>
                <select 
                  className="w-full p-3 text-xs font-bold border-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-orange"
                  value={banner.order || index + 1}
                  onChange={(e) => onUpdate(banner.id, 'order', Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>Position {num} {num === 1 ? '(Primary)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* TIME DURATION */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5 tracking-widest">
                  <Timer size={14} className="text-blue-500" /> Auto-Slide Time
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    className="flex-1 accent-brand-orange h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    value={banner.duration || 5}
                    onChange={(e) => onUpdate(banner.id, 'duration', Number(e.target.value))}
                  />
                  <span className="text-xs font-black text-gray-700 min-w-[40px] bg-gray-100 px-2 py-1 rounded-lg text-center">
                    {banner.duration || 5}s
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-green-700 uppercase">Live on App</span>
                </div>
              </div>
            </div>

          </div>
        ))}

        {banners.length === 0 && (
          <div className="py-24 text-center text-gray-400 border-4 border-gray-50 border-dashed rounded-[2.5rem] col-span-full">
            <Plus size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-black tracking-widest uppercase">No Active Banners</p>
            <p className="mt-1 text-xs">Upload images to show promotions on the home screen</p>
          </div>
        )}
      </div>
    </div>
  );
}