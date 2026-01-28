
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ArrowRightIcon, XMarkIcon } from './Icons';

interface Step {
  targetId?: string; // If undefined, show centered modal
  title: string;
  desc: string;
  position?: 'top' | 'bottom'; // Preferred tooltip position
}

interface Props {
  onClose: () => void;
  userName?: string;
}

const TutorialOverlay: React.FC<Props> = ({ onClose, userName }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const steps: Step[] = [
    {
      targetId: undefined, // Start with a center welcome
      title: "Welcome to BabyLog!",
      desc: `Hi${userName ? ' ' + userName : ''}! I'm your AI assistant. Let me show you around your new tracking dashboard.`,
    },
    {
      targetId: 'tutorial-add-baby-btn',
      title: "Growing Family?",
      desc: "Tap this button to create profiles for your other children. You can switch between them instantly.",
      position: 'bottom'
    },
    {
      targetId: 'tutorial-share-btn',
      title: "It Takes a Village",
      desc: "Invite your partner or caregivers by email so everyone stays on the same page.",
      position: 'bottom'
    },
    {
      targetId: 'tutorial-dashboard',
      title: "Daily Snapshots",
      desc: "Here is your quick summary for today. See total sleep, feeds, and diaper changes at a glance.",
      position: 'bottom'
    },
    {
      targetId: 'tutorial-view-tabs',
      title: "Switch Your View",
      desc: "Toggle between a simple Timeline list, a visual 24h Schedule, or deep-dive Analysis charts.",
      position: 'bottom'
    },
    {
      targetId: 'tutorial-voice-btn',
      title: "Just Say It",
      desc: "Tap here and speak naturally. Try saying: 'Leo drank 4oz of milk' or 'Slept from 2 to 4'. I'll do the rest.",
      position: 'top'
    },
    {
      targetId: 'tutorial-quick-actions',
      title: "One-Tap Logging",
      desc: "No need to type. Tap these buttons to instantly log a feed, sleep, or diaper change. You can adjust the time and details in the next step.",
      position: 'top'
    },
    {
      targetId: undefined, // Centered modal for general concept
      title: "You Are In Control",
      desc: "After you speak or tap, a Review Card will appear. You can adjust the time, add notes, or fix any details before confirming the entry.",
    }
  ];

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // Track window size for boundary checks
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate position of the target element
  useLayoutEffect(() => {
    const updateRect = () => {
      if (currentStep.targetId) {
        const el = document.getElementById(currentStep.targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setRect(el.getBoundingClientRect());
        } else {
          setRect(null);
        }
      } else {
        setRect(null);
      }
    };

    updateRect();
    // Small delay to allow scroll to finish before calculating rect
    const timer = setTimeout(updateRect, 500);
    return () => clearTimeout(timer);
  }, [stepIndex, currentStep.targetId, windowSize]);

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const spotlightStyle: React.CSSProperties = rect
    ? {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        position: 'fixed',
        borderRadius: '16px',
        boxShadow: '0 0 0 9999px rgba(38, 70, 83, 0.85)',
        zIndex: 50,
        pointerEvents: 'none',
        transition: 'all 0.4s ease-in-out',
      }
    : { display: 'none' };

  // Smart Positioning Logic
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) {
      // Centered Modal
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 60,
        width: '90%',
        maxWidth: '400px',
      };
    }

    const margin = 16; // Minimum distance from screen edge
    const maxTooltipWidth = 320; 
    const gap = 16; // Distance from target element

    // 1. Determine Actual Width
    // The tooltip will be max 320px OR the full window width minus margins
    const actualWidth = Math.min(maxTooltipWidth, windowSize.w - (margin * 2));

    // 2. Calculate Horizontal Position
    const targetCenter = rect.left + (rect.width / 2);
    let left = targetCenter - (actualWidth / 2);

    // 3. Strict Clamp
    // Ensure left is at least 'margin'
    // Ensure right (left + actualWidth) is at most 'windowWidth - margin'
    const maxLeft = windowSize.w - actualWidth - margin;
    left = Math.max(margin, Math.min(left, maxLeft));

    // 4. Calculate Vertical Position
    let top: number;
    let verticalTransform = 'none';
    
    // Check space available
    const spaceAbove = rect.top;
    const spaceBelow = windowSize.h - rect.bottom;
    
    // Decide preference
    let renderPos = currentStep.position || 'bottom';

    // Auto-flip if tight on space (require at least 250px)
    if (renderPos === 'bottom' && spaceBelow < 250 && spaceAbove > 250) {
      renderPos = 'top';
    } else if (renderPos === 'top' && spaceAbove < 250 && spaceBelow > 250) {
      renderPos = 'bottom';
    }

    if (renderPos === 'top') {
      top = rect.top - gap;
      verticalTransform = 'translateY(-100%)';
    } else {
      top = rect.bottom + gap;
    }

    return {
      position: 'fixed',
      top: top,
      left: left,
      width: `${actualWidth}px`,
      transform: verticalTransform,
      zIndex: 60,
      maxWidth: `calc(100vw - ${margin * 2}px)`
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-charcoal font-sans">
      
      {!rect && <div className="absolute inset-0 bg-charcoal/85 backdrop-blur-sm transition-opacity" />}
      {rect && (
        <div style={spotlightStyle} className="ring-4 ring-rust ring-offset-4 ring-offset-transparent animate-pulse"></div>
      )}

      <div 
        style={getTooltipStyle()} 
        className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-start text-left"
      >
        <div className="flex justify-between items-start w-full mb-3">
           <h3 className="font-bold text-xl text-charcoal">{currentStep.title}</h3>
           <button onClick={onClose} className="text-charcoal/30 hover:text-charcoal p-1">
             <XMarkIcon className="w-5 h-5" />
           </button>
        </div>
        
        <p className="text-charcoal/70 mb-6 text-sm leading-relaxed whitespace-pre-line">
          {currentStep.desc}
        </p>

        <div className="flex justify-between items-center w-full mt-auto">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${i === stepIndex ? 'bg-rust w-4' : 'bg-subtle'}`} 
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2 bg-charcoal text-white rounded-xl font-bold text-sm hover:bg-rust transition-colors shadow-lg"
          >
            {isLastStep ? "Let's Start" : "Next"}
            {!isLastStep && <ArrowRightIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
