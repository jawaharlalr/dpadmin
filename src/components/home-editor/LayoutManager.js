import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function LayoutManager({ order, alignment, onMove, onAlignmentChange }) {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="mb-4 font-bold text-gray-800">Category Order</h3>
        <p className="mb-6 text-xs italic text-gray-400">Top category appears first in the app.</p>
        <div className="max-w-md space-y-2">
          {order.map((catName, index) => (
            <div key={catName} className="flex items-center justify-between p-4 border border-gray-100 shadow-sm bg-gray-50 rounded-2xl">
              <span className="text-sm font-bold text-gray-700">{catName}</span>
              <div className="flex gap-2">
                <button disabled={index === 0} onClick={() => onMove(index, -1)} className="p-2 bg-white rounded-lg shadow-sm hover:text-brand-orange disabled:opacity-20"><ArrowUp size={16}/></button>
                <button disabled={index === order.length - 1} onClick={() => onMove(index, 1)} className="p-2 bg-white rounded-lg shadow-sm hover:text-brand-orange disabled:opacity-20"><ArrowDown size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-4 font-bold text-gray-800">Display Style</h3>
        <div className="flex flex-wrap gap-4">
          {['grid', 'list', 'scroll'].map(style => (
            <button 
              key={style} 
              onClick={() => onAlignmentChange(style)} 
              className={`px-8 py-4 rounded-2xl border-2 transition-all capitalize font-bold text-sm ${alignment === style ? 'border-brand-red bg-red-50 text-brand-red' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}