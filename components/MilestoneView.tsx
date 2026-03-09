import React, { useState } from 'react';
import { CDC_MILESTONES, getMilestoneForAge, MilestoneData } from '../data/milestones';
import { XIcon } from './Icons';
import { BabyProfile } from '../types';
import { StorageService } from '../services/storageService';

interface Props {
  baby: BabyProfile;
  onClose: () => void;
}

const MilestoneView: React.FC<Props> = ({ baby, onClose }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(baby.milestones || {});
  const [isSaving, setIsSaving] = useState(false);

  // Calculate age in months
  const birthDate = new Date(baby.birthDate);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(diffDays / 30.44); // approximate months
  
  const currentMilestone = getMilestoneForAge(ageInMonths);

  const handleToggle = async (item: string) => {
    const newCheckedState = {
      ...checkedItems,
      [item]: !checkedItems[item]
    };
    
    setCheckedItems(newCheckedState);
    
    // Save to Firebase
    setIsSaving(true);
    try {
      await StorageService.updateBabyMilestones(baby.id, newCheckedState);
    } catch (error) {
      console.error("Failed to save milestone:", error);
      // Revert state on failure
      setCheckedItems(checkedItems);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentMilestone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">No Milestones Found</h2>
          <button onClick={onClose} className="px-6 py-2 bg-charcoal text-white rounded-full font-bold">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-sage/10 border-b border-sage/20 p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-charcoal flex items-center gap-2">
              <span className="text-3xl">👶</span> {baby.name}'s Milestones
            </h2>
            <p className="text-charcoal/60 text-sm mt-1 font-medium">
              What to expect by {currentMilestone.label} (CDC Guidelines)
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/50 hover:bg-white rounded-full text-charcoal/60 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {currentMilestone.categories.map((category, idx) => (
            <div key={idx} className="space-y-4">
              <h3 className="text-lg font-bold text-charcoal border-b border-subtle pb-2">
                {category.title}
              </h3>
              <ul className="space-y-3">
                {category.items.map((item, itemIdx) => {
                  const isChecked = checkedItems[item] || false;
                  return (
                    <li 
                      key={itemIdx} 
                      className="flex items-start gap-3 cursor-pointer group"
                      onClick={() => handleToggle(item)}
                    >
                      <div className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-sage border-sage' : 'border-sage/40 group-hover:border-sage'}`}>
                        {isChecked && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`leading-relaxed text-sm md:text-base transition-colors ${isChecked ? 'text-charcoal/60' : 'text-charcoal/80'}`}>
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-800/70 font-medium text-center">
              These milestones are based on CDC guidelines. Every baby develops at their own pace. If you have concerns, consult your pediatrician.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneView;
