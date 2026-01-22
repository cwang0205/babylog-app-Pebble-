import React, { useMemo } from 'react';
import { BabyEvent, EventType } from '../types';
import { FeedIcon, MoonIcon, DiaperIcon, HeartIcon, BoltIcon, RulerIcon, PencilIcon } from './Icons';
import { FilterCategory } from './Dashboard';

interface EventListProps {
  events: BabyEvent[];
  selectedDate: Date;
  filterCategory: FilterCategory;
}

const getIconForType = (type: EventType) => {
  switch (type) {
    case EventType.FEED: return <FeedIcon className="w-5 h-5 text-rust" />;
    case EventType.SLEEP: return <MoonIcon className="w-5 h-5 text-sage" />;
    case EventType.DIAPER: return <DiaperIcon className="w-5 h-5 text-sand" />;
    case EventType.SYMPTOM: return <HeartIcon className="w-5 h-5 text-rose-500" />;
    case EventType.MOVEMENT: return <BoltIcon className="w-5 h-5 text-orange-500" />;
    case EventType.MEASUREMENT: return <RulerIcon className="w-5 h-5 text-sky-500" />;
    case EventType.NOTE: return <PencilIcon className="w-5 h-5 text-slate-500" />;
    default: return <div className="w-5 h-5 text-charcoal" />;
  }
};

const getBgForType = (type: EventType) => {
  switch (type) {
    case EventType.FEED: return 'bg-rust/10';
    case EventType.SLEEP: return 'bg-sage/10';
    case EventType.DIAPER: return 'bg-sand/10';
    case EventType.SYMPTOM: return 'bg-rose-100';
    case EventType.MOVEMENT: return 'bg-orange-100';
    case EventType.MEASUREMENT: return 'bg-sky-100';
    case EventType.NOTE: return 'bg-slate-100';
    default: return 'bg-subtle';
  }
};

const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
};

const formatDetails = (event: BabyEvent) => {
  const { details } = event;
  if (!details) return null;
  
  switch (event.type) {
    case EventType.FEED:
      return `${details.method || ''} ${details.amountml ? '• ' + details.amountml + 'ml' : ''} ${details.side ? '• ' + details.side : ''}`;
    case EventType.DIAPER:
      return `${details.status} ${details.color ? `• ${details.color}` : ''}`;
    case EventType.SLEEP:
      return event.endTime ? `Slept until ${formatTime(event.endTime)}` : 'Currently sleeping';
    case EventType.MEASUREMENT:
      return `${details.value} ${details.unit}`;
    case EventType.SYMPTOM:
      return details.description || 'Symptom logged';
    case EventType.MOVEMENT:
      return details.description || 'Movement logged';
    default:
      return '';
  }
};

const EventList: React.FC<EventListProps> = ({ events, selectedDate, filterCategory }) => {
  // 1. Sort events by time desc
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [events]);

  // 2. Filter by Selected Date AND Filter Category
  const dayEvents = useMemo(() => {
    const targetStr = selectedDate.toDateString();
    
    return sortedEvents.filter(e => {
      // Date Check
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
  }, [sortedEvents, selectedDate, filterCategory]);

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-charcoal/40 bg-surface rounded-3xl border border-dashed border-subtle">
        <p className="font-serif italic mb-1">
          {filterCategory ? `No ${filterCategory} events` : "Quiet day"}
        </p>
        <p className="text-sm">
          {filterCategory ? "Try selecting a different category." : "No events recorded for this date."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {dayEvents.map((event) => (
        <div key={event.id} className="relative group">
           <div className="group bg-surface p-4 rounded-2xl shadow-sm border border-transparent hover:border-rust/20 hover:shadow-md transition-all flex items-center gap-4 relative z-0">
            
            {/* Icon Box */}
            <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${getBgForType(event.type)}`}>
              {getIconForType(event.type)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-charcoal capitalize truncate pr-2">{event.type}</h3>
                <span className="text-xs font-bold text-charcoal/40 font-mono bg-subtle px-2 py-0.5 rounded-md">
                  {formatTime(event.startTime)}
                </span>
              </div>
              
              <p className="text-charcoal/70 text-sm truncate">{formatDetails(event) || 'Event logged'}</p>
              
              {event.notes && (
                <p className="text-charcoal/50 text-xs mt-1 italic line-clamp-1">"{event.notes}"</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;