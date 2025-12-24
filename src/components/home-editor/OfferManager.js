import React from 'react';
import { Plus, X, Tag, IndianRupee } from 'lucide-react';

export default function OfferManager({ offers, onAdd, onUpdate, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="text-brand-orange" size={20} />
          <h3 className="font-bold tracking-tight text-gray-800 uppercase">Discount Cards</h3>
        </div>
        <button 
          onClick={onAdd} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-black tracking-widest uppercase transition-all bg-brand-orange/10 text-brand-orange rounded-xl hover:bg-brand-orange hover:text-white"
        >
          <Plus size={16}/> New Offer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <div key={offer.id} className="relative p-6 space-y-4 transition-all border border-gray-100 shadow-sm rounded-[2rem] bg-white hover:shadow-xl group">
            {/* Remove Button */}
            <button 
              onClick={() => onRemove(offer.id)} 
              className="absolute p-2 text-gray-300 transition rounded-full top-4 right-4 hover:text-red-600 hover:bg-red-50"
            >
              <X size={20}/>
            </button>

            {/* Offer Header / Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Offer Heading</label>
              <input 
                placeholder="e.g. Festival Special" 
                className="w-full p-3 text-sm font-bold transition-all border-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-brand-orange" 
                value={offer.title} 
                onChange={e => onUpdate(offer.id, 'title', e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
               {/* Discount Tag */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Text</label>
                <input 
                  placeholder="e.g. ₹50 OFF" 
                  className="w-full p-3 text-sm font-bold text-green-600 transition-all border-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-brand-orange" 
                  value={offer.discount} 
                  onChange={e => onUpdate(offer.id, 'discount', e.target.value)} 
                />
              </div>

              {/* Minimum Purchase Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Order (₹)</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input 
                    type="number"
                    placeholder="e.g. 500" 
                    className="w-full p-3 pl-8 text-sm font-bold transition-all border-none bg-gray-50 rounded-2xl focus:ring-2 focus:ring-brand-orange" 
                    value={offer.minAmount} 
                    onChange={e => onUpdate(offer.id, 'minAmount', e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Summary Preview Badge */}
            <div className="pt-2">
                <div className="px-4 py-2 border border-orange-100 border-dashed bg-orange-50 rounded-xl">
                    <p className="text-[10px] text-brand-orange font-bold uppercase text-center tracking-tighter">
                        {offer.discount && offer.minAmount ? 
                        `Customer gets ${offer.discount} on orders above ₹${offer.minAmount}` : 
                        "Fill details to preview offer logic"}
                    </p>
                </div>
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="py-16 text-center text-gray-400 border-4 border-gray-100 border-dashed col-span-full rounded-[2.5rem]">
            <Tag size={40} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No active discount cards.</p>
            <p className="mt-1 text-xs tracking-widest uppercase">Create offers to boost your sales</p>
          </div>
        )}
      </div>
    </div>
  );
}