import React from 'react';
import { Plus, Trash2, Clock, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromotionManager({ promotions, onAdd, onUpdate, onRemove, onImageUpload }) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl italic font-black tracking-tight text-gray-800 uppercase">Festive & Info Banners</h3>
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">Main display banner for offers and events</p>
        </div>
        {promotions.length === 0 && (
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all bg-brand-orange rounded-xl hover:scale-105 shadow-lg"
          >
            <Plus size={14} strokeWidth={3} /> Create Banner
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {promotions.map((promo) => (
            <motion.div 
              key={promo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 border-2 border-gray-100 bg-white rounded-[3rem] shadow-xl space-y-6"
            >
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Left: Image Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Background Image</label>
                  <div className="relative group aspect-video rounded-[2rem] overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center transition-all hover:border-brand-orange">
                    {promo.imageUrl ? (
                      <>
                        <img src={promo.imageUrl} className="object-cover w-full h-full" alt="Preview" />
                        <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                           <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">Change Image</label>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <ImageIcon size={32} strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase">Upload 16:9 Image</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onImageUpload(promo.id, e.target.files[0])} />
                  </div>
                </div>

                {/* Right: Content Fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title & Emoji</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" placeholder="Title (e.g. Diwali Dhamaka)"
                        className="flex-1 p-3 text-sm font-bold border-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-orange"
                        value={promo.text} onChange={(e) => onUpdate(promo.id, 'text', e.target.value)}
                      />
                      <input 
                        type="text" placeholder="🎁"
                        className="w-16 p-3 text-lg text-center border-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-orange"
                        value={promo.emoji} onChange={(e) => onUpdate(promo.id, 'emoji', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description / Subtext</label>
                    <textarea 
                      placeholder="Enter offer details..."
                      className="w-full h-20 p-3 text-xs font-medium border-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-orange"
                      value={promo.subText} onChange={(e) => onUpdate(promo.id, 'subText', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deadline (For Countdown)</label>
                    <div className="relative">
                      <Clock className="absolute text-gray-400 left-3 top-3" size={16} />
                      <input 
                        type="datetime-local"
                        className="w-full p-3 pl-10 text-xs font-bold border-none bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-orange"
                        value={promo.deadline} onChange={(e) => onUpdate(promo.id, 'deadline', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => onRemove(promo.id)} className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest">
                  <Trash2 size={16} /> Delete Banner
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}