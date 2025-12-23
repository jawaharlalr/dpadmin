import React from 'react';
import { Search, Star } from 'lucide-react';

export default function BestSellerManager({ products, selectedIds, onToggle, search, onSearchChange }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h3 className="font-bold text-gray-800">Featured "Best Seller" Products</h3>
        <div className="relative max-w-xs">
          <Search className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" size={16}/>
          <input 
            placeholder="Search products..." 
            className="w-full py-2 text-sm border border-gray-200 rounded-lg pl-9 focus:outline-none focus:border-brand-orange"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto p-2 border border-gray-50 rounded-xl bg-gray-50/50">
        {products
          .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
          .map(product => {
            const isSelected = selectedIds.includes(product.id);
            return (
              <button 
                key={product.id}
                onClick={() => onToggle(product.id)}
                className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                  isSelected ? 'border-brand-orange bg-orange-50 shadow-sm' : 'border-white bg-white hover:border-gray-200'
                }`}
              >
                <div className="w-16 h-16 overflow-hidden bg-gray-100 rounded-full">
                  <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                </div>
                <span className="text-xs font-bold text-gray-700 line-clamp-1">{product.name}</span>
                {isSelected && <div className="absolute top-2 right-2 text-brand-orange"><Star size={14} fill="currentColor"/></div>}
              </button>
            );
          })}
      </div>
    </div>
  );
}