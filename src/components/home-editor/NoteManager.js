import React from 'react';
import { Trash2, Plus, Megaphone } from 'lucide-react';

export default function NoteManager({ notes, onAdd, onUpdate, onRemove }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-lg text-brand-orange">
            <Megaphone size={20} />
          </div>
          <h3 className="font-bold text-gray-800">Scrolling Header Announcements</h3>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-1 text-sm font-bold text-brand-orange hover:bg-orange-50 px-3 py-1.5 rounded-lg transition"
        >
          <Plus size={16} /> Add New Line
        </button>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="py-10 text-center text-gray-400 border-2 border-gray-100 border-dashed rounded-2xl">
            <p className="text-sm">No announcements active. Add one to show a scrolling ticker on the home screen.</p>
          </div>
        ) : (
          notes.map((note, index) => (
            <div key={note.id} className="flex items-center gap-3 duration-300 group animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-center flex-none w-8 h-8 text-xs font-bold text-gray-400 bg-gray-100 rounded-lg">
                {index + 1}
              </div>
              <input 
                type="text"
                placeholder="e.g. 🎉 Grand Opening! Get 10% off on all sweets."
                className="flex-1 p-3 text-sm transition-all bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                value={note.text}
                onChange={(e) => onUpdate(note.id, e.target.value)}
              />
              <button 
                onClick={() => onRemove(note.id)}
                className="p-3 text-red-400 transition-colors hover:text-red-600 hover:bg-red-50 rounded-xl"
                title="Delete note"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3 p-4 mt-4 border border-blue-100 bg-blue-50 rounded-xl">
        <div className="text-blue-500 shrink-0">
          <Plus size={18} />
        </div>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          <strong>Tip:</strong> Keep notes short and catchy. If you add multiple notes, they will cycle through automatically in a scrolling ticker on the mobile app.
        </p>
      </div>
    </div>
  );
}