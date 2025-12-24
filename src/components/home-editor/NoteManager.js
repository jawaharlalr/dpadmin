import React from 'react';
import { Trash2, Plus, Megaphone, Info } from 'lucide-react';

export default function NoteManager({ notes, onAdd, onUpdate, onRemove }) {
  // Logic: onUpdate(id, field, value) is expected from the parent
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-lg text-brand-orange">
            <Megaphone size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-gray-800 uppercase">Scrolling Announcements</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ticker messages for Home Screen</p>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs font-black tracking-widest uppercase transition-all bg-brand-orange/10 text-brand-orange rounded-xl hover:bg-brand-orange hover:text-white"
        >
          <Plus size={14} /> New Announcement
        </button>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="py-16 text-center text-gray-400 border-4 border-gray-100 border-dashed rounded-[2rem]">
            <Info size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm font-bold tracking-widest uppercase">No active notes</p>
          </div>
        ) : (
          notes.map((note, index) => (
            <div key={note.id} className="flex flex-col items-start gap-3 p-4 transition-all bg-white border border-gray-100 shadow-sm md:flex-row rounded-2xl group hover:shadow-md">
              
              {/* Index Badge */}
              <div className="flex items-center justify-center flex-none w-10 h-10 text-xs font-black border text-brand-orange bg-brand-orange/5 rounded-xl border-brand-orange/10">
                #{index + 1}
              </div>

              <div className="grid flex-1 w-full grid-cols-1 gap-3 md:grid-cols-4">
                {/* REASON / CATEGORY INPUT */}
                <div className="md:col-span-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Type / Reason</label>
                  <input 
                    type="text"
                    placeholder="e.g. Discount"
                    className="w-full mt-1 p-2.5 text-xs font-bold bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange uppercase"
                    value={note.reason || ''}
                    onChange={(e) => onUpdate(note.id, 'reason', e.target.value)}
                  />
                </div>

                {/* ANNOUNCEMENT MESSAGE */}
                <div className="md:col-span-3">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Announcement Message</label>
                  <input 
                    type="text"
                    placeholder="Enter the message to show customers..."
                    className="w-full mt-1 p-2.5 text-xs font-bold bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange"
                    value={note.text}
                    onChange={(e) => onUpdate(note.id, 'text', e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={() => onRemove(note.id)}
                className="self-center p-3 text-red-400 transition-all border border-transparent hover:bg-red-50 hover:text-red-600 rounded-xl hover:border-red-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3 p-5 border border-blue-100 bg-blue-50/50 rounded-[1.5rem]">
        <Info size={20} className="text-blue-500 shrink-0" />
        <div>
           <p className="text-[11px] text-blue-800 font-bold uppercase tracking-tight">Display Intelligence</p>
           <p className="text-[10px] text-blue-600/80 leading-relaxed mt-1">
             The <strong>Reason</strong> field helps you categorize notes. The <strong>Message</strong> will scroll automatically on the mobile app. Keep messages under 60 characters for best visibility.
           </p>
        </div>
      </div>
    </div>
  );
}