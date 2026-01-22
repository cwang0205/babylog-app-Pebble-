import React, { useState } from 'react';
import { ParseResult, EventType } from '../types';

interface Props {
  data: ParseResult;
  onConfirm: (data: ParseResult) => void;
  onCancel: () => void;
}

const EventConfirmation: React.FC<Props> = ({ data, onConfirm, onCancel }) => {
  const [editedData, setEditedData] = useState<ParseResult>(data);

  const handleChange = (field: keyof ParseResult, value: any) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleDetailsChange = (key: string, value: any) => {
    setEditedData({
      ...editedData,
      details: { ...editedData.details, [key]: value }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onCancel}></div>

      {/* Card */}
      <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        
        <div className="bg-cream border-b border-subtle p-6 text-center">
          <h2 className="text-xl font-serif font-bold text-charcoal">Just to be sure...</h2>
          <p className="text-charcoal/60 text-sm mt-1">Is this what you wanted to log?</p>
        </div>

        <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto no-scrollbar">
          
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase mb-1">Activity</label>
            <select
              value={editedData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full bg-subtle text-charcoal font-bold rounded-xl p-3 border-none focus:ring-2 focus:ring-rust/50"
            >
              {Object.values(EventType).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase mb-1">Time</label>
            <input
              type="datetime-local"
              value={editedData.startTime.slice(0, 16)}
              onChange={(e) => handleChange('startTime', new Date(e.target.value).toISOString())}
              className="w-full bg-subtle text-charcoal font-sans rounded-xl p-3 border-none focus:ring-2 focus:ring-rust/50"
            />
          </div>

          {/* Dynamic Details */}
          <div className="bg-cream p-4 rounded-xl border border-subtle">
            <h3 className="text-xs font-bold text-rust uppercase mb-3">Details</h3>
            
            {editedData.type === EventType.FEED && (
              <div className="flex gap-3">
                 <div className="flex-1">
                    <label className="text-[10px] text-charcoal/50 font-bold uppercase">Amount (ml)</label>
                    <input 
                       type="number" 
                       className="w-full bg-white p-2 rounded-lg border border-subtle mt-1 text-sm"
                       value={editedData.details?.amountml || ''}
                       onChange={(e) => handleDetailsChange('amountml', Number(e.target.value))}
                    />
                 </div>
                 <div className="flex-1">
                    <label className="text-[10px] text-charcoal/50 font-bold uppercase">Side</label>
                    <select 
                       className="w-full bg-white p-2 rounded-lg border border-subtle mt-1 text-sm"
                       value={editedData.details?.side || ''}
                       onChange={(e) => handleDetailsChange('side', e.target.value)}
                     >
                        <option value="">Select</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="both">Both</option>
                     </select>
                 </div>
              </div>
            )}

            {editedData.type === EventType.DIAPER && (
              <div>
                 <label className="text-[10px] text-charcoal/50 font-bold uppercase">Status</label>
                 <select 
                   className="w-full bg-white p-2 rounded-lg border border-subtle mt-1 text-sm"
                   value={editedData.details?.status || 'wet'}
                   onChange={(e) => handleDetailsChange('status', e.target.value)}
                 >
                    <option value="wet">Wet</option>
                    <option value="dirty">Dirty</option>
                    <option value="mixed">Mixed</option>
                 </select>
              </div>
            )}
            
            <div className="mt-3">
               <label className="text-[10px] text-charcoal/50 font-bold uppercase">Note</label>
               <input 
                 type="text" 
                 placeholder="Add a note..."
                 className="w-full bg-white p-2 rounded-lg border border-subtle mt-1 text-sm placeholder-charcoal/30"
                 value={editedData.notes || ''}
                 onChange={(e) => handleChange('notes', e.target.value)}
               />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-subtle flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-bold text-charcoal bg-subtle rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(editedData)}
            className="flex-1 py-3 text-sm font-bold text-white bg-rust rounded-xl shadow-lg shadow-rust/30 hover:bg-rust/90 transition-colors"
          >
            Save It
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventConfirmation;