
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

// Helper to format time difference
const formatTimeSince = (dateStr: string | undefined | null) => {
  if (!dateStr) return null;
  const now = new Date().getTime();
  const past = new Date(dateStr).getTime();
  const diffInMins = Math.floor((now - past) / 60000);

  if (diffInMins < 0) return 'Just now';
  
  const hours = Math.floor(diffInMins / 60);
  const mins = diffInMins % 60;
  
  if (hours === 0) return `${mins}min ago`;
  return `${hours}h ${mins}m ago`;
};

// Helper for duration (e.g. Sleeping for...)
const formatDurationSimple = (startDateStr: string) => {
  const now = new Date().getTime();
  const start = new Date(startDateStr).getTime();
  const diffInMins = Math.floor((now - start) / 60000);
  
  const hours = Math.floor(diffInMins / 60);
  const mins = diffInMins % 60;
  
  if (hours === 0) return `${mins}min`;
  return `${hours}h ${mins}m`;
}

// Custom Card for richer data
const RichStatCard = ({ 
  label, 
  icon, 
  colorClass, 
  bgClass, 
  isActive, 
  onClick,
  children 
}: any) => (
  <button 
    onClick={onClick}
    className={`
      w-full text-left p-5 rounded-3xl flex flex-col justify-between shadow-sm transition-all duration-200 min-h-[140px]
      ${bgClass}
      ${isActive ? 'ring-4 ring-offset-2 ring-charcoal scale-[1.02] shadow-md' : 'hover:shadow-md hover:scale-[1.01]'}
    `}
  >
    <div className="flex justify-between items-start w-full mb-3">
       <span className={`text-sm font-bold uppercase tracking-wider ${colorClass} opacity-80`}>{label}</span>
       <div className={`p-2 rounded-full bg-white/40 ${colorClass}`}>
          {icon}
       </div>
    </div>
    
    <div className={`w-full ${colorClass}`}>
      {children}
    </div>
  </button>
);

