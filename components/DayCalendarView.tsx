import React, { useMemo, useEffect, useRef } from 'react';
import { BabyEvent, EventType } from '../types';
import { FeedIcon, MoonIcon, DiaperIcon, HeartIcon, BoltIcon, RulerIcon, PencilIcon } from './Icons';
import { FilterCategory } from './Dashboard';

interface Props {
  events: BabyEvent[];
  selectedDate: Date;
  filterCategory: FilterCategory;
}

// Helper to determine styling based on event type
const getEventStyle = (type: EventType) => {
  switch (type) {
    case EventType.FEED: 
      return { bg: 'bg-rust', text: 'text-white', icon: <FeedIcon className="w-4 h-4 text-white/80" /> };
    case EventType.SLEEP: 
      return { bg: 'bg-sage', text: 'text-white', icon: <MoonIcon className="w-4 h-4 text-white/80" /> };
    case EventType.DIAPER: 
      return { bg: 'bg-sand', text: 'text-charcoal', icon: <DiaperIcon className="w-4 h-4 text-charcoal/80" /> };
    case EventType.SYMPTOM: 
      return { bg: 'bg-rose-400', text: 'text-white', icon: <HeartIcon className="w-4 h-4 text-white/80" /> };
    case EventType.MOVEMENT: 
      return { bg: 'bg-orange-400', text: 'text-white', icon: <BoltIcon className="w-4 h-4 text-white/80" /> };
    case EventType.MEASUREMENT: 
      return { bg: 'bg-sky-500', text: 'text-white', icon: <RulerIcon className="w-4 h-4 text-white/80" /> };
    case EventType.NOTE: 
      return { bg: 'bg-slate-400', text: 'text-white', icon: <PencilIcon className="w-4 h-4 text-white/80" /> };
    default: 
      return { bg: 'bg-charcoal', text: 'text-white', icon: null };
  }
};

const DayCalendarView: React.FC<Props> = ({ events, selectedDate, filterCategory }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 1. Filter for the Selected Date AND Category
  const dayEvents = useMemo(() => {
    const targetStr = selectedDate.toDateString();
    return events.filter(e => {
       if (new Date(e.startTime).toDateString() !== targetStr) return false;
       
       // Category Check
       if (!filterCategory) return true;
       if (filterCategory === 'feed') return e.type === EventType.FEED;
       if (filterCategory === 'sleep') return e.type === EventType.SLEEP;
       if (filterCategory === 'diaper') return e.type === EventType.DIAPER;
       if (filterCategory === 'wellness') {
         return [EventType.SYMPTOM, EventType.MEASUREMENT, EventType.MOVEMENT, EventType.NOTE].includes(e.type);
       }
       return true;
    });
  }, [events, selectedDate, filterCategory]);

  // Check if selected date is "Today" for rendering the "Now" line
  const isToday = useMemo(() => {
    return selectedDate.toDateString() === new Date().toDateString();
  }, [selectedDate]);

  // 2. Constants for rendering
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const PIXELS_PER_MINUTE = 2; // Height of the calendar
  const GRID_HEIGHT = 24 * 60 * PIXELS_PER_MINUTE;

  // 3. Scroll to 8AM or first event on mount/date change
  useEffect(() => {
    if (scrollRef.current) {
      // Default to 8 AM if no events, or the first event's time
      let scrollMins = 8 * 60;
      if (dayEvents.length > 0) {
        // Sort temp for finding earliest/latest if needed, though usually calendar logic handles it
        // Just picking the last item in the list if sorted desc in storage, or first if unordered
        const first = new Date(dayEvents[dayEvents.length - 1].startTime); 
        const mins = first.getHours() * 60 + first.getMinutes();
        scrollMins = mins;
      }
      
      const scrollPos = Math.max(0, (scrollMins * PIXELS_PER_MINUTE) - 100);
      scrollRef.current.scrollTop = scrollPos;
    }
  }, [selectedDate, filterCategory]); // Also re-scroll when filter changes

  // Helper to safely get label text
  const getEventLabel = (event: BabyEvent) => {
    if (event.notes) return event.notes;
    const details = event.details as any;
    if (details) {
      if (typeof details.amountml !== 'undefined') return `${details.amountml}ml`;
      if (details.value && details.unit) return `${details.value}${details.unit}`;
      if (details.description) return details.description;
    }
    return '';
  };

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-subtle h-[600px] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-subtle bg-cream/50 flex justify-between items-center">
        <h3 className="font-serif font-bold text-charcoal">Timeline</h3>
        <span className="text-xs uppercase font-bold text-charcoal/40">
          {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative no-scrollbar bg-white">
        
        {/* The Grid */}
        <div style={{ height: `${GRID_HEIGHT}px` }} className="relative w-full">
          
          {/* Current Time Indicator Line (Only if Today) */}
          {isToday && (
            <div 
               className="absolute w-full border-t-2 border-red-400 z-20 flex items-center pointer-events-none"
               style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * PIXELS_PER_MINUTE}px` }}
            >
              <div className="w-2 h-2 bg-red-400 rounded-full -ml-1"></div>
              <span className="text-[10px] font-bold text-red-400 ml-1 bg-white px-1 rounded">Now</span>
            </div>
          )}

          {/* Hour Markers */}
          {HOURS.map(hour => (
            <div 
              key={hour} 
              className="absolute w-full flex items-start border-t border-subtle"
              style={{ 
                top: `${hour * 60 * PIXELS_PER_MINUTE}px`, 
                height: `${60 * PIXELS_PER_MINUTE}px` 
              }}
            >
              <div className="w-12 text-right pr-2 text-xs font-bold text-charcoal/30 transform -translate-y-1/2 bg-white/50 backdrop-blur-sm rounded-r-md">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            </div>
          ))}

          {/* Events */}
          {dayEvents.map(event => {
            const startDate = new Date(event.startTime);
            if (isNaN(startDate.getTime())) return null;

            const startMins = startDate.getHours() * 60 + startDate.getMinutes();
            const styles = getEventStyle(event.type);
            
            let durationMins = 30;
            if (event.type === EventType.SLEEP && event.endTime) {
              const end = new Date(event.endTime).getTime();
              const start = startDate.getTime();
              durationMins = Math.max(15, (end - start) / 60000);
            }
            
            if (event.type !== EventType.SLEEP && durationMins > 30) {
               durationMins = 30;
            }

            return (
              <div
                key={event.id}
                className={`absolute left-14 right-4 rounded-xl p-2 shadow-sm border border-white/20 flex flex-col justify-center ${styles.bg} ${styles.text} hover:opacity-90 transition-opacity z-10 overflow-hidden`}
                style={{
                  top: `${startMins * PIXELS_PER_MINUTE}px`,
                  height: `${Math.max(durationMins * PIXELS_PER_MINUTE, 40)}px`
                }}
              >
                <div className="flex items-center gap-2">
                  {styles.icon}
                  <span className="text-xs font-bold uppercase truncate">{event.type}</span>
                  <span className="text-[10px] opacity-80">
                    {startDate.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}).toLowerCase()}
                  </span>
                </div>
                {durationMins > 45 || durationMins * PIXELS_PER_MINUTE >= 40 ? (
                   <p className="text-[10px] opacity-80 pl-6 truncate">
                     {getEventLabel(event)}
                   </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayCalendarView;