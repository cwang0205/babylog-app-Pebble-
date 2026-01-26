
import React, { useState } from 'react';
import { ParseResult, EventType } from '../types';
import { TrashIcon } from './Icons';

interface Props {
  data: ParseResult;
  mode?: 'create' | 'edit';
  onConfirm: (data: ParseResult) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const EventConfirmation: React.FC<Props> = ({ data, mode = 'create', onConfirm, onCancel, onDelete }) => {
  const [editedData, setEditedData] = useState<ParseResult>(data);

  const handleChange = (field: keyof ParseResult, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailsChange = (key: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      details: { ...prev.details, [key]: value }
    }));
  };

  // Helper: Convert UTC ISO string to "YYYY-MM-DDThh:mm" (Local Time) for input value
  const toLocalInputString = (isoString: string | undefined | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };

  // Helper: Convert Input "YYYY-MM-DDThh:mm" (Local) back to UTC ISO string
  const handleDateChange = (field: 'startTime' | 'endTime', inputValue: string) => {
    if (!inputValue) {
        handleChange(field, null);
        return;
    }
    const date = new Date(inputValue);
    handleChange(field, date.toISOString());
  };

  // Helper to ensure unit matches type when rendering or editing
  const getUnitForType = (type: string) => {
    switch(type) {
      case 'height': return 'in';
      case 'temperature': return '°F';
      default: return 'lb'; // weight
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onCancel}></div>

      {/* Card */}
      <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        
        <div className="bg-cream border-b border-subtle p-6 flex justify-between items-start">
          <div className="text-center w-full">
            <h2 className="text-2xl font-serif font-bold text-charcoal">
              {mode === 'edit' ? 'Edit Activity' : 'Just to be sure...'}
            </h2>
            <p className="text-charcoal/60 text-sm mt-1">
              {mode === 'edit' ? 'Make changes below' : 'Is this what you wanted to log?'}
            </p>
          </div>
          {mode === 'edit' && onDelete && (
            <button 
              onClick={onDelete}
              className="absolute top-6 right-6 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
              title="Delete Event"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto no-scrollbar">
          
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-charcoal/50 uppercase mb-1">Activity</label>
            <select
              value={editedData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full bg-subtle text-charcoal font-bold rounded-xl p-4 border-none focus:ring-2 focus:ring-rust/50 text-base"
            >
              {Object.values(EventType).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Time Inputs */}
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-charcoal/50 uppercase mb-1">
                  {editedData.type === EventType.SLEEP ? 'Start Time' : 'Time'}
                </label>
                <input
                  type="datetime-local"
                  value={toLocalInputString(editedData.startTime)}
                  onChange={(e) => handleDateChange('startTime', e.target.value)}
                  className="w-full bg-subtle text-charcoal font-sans rounded-xl p-4 border-none focus:ring-2 focus:ring-rust/50 text-base"
                />
             </div>
             
             {/* Show End Time only for Sleep */}
             {editedData.type === EventType.SLEEP && (
               <div>
                  <label className="block text-xs font-bold text-charcoal/50 uppercase mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputString(editedData.endTime)}
                    onChange={(e) => handleDateChange('endTime', e.target.value)}
                    className="w-full bg-subtle text-charcoal font-sans rounded-xl p-4 border-none focus:ring-2 focus:ring-rust/50 text-base"
                  />
                  {/* Clear Button for End Time */}
                  {editedData.endTime && (
                    <button 
                      onClick={() => handleChange('endTime', null)} 
                      className="text-xs text-rust font-bold mt-2 hover:underline"
                    >
                      Clear (Still Sleeping)
                    </button>
                  )}
               </div>
             )}
          </div>

          {/* Dynamic Details */}
          <div className="bg-cream p-5 rounded-2xl border border-subtle">
            <h3 className="text-xs font-bold text-rust uppercase mb-3">Details</h3>
            
            {editedData.type === EventType.FEED && (
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] text-charcoal/50 font-bold uppercase">Type</label>
                    <div className="flex bg-white rounded-xl p-1 border border-subtle mt-1">
                       {['bottle', 'breast', 'solid'].map(m => (
                          <button
                            key={m}
                            onClick={() => handleDetailsChange('method', m)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-colors ${editedData.details?.method === m ? 'bg-rust text-white shadow-sm' : 'text-charcoal/60 hover:bg-subtle'}`}
                          >
                            {m}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <div className="flex-1">
                       <label className="text-[10px] text-charcoal/50 font-bold uppercase">
                          {editedData.details?.method === 'solid' ? 'Amount / Item' : 'Amount (ml)'}
                       </label>
                       {editedData.details?.method === 'solid' ? (
                          <input 
                            type="text" 
                            placeholder="e.g. 1 bowl"
                            className="w-full bg-white p-3 rounded-xl border border-subtle mt-1 text-base"
                            value={editedData.details?.item || ''}
                            onChange={(e) => handleDetailsChange('item', e.target.value)}
                         />
                       ) : (
                          <input 
                             type="number" 
                             className="w-full bg-white p-3 rounded-xl border border-subtle mt-1 text-base"
                             value={editedData.details?.amountml || ''}
                             onChange={(e) => handleDetailsChange('amountml', Number(e.target.value))}
                          />
                       )}
                    </div>
                    
                    {/* Only show Side for breast/bottle, hide for solids */}
                    {editedData.details?.method !== 'solid' && (
                      <div className="flex-1">
                          <label className="text-[10px] text-charcoal/50 font-bold uppercase">Side</label>
                          <select 
                            className="w-full bg-white p-3 rounded-xl border border-subtle mt-1 text-base"
                            value={editedData.details?.side || ''}
                            onChange={(e) => handleDetailsChange('side', e.target.value)}
                          >
                              <option value="">Select</option>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                              <option value="both">Both</option>
                          </select>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {editedData.type === EventType.DIAPER && (
              <div>
                 <label className="text-[10px] text-charcoal/50 font-bold uppercase">Status</label>
                 <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                       onClick={() => handleDetailsChange('status', 'wet')}
                       className={`p-3 rounded-xl border text-base font-bold transition-all ${editedData.details?.status === 'wet' ? 'bg-sand text-charcoal border-sand' : 'bg-white border-subtle text-charcoal/60'}`}
                    >
                       Wet 💧
                    </button>
                    <button
                       onClick={() => handleDetailsChange('status', 'dirty')}
                       className={`p-3 rounded-xl border text-base font-bold transition-all ${editedData.details?.status === 'dirty' ? 'bg-charcoal text-white border-charcoal' : 'bg-white border-subtle text-charcoal/60'}`}
                    >
                       Dirty 💩
                    </button>
                 </div>
              </div>
            )}

            {editedData.type === EventType.MEASUREMENT && (
               <div className="flex flex-col gap-4">
                 <div className="w-full">
                    <label className="text-[10px] text-charcoal/50 font-bold uppercase">Type</label>
                     <select 
                       className="w-full bg-white p-3 rounded-xl border border-subtle mt-1 text-base"
                       value={editedData.details?.type || 'weight'}
                       onChange={(e) => {
                          const newType = e.target.value;
                          const newUnit = getUnitForType(newType);
                          
                          setEditedData(prev => ({
                            ...prev,
                            details: {
                              ...prev.details,
                              type: newType,
                              unit: newUnit
                            }
                          }));
                       }}
                     >
                        <option value="weight">Weight</option>
                        <option value="height">Height</option>
                        <option value="temperature">Temperature</option>
                     </select>
                 </div>
                 <div className="w-full">
                    <label className="text-[10px] text-charcoal/50 font-bold uppercase">Value</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                         type="number" 
                         step="0.1"
                         className="flex-1 bg-white p-3 rounded-xl border border-subtle text-base"
                         value={editedData.details?.value || ''}
                         onChange={(e) => {
                             setEditedData(prev => ({
                                ...prev,
                                details: { 
                                  ...prev.details, 
                                  value: Number(e.target.value),
                                  // Ensure unit is stamped when value changes
                                  unit: getUnitForType(prev.details?.type || 'weight')
                                }
                             }));
                         }}
                      />
                      <span className="text-sm font-bold text-charcoal/60 bg-subtle px-4 py-3 rounded-xl min-w-[3.5rem] text-center">
                        {getUnitForType(editedData.details?.type || 'weight')}
                      </span>
                    </div>
                 </div>
               </div>
            )}
            
            <div className="mt-4">
               <label className="text-[10px] text-charcoal/50 font-bold uppercase">Note</label>
               <input 
                 type="text" 
                 placeholder="Add a note..."
                 className="w-full bg-white p-3 rounded-xl border border-subtle mt-1 text-base placeholder-charcoal/30"
                 value={editedData.notes || ''}
                 onChange={(e) => handleChange('notes', e.target.value)}
               />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-subtle flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-base font-bold text-charcoal bg-subtle rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(editedData)}
            className="flex-1 py-4 text-base font-bold text-white bg-rust rounded-xl shadow-lg shadow-rust/30 hover:bg-rust/90 transition-colors"
          >
            {mode === 'edit' ? 'Update' : 'Save It'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventConfirmation;