const Dashboard: React.FC<DashboardProps> = ({ events, selectedDate, activeFilter, onFilterSelect }) => {
  
  // 1. Calculate Daily Stats (Filtered by Selected Date)
  const stats = useMemo(() => {
    const targetDateStr = selectedDate.toDateString();
    const dayEvents = events.filter(e => new Date(e.startTime).toDateString() === targetDateStr);

    let milkVol = 0;
    let milkCount = 0;
    let solidCount = 0;
    
    let sleepMinutes = 0;
    let sleepCount = 0;
    
    let wetCount = 0;
    let dirtyCount = 0;
    
    let wellnessCount = 0;
    let hasSymptom = false;

    dayEvents.forEach(e => {
      // FEEDS
      if (e.type === EventType.FEED) {
         const method = e.details?.method;
         if (method === 'solid') {
           solidCount++;
         } else {
           milkCount++;
           if (e.details?.amountml) milkVol += e.details.amountml;
         }
      } 
      // DIAPERS
      else if (e.type === EventType.DIAPER) {
         if (e.details?.status === 'dirty' || e.details?.status === 'mixed') {
           dirtyCount++;
         } else {
           wetCount++;
         }
      } 
      // SLEEP
      else if (e.type === EventType.SLEEP) {
         sleepCount++; 
         if (e.endTime) {
            const start = new Date(e.startTime).getTime();
            const end = new Date(e.endTime).getTime();
            sleepMinutes += (end - start) / 60000;
         }
      } 
      // WELLNESS
      else {
        wellnessCount++;
        if (e.type === EventType.SYMPTOM) hasSymptom = true;
      }
    });

    const sleepHours = Math.floor(sleepMinutes / 60);
    const sleepMinsRemain = Math.round(sleepMinutes % 60);

    return {
      milk: { count: milkCount, volume: milkVol },
      solids: { count: solidCount },
      sleep: { count: sleepCount, total: `${sleepHours}h ${sleepMinsRemain}m` },
      diaper: { wet: wetCount, dirty: dirtyCount },
      wellness: { count: wellnessCount, isAlert: hasSymptom }
    };
  }, [events, selectedDate]);

  // 2. Calculate Recency Stats (Based on ALL history, regardless of selected date)
  const recency = useMemo(() => {
    // Events are already sorted DESC in App.tsx/StorageService
    const lastFeed = events.find(e => e.type === EventType.FEED);
    
    const lastSleep = events.find(e => e.type === EventType.SLEEP);
    const isSleeping = lastSleep && !lastSleep.endTime;
    
    const lastWet = events.find(e => e.type === EventType.DIAPER && e.details?.status === 'wet');
    const lastDirty = events.find(e => e.type === EventType.DIAPER && (e.details?.status === 'dirty' || e.details?.status === 'mixed'));

    return {
      feedTime: lastFeed ? formatTimeSince(lastFeed.startTime) : null,
      sleepStatus: isSleeping ? 'Sleeping' : 'Awake',
      sleepTime: isSleeping 
        ? formatDurationSimple(lastSleep!.startTime) // Duration of current sleep
        : (lastSleep?.endTime ? formatTimeSince(lastSleep.endTime) : null), // Time since woke up
      wetTime: lastWet ? formatTimeSince(lastWet.startTime) : null,
      dirtyTime: lastDirty ? formatTimeSince(lastDirty.startTime) : null
    };
  }, [events]);

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
      <RichStatCard 
        label="Nutrition" 
        icon={<FeedIcon className="w-6 h-6" />} 
        colorClass="text-rust" 
        bgClass="bg-[#FDECE8]"
        isActive={activeFilter === 'feed'}
        onClick={() => handleToggle('feed')}
      >
        <div className="flex flex-col gap-1">
           <div className="mt-1">
              <span className="text-4xl font-bold">{stats.milk.count}</span>
              <span className="text-base ml-2 opacity-70 font-bold">feeds</span>
           </div>
           
           {/* Recency Line */}
           <div className="text-xs font-bold opacity-70 mt-2 flex items-center gap-1">
             <span>Last:</span>
             <span>{recency.feedTime || '--'}</span>
           </div>

           {stats.solids.count > 0 && (
             <div className="text-xs font-bold border-t border-rust/20 pt-2 mt-2 flex justify-between">
               <span>Solids</span>
               <span>{stats.solids.count} meals</span>
             </div>
           )}
        </div>
      </RichStatCard>
      
      {/* Sleep Card */}
      <RichStatCard 
        label="Sleep" 
        icon={<MoonIcon className="w-6 h-6" />} 
        colorClass="text-sage" 
        bgClass="bg-[#E6F4F1]"
        isActive={activeFilter === 'sleep'}
        onClick={() => handleToggle('sleep')}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-bold tracking-tight">{stats.sleep.total}</span>
           </div>
           
           <div className="text-sm opacity-70 font-bold mb-1">
             {stats.sleep.count} {stats.sleep.count === 1 ? 'nap' : 'naps'} recorded
           </div>

           {/* Recency / Status Line */}
           <div className="border-t border-sage/20 pt-2 mt-auto">
             <div className="flex justify-between items-center">
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${recency.sleepStatus === 'Sleeping' ? 'bg-sage text-white' : 'bg-sage/10 text-sage'}`}>
                  {recency.sleepStatus}
                </span>
                <span className="text-xs font-bold opacity-80">
                  {recency.sleepStatus === 'Sleeping' ? 'for ' : ''}{recency.sleepTime || '--'}
                </span>
             </div>
           </div>
        </div>
      </RichStatCard>

      {/* Diaper Card */}
      <RichStatCard 
        label="Diapers" 
        icon={<DiaperIcon className="w-6 h-6" />} 
        colorClass="text-sand"
        bgClass="bg-[#FFF8E1]"
        isActive={activeFilter === 'diaper'}
        onClick={() => handleToggle('diaper')}
      >
        <div className="flex justify-between h-full pt-1">
           {/* Wet Column */}
           <div className="flex flex-col items-center flex-1 border-r border-sand/20 pr-1">
              <span className="text-3xl font-bold">{stats.diaper.wet}</span>
              <span className="text-xs uppercase font-bold opacity-60 mb-1">Wet</span>
              <div className="mt-auto pt-2 w-full text-center border-t border-sand/10">
                 <span className="block text-xs font-bold opacity-80 whitespace-nowrap">{recency.wetTime || '--'}</span>
              </div>
           </div>
           
           {/* Dirty Column */}
           <div className="flex flex-col items-center flex-1 pl-1">
              <span className="text-3xl font-bold">{stats.diaper.dirty}</span>
              <span className="text-xs uppercase font-bold opacity-60 mb-1">Dirty</span>
              <div className="mt-auto pt-2 w-full text-center border-t border-sand/10">
                 <span className="block text-xs font-bold opacity-80 whitespace-nowrap">{recency.dirtyTime || '--'}</span>
              </div>
           </div>
        </div>
      </RichStatCard>

      {/* Wellness & Notes Card */}
      <RichStatCard 
        label={stats.wellness.isAlert ? "Health Alert" : "Wellness"} 
        icon={stats.wellness.isAlert ? <HeartIcon className="w-6 h-6" /> : <PencilIcon className="w-6 h-6" />} 
        colorClass={stats.wellness.isAlert ? "text-rose-600" : "text-slate-600"}
        bgClass={stats.wellness.isAlert ? "bg-rose-50" : "bg-slate-100"}
        isActive={activeFilter === 'wellness'}
        onClick={() => handleToggle('wellness')} 
      >
        <div className="mt-1">
          <span className="text-4xl font-bold">{stats.wellness.count}</span>
          <span className="text-base ml-2 opacity-70 font-bold">Logs</span>
        </div>
        <div className="mt-2 text-xs opacity-60 font-bold line-clamp-1">
          {stats.wellness.isAlert ? 'Monitor symptoms' : 'Measurements & Notes'}
        </div>
      </RichStatCard>
    </div>
  );
};

export default Dashboard;
