import React, { useMemo } from 'react';
import { BabyEvent, EventType } from '../types';

interface ReportProps {
  events: BabyEvent[];
  selectedDate: Date;
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
};

const ConsolidatedReport: React.FC<ReportProps> = ({ events, selectedDate }) => {
  const reportData = useMemo(() => {
    // 1. Setup Time Ranges
    const today = new Date(selectedDate);
    today.setHours(0,0,0,0);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6); // 7 days including today

    // 2. Metrics Containers
    const metrics = {
      today: { feed: 0, sleep: 0, diaper: 0 },
      yesterday: { feed: 0, sleep: 0, diaper: 0 },
      weekTotal: { feed: 0, sleep: 0, diaper: 0 },
      last: {
        weight: null as any,
        height: null as any,
        symptom: null as any,
        note: null as any,
        event: null as any,
      }
    };

    // 3. Iterate & Aggregate
    // Sort events newest first for "Last" checks
    const sorted = [...events].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    if (sorted.length > 0) {
      metrics.last.event = sorted[0];
    }

    sorted.forEach(e => {
      const eDate = new Date(e.startTime);
      eDate.setHours(0,0,0,0);
      const isToday = eDate.getTime() === today.getTime();
      const isYesterday = eDate.getTime() === yesterday.getTime();
      const isThisWeek = eDate.getTime() >= weekStart.getTime() && eDate.getTime() <= today.getTime();

      // Health Snapshots (First match due to sort is the latest)
      if (!metrics.last.weight && e.type === EventType.MEASUREMENT && (e.details as any).type === 'weight') {
        metrics.last.weight = e;
      }
      if (!metrics.last.height && e.type === EventType.MEASUREMENT && (e.details as any).type === 'height') {
        metrics.last.height = e;
      }
      if (!metrics.last.symptom && e.type === EventType.SYMPTOM) {
        metrics.last.symptom = e;
      }
      if (!metrics.last.note && e.type === EventType.NOTE) {
        metrics.last.note = e;
      }

      // Routine Aggregations
      if (e.type === EventType.FEED) {
        if (isToday) metrics.today.feed++;
        if (isYesterday) metrics.yesterday.feed++;
        if (isThisWeek) metrics.weekTotal.feed++;
      } else if (e.type === EventType.DIAPER) {
        if (isToday) metrics.today.diaper++;
        if (isYesterday) metrics.yesterday.diaper++;
        if (isThisWeek) metrics.weekTotal.diaper++;
      } else if (e.type === EventType.SLEEP && e.endTime) {
        const start = new Date(e.startTime).getTime();
        const end = new Date(e.endTime).getTime();
        // Round to nearest minute to be robust against dirty data
        const mins = Math.round((end - start) / 60000);
        
        if (isToday) metrics.today.sleep += mins;
        if (isYesterday) metrics.yesterday.sleep += mins;
        if (isThisWeek) metrics.weekTotal.sleep += mins;
      }
    });

    return {
      metrics,
      averages: {
        feed: Math.round(metrics.weekTotal.feed / 7),
        sleep: metrics.weekTotal.sleep / 7,
        diaper: Math.round(metrics.weekTotal.diaper / 7),
      }
    };
  }, [events, selectedDate]);

  const { metrics, averages } = reportData;

  const RowItem = ({ label, today, yesterday, total, avg, unit = '' }: any) => (
    <div className="grid grid-cols-4 gap-2 py-4 border-b border-subtle last:border-0 items-center">
      <div className="font-bold text-charcoal">{label}</div>
      <div className="text-center md:text-left text-rust font-bold text-lg">{today}<span className="text-xs font-normal text-charcoal/50 ml-1">{unit}</span></div>
      <div className="text-center md:text-left hidden md:block text-charcoal/70">{yesterday}<span className="text-xs text-charcoal/40 ml-1">{unit}</span></div>
      <div className="text-center md:text-left text-charcoal/70">{avg}<span className="text-xs text-charcoal/40 ml-1">{unit}</span></div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
      
      {/* Main Consolidation Table (Cols 1-8) */}
      <div className="lg:col-span-8 bg-surface rounded-2xl shadow-sm border border-subtle p-6 flex flex-col">
        <div className="mb-4">
            <h3 className="font-serif font-bold text-xl text-charcoal">Daily Report</h3>
            <p className="text-xs text-charcoal/50">Comparison based on selected date</p>
        </div>
        
        {/* Table Headers */}
        <div className="grid grid-cols-4 gap-2 pb-2 border-b-2 border-subtle text-xs font-bold uppercase tracking-wider text-charcoal/50">
          <div>Metric</div>
          <div>Today</div>
          <div className="hidden md:block">Yesterday</div>
          <div>7-Day Avg</div>
        </div>

        {/* Rows */}
        <RowItem 
          label="Feeds" 
          today={metrics.today.feed} 
          yesterday={metrics.yesterday.feed} 
          avg={averages.feed} 
        />
        <RowItem 
          label="Sleep" 
          today={formatDuration(metrics.today.sleep)} 
          yesterday={formatDuration(metrics.yesterday.sleep)} 
          avg={formatDuration(averages.sleep)} 
        />
        <RowItem 
          label="Diapers" 
          today={metrics.today.diaper} 
          yesterday={metrics.yesterday.diaper} 
          avg={averages.diaper} 
        />
        
        <div className="mt-4 pt-4 border-t border-subtle flex justify-between items-center text-xs text-charcoal/40">
           <span>Weekly Total Feeds: {metrics.weekTotal.feed}</span>
           <span>Weekly Sleep: {formatDuration(metrics.weekTotal.sleep)}</span>
        </div>
      </div>

      {/* Latest / Health Side Panel (Cols 9-12) */}
      <div className="lg:col-span-4 bg-cream/50 rounded-2xl border border-subtle p-6 flex flex-col gap-4">
        <h3 className="font-serif font-bold text-lg text-charcoal">Latest Updates</h3>
        
        {/* Last Event */}
        <div className="bg-white p-3 rounded-xl border border-subtle shadow-sm">
           <div className="text-[10px] uppercase font-bold text-charcoal/40 mb-1">Last Activity</div>
           <div className="font-bold text-charcoal capitalize">
             {metrics.last.event ? metrics.last.event.type : 'None'}
           </div>
           <div className="text-xs text-charcoal/60">
             {metrics.last.event ? new Date(metrics.last.event.startTime).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) : '--'}
           </div>
        </div>

        {/* Health / Measurement Snapshot */}
        <div className="bg-white p-3 rounded-xl border border-subtle shadow-sm">
           <div className="text-[10px] uppercase font-bold text-sky-500 mb-2 border-b border-subtle pb-1">Latest Growth</div>
           
           <div className="grid grid-cols-2 gap-2">
             <div>
               <div className="text-[10px] text-charcoal/50 uppercase font-bold">Weight</div>
               <div className="font-bold text-charcoal">
                 {metrics.last.weight ? `${(metrics.last.weight.details as any).value} ${(metrics.last.weight.details as any).unit}` : '--'}
               </div>
               {metrics.last.weight && <div className="text-[10px] text-charcoal/40">{new Date(metrics.last.weight.startTime).toLocaleDateString()}</div>}
             </div>
             
             <div>
               <div className="text-[10px] text-charcoal/50 uppercase font-bold">Height</div>
               <div className="font-bold text-charcoal">
                 {metrics.last.height ? `${(metrics.last.height.details as any).value} ${(metrics.last.height.details as any).unit}` : '--'}
               </div>
               {metrics.last.height && <div className="text-[10px] text-charcoal/40">{new Date(metrics.last.height.startTime).toLocaleDateString()}</div>}
             </div>
           </div>
        </div>

        {/* Symptoms Alert */}
        <div className={`p-3 rounded-xl border shadow-sm ${metrics.last.symptom ? 'bg-rose-50 border-rose-100' : 'bg-white border-subtle'}`}>
           <div className={`text-[10px] uppercase font-bold mb-1 ${metrics.last.symptom ? 'text-rose-500' : 'text-charcoal/40'}`}>Recent Symptom</div>
           <div className="font-bold text-charcoal">
             {metrics.last.symptom ? (metrics.last.symptom.details as any).description : 'No symptoms'}
           </div>
           {metrics.last.symptom && (
             <div className="text-xs text-charcoal/60 mt-1">
                {new Date(metrics.last.symptom.startTime).toLocaleDateString()}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ConsolidatedReport;