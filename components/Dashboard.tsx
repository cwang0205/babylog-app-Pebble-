
import React, { useMemo } from 'react';
import { BabyEvent, EventType } from '../types';
import { FeedIcon, MoonIcon, DiaperIcon, HeartIcon, PencilIcon } from './Icons';

export type FilterCategory = 'feed' | 'sleep' | 'diaper' | 'wellness' | null;

interface DashboardProps {
  events: BabyEvent[];
  selectedDate: Date;
  activeFilter: FilterCategory;
  onFilterSelect: (filter: FilterCategory) => void;
}

const StatCard = ({ label, value, subtext, icon, colorClass, bgClass, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`
      w-full text-left p-5 rounded-2xl flex items-start justify-between shadow-sm transition-all duration-200
      ${bgClass}
      ${isActive ? 'ring-2 ring-offset-2 ring-charcoal scale-[1.02] shadow-md' : 'hover:shadow-md hover:scale-[1.01]'}
    `}
  >
    <div>
      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${colorClass} opacity-80`}>{label}</p>
      <h3 className={`text-2xl font-serif font-bold ${colorClass}`}>{value}</h3>
      <p className={`text-xs mt-1 ${colorClass} opacity-70`}>{subtext}</p>
    </div>
    <div className={`p-2 rounded-full bg-white/40 ${colorClass}`}>
      {icon}
    </div>
  </button>
);

const Dashboard: React.FC<DashboardProps> = ({ events, selectedDate, activeFilter, onFilterSelect }) => {
  const stats = useMemo(() => {
    // Filter for the selected date
    const targetDateStr = selectedDate.toDateString();
    const dayEvents = events.filter(e => new Date(e.startTime).toDateString() === targetDateStr);

    let feedCount = 0;
    let sleepMinutes = 0;
    let diaperCount = 0;
    let wellnessCount = 0;
    let hasSymptom = false;

    dayEvents.forEach(e => {
      if (e.type === EventType.FEED) feedCount++;
      else if (e.type === EventType.DIAPER) diaperCount++;
      else if (e.type === EventType.SLEEP && e.endTime) {
         const start = new Date(e.startTime).getTime();
         const end = new Date(e.endTime).getTime();
         sleepMinutes += (end - start) / 60000;
      } else {
        // Count everything else (Notes, Symptom, Measure, Movement) as Wellness
        wellnessCount++;
        if (e.type === EventType.SYMPTOM) hasSymptom = true;
      }
    });

    const sleepHours = Math.floor(sleepMinutes / 60);
    const sleepMinsRemain = Math.round(sleepMinutes % 60);

    return {
      feed: { value: feedCount, sub: 'Times today' },
      sleep: { value: `${sleepHours}h ${sleepMinsRemain}m`, sub: 'Total rest' },
      diaper: { value: diaperCount, sub: 'Changes' },
      wellness: { 
        value: wellnessCount, 
        sub: hasSymptom ? 'Alerts today' : 'Logs today',
        isAlert: hasSymptom
      }
    };
  }, [events, selectedDate]);

  const handleToggle = (type: FilterCategory) => {
    if (activeFilter === type) {
      onFilterSelect(null);
    } else {
      onFilterSelect(type);
    }
  };

  return (
    <div id="tutorial-dashboard" className="grid grid-cols-2 gap-4">
      {/* Feed Card */}
      <StatCard 
        label="Feeding" 
        value={stats.feed.value} 
        subtext={stats.feed.sub} 
        icon={<FeedIcon className="w-5 h-5" />} 
        colorClass="text-rust" 
        bgClass="bg-[#FDECE8]"
        isActive={activeFilter === 'feed'}
        onClick={() => handleToggle('feed')}
      />
      
      {/* Sleep Card */}
      <StatCard 
        label="Sleep" 
        value={stats.sleep.value} 
        subtext={stats.sleep.sub} 
        icon={<MoonIcon className="w-5 h-5" />} 
        colorClass="text-sage" 
        bgClass="bg-[#E6F4F1]"
        isActive={activeFilter === 'sleep'}
        onClick={() => handleToggle('sleep')}
      />

      {/* Diaper Card */}
      <StatCard 
        label="Diapers" 
        value={stats.diaper.value} 
        subtext={stats.diaper.sub} 
        icon={<DiaperIcon className="w-5 h-5" />} 
        colorClass="text-sand"
        bgClass="bg-[#FFF8E1]"
        isActive={activeFilter === 'diaper'}
        onClick={() => handleToggle('diaper')}
      />

      {/* Wellness & Notes Card */}
      <StatCard 
        label={stats.wellness.isAlert ? "Health Alert" : "Wellness"} 
        value={stats.wellness.value} 
        subtext={stats.wellness.sub} 
        icon={stats.wellness.isAlert ? <HeartIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />} 
        colorClass={stats.wellness.isAlert ? "text-rose-600" : "text-slate-600"}
        bgClass={stats.wellness.isAlert ? "bg-slate-100" : "bg-slate-100"}
        isActive={activeFilter === 'wellness'}
        onClick={() => handleToggle('wellness')} 
      />
    </div>
  );
};

export default Dashboard;
