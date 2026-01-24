
import React, { useState } from 'react';
import { 
  SparklesIcon, 
  MicIcon, 
  CalendarIcon, 
  ChartBarIcon, 
  ListBulletIcon, 
  PencilIcon, 
  XMarkIcon, 
  ArrowRightIcon 
} from './Icons';

interface Step {
  title: string;
  desc: string;
  icon: React.ReactNode;
  image?: React.ReactNode; 
}

interface Props {
  onClose: () => void;
  userName?: string;
}

const TutorialOverlay: React.FC<Props> = ({ onClose, userName }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      title: "Welcome to BabyLog!",
      desc: `Hi${userName ? ' ' + userName : ''}! I'm your AI-powered baby care assistant. Let's watch your baby grow together by making tracking effortless.`,
      icon: <SparklesIcon className="w-12 h-12 text-rust" />
    },
    {
      title: "Just Say It",
      desc: "Tap the microphone and speak naturally. Try saying: 'Leo drank 4oz of milk' or 'He slept from 2pm to 4pm'. I'll handle the rest.",
      icon: <MicIcon className="w-12 h-12 text-rust" />
    },
    {
      title: "You Are In Control",
      desc: "I'll try my best to understand, but if I get it wrong, don't worry! You can manually edit the details before saving, or tap any event later to fix it.",
      icon: <PencilIcon className="w-12 h-12 text-sage" />
    },
    {
      title: "Daily Dashboard",
      desc: "At the top of your screen, you'll see quick daily totals for feeds, sleep, and diapers so you always know where you stand today.",
      icon: <ChartBarIcon className="w-12 h-12 text-sand" />
    },
    {
      title: "Your Views",
      desc: "Switch tabs to visualize your day:\n• Timeline: A simple list of events.\n• Schedule: A 24-hour visual calendar.\n• Analysis: 7-day trends and averages.",
      icon: (
        <div className="flex gap-2">
          <ListBulletIcon className="w-8 h-8 text-charcoal/70" />
          <CalendarIcon className="w-8 h-8 text-charcoal/70" />
          <ChartBarIcon className="w-8 h-8 text-charcoal/70" />
        </div>
      )
    }
  ];

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Card */}
      <div className="relative bg-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col min-h-[400px]">
        
        {/* Header Image / Icon Area */}
        <div className="bg-cream h-40 flex items-center justify-center border-b border-subtle relative">
           {/* Close Button */}
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 p-2 bg-white/50 rounded-full hover:bg-white text-charcoal/40 hover:text-charcoal transition-colors"
           >
             <XMarkIcon className="w-5 h-5" />
           </button>
           
           <div className="p-4 bg-white rounded-full shadow-sm ring-4 ring-subtle">
              {currentStep.icon}
           </div>
        </div>

        {/* Content Area */}
        <div className="p-8 flex-1 flex flex-col text-center">
          <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">
            {currentStep.title}
          </h2>
          <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">
            {currentStep.desc}
          </p>
        </div>

        {/* Footer / Navigation */}
        <div className="p-6 border-t border-subtle bg-white flex items-center justify-between">
          
          {/* Dots Indicator */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${i === stepIndex ? 'bg-rust w-4' : 'bg-subtle'}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-charcoal text-white rounded-xl font-bold hover:bg-rust transition-colors shadow-lg hover:shadow-xl"
          >
            {isLastStep ? "Let's Go!" : "Next"}
            {!isLastStep && <ArrowRightIcon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};

export default TutorialOverlay;
