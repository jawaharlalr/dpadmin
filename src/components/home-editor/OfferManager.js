import React from 'react';
import { Plus, X, Tag } from 'lucide-react';

export default function OfferManager({ offers, onAdd, onUpdate, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="text-brand-orange" size={20} />
          <h3 className="font-bold text-gray-800">Discount Cards</h3>
        </div>
        <button 
          onClick={onAdd} 
          className="flex items-center gap-2 text-sm font-bold text-brand-orange hover:underline"
        >
          <Plus size={16}/> New Offer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <div key={offer.id} className="relative p-5 space-y-4 transition-all border border-gray-100 shadow-sm rounded-2xl bg-gray-50 hover:shadow-md">
            {/* Remove Button */}
            <button 
              onClick={() => onRemove(offer.id)} 
              className="absolute text-gray-400 transition top-4 right-4 hover:text-red-600"
            >
              <X size={20}/>
            </button>

            {/* Offer Header / Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Offer Header</label>
              <input 
                placeholder="e.g. Weekend Special Sale" 
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange transition-all" 
                value={offer.title} 
                onChange={e => onUpdate(offer.id, 'title', e.target.value)} 
              />
            </div>

            {/* Discount Tag Only */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discount Tag</label>
              <input 
                placeholder="e.g. ₹100 OFF / 20% Discount" 
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange transition-all" 
                value={offer.discount} 
                onChange={e => onUpdate(offer.id, 'discount', e.target.value)} 
              />
            </div>
          </div>
        ))}

        {offers.length === 0 && (
          <div className="py-12 text-center text-gray-400 border-2 border-gray-200 border-dashed col-span-full rounded-3xl">
            <p>No active discount cards. Click "New Offer" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}