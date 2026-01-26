
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
    
    // For Health Log: 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. Metrics Containers
    const initialMetric = { 
      bottleCount: 0,
      bottleVol: 0, 
      breastCount: 0,
      solidCount: 0, 
      sleepDur: 0, 
      sleepCount: 0, 
      wet: 0, 
      dirty: 0 
    };

    const metrics = {
      today: { ...initialMetric },
      yesterday: { ...initialMetric },
      weekTotal: { ...initialMetric },
      healthLog: [] as BabyEvent[]
    };

    // 3. Iterate & Aggregate
    // Events are typically sorted desc (newest first) from props
    const sorted = [...events].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    sorted.forEach(e => {
      const eDate = new Date(e.startTime);
      eDate.setHours(0,0,0,0);
      const isToday = eDate.getTime() === today.getTime();
      const isYesterday = eDate.getTime() === yesterday.getTime();
      const isThisWeek = eDate.getTime() >= weekStart.getTime() && eDate.getTime() <= today.getTime();
      const isLast30Days = new Date(e.startTime).getTime() >= thirtyDaysAgo.getTime();

      const updateMetric = (target: typeof initialMetric) => {
        // Routine Aggregations
        if (e.type === EventType.FEED) {
          const method = e.details?.method;
          
          if (method === 'solid') {
            target.solidCount++;
          } else if (method === 'breast') {
            target.breastCount++;
          } else {
            // Assume bottle if not solid or breast (or if specifically bottle)
            target.bottleCount++;
            if (e.details?.amountml) {
              target.bottleVol += e.details.amountml;
            }
          }
        } else if (e.type === EventType.DIAPER) {
          const isDirty = e.details?.status === 'dirty' || e.details?.status === 'mixed';
          isDirty ? target.dirty++ : target.wet++;
        } else if (e.type === EventType.SLEEP) {
          // Count
          target.sleepCount++;

          // Duration
          if (e.endTime) {
            const start = new Date(e.startTime).getTime();
            const end = new Date(e.endTime).getTime();
            const mins = Math.round((end - start) / 60000);
            target.sleepDur += mins;
          }
        }
      };

      if (isToday) updateMetric(metrics.today);
      if (isYesterday) updateMetric(metrics.yesterday);
      if (isThisWeek) updateMetric(metrics.weekTotal);

      // Gather Health Log Data (Symptoms & Temps)
      if (isLast30Days) {
         if (e.type === EventType.SYMPTOM) {
           metrics.healthLog.push(e);
         }
         // Include High Temp or just general temp checks? Let's include all temps for context
         if (e.type === EventType.MEASUREMENT && (e.details as any).type === 'temperature') {
           metrics.healthLog.push(e);
         }
      }
    });

    return {
      metrics,
      averages: {
        bottleCount: Math.round(metrics.weekTotal.bottleCount / 7),
        bottleVol: Math.round(metrics.weekTotal.bottleVol / 7),
        breastCount: Math.round(metrics.weekTotal.breastCount / 7),
        solidCount: Math.round(metrics.weekTotal.solidCount / 7 * 10) / 10,
        sleepDur: metrics.weekTotal.sleepDur / 7,
        sleepCount: Math.round(metrics.weekTotal.sleepCount / 7),
        wet: Math.round(metrics.weekTotal.wet / 7),
        dirty: Math.round(metrics.weekTotal.dirty / 7),
      }
    };
  }, [events, selectedDate]);

  const { metrics, averages } = reportData;

  const RowItem = ({ label, today, yesterday, avg, unit = '', isHeader = false, subValueToday, subValueYest, subValueAvg }: any) => (
    <div className={`grid grid-cols-4 gap-4 py-3 items-center ${!isHeader ? 'border-b border-subtle last:border-0 hover:bg-subtle/30 transition-colors' : 'pb-2 border-b-2 border-subtle'}`}>
      
      {/* Label Column */}
      <div className={`${isHeader ? 'text-xs uppercase tracking-wider text-charcoal/50 font-bold' : 'font-bold text-charcoal text-sm'}`}>
        {label}
      </div>

      {/* Today Column */}
      <div className={`text-center md:text-left ${isHeader ? 'text-xs uppercase tracking-wider text-charcoal/50 font-bold' : 'font-bold text-charcoal'}`}>
        {today}<span className="text-xs font-normal text-charcoal/50 ml-1">{unit}</span>
        {subValueToday && <span className="text-xs text-charcoal/50 ml-1 font-normal bg-subtle px-1 rounded">{subValueToday}</span>}
      </div>

      {/* Yesterday Column */}
      <div className={`text-center md:text-left hidden md:block ${isHeader ? 'text-xs uppercase tracking-wider text-charcoal/50 font-bold' : 'text-charcoal/70 text-sm'}`}>
        {yesterday}<span className="text-xs text-charcoal/40 ml-1">{unit}</span>
        {subValueYest && <span className="text-[10px] text-charcoal/40 ml-1 bg-subtle px-1 rounded">{subValueYest}</span>}
      </div>

      {/* Avg Column */}
      <div className={`text-center md:text-left ${isHeader ? 'text-xs uppercase tracking-wider text-charcoal/50 font-bold' : 'text-charcoal/70 text-sm'}`}>
        {avg}<span className="text-xs text-charcoal/40 ml-1">{unit}</span>
        {subValueAvg && <span className="text-[10px] text-charcoal/40 ml-1 bg-subtle px-1 rounded">{subValueAvg}</span>}
      </div>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mt-6 mb-2 flex items-center gap-2">
      <div className="h-[1px] bg-rust/20 flex-1"></div>
      <span className="text-xs font-bold text-rust uppercase tracking-widest">{title}</span>
      <div className="h-[1px] bg-rust/20 flex-1"></div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
      
      {/* Main Consolidation Table */}
      <div className="lg:col-span-8 bg-surface rounded-3xl shadow-sm border border-subtle p-8 flex flex-col">
        <div className="mb-6">
            <h3 className="font-bold text-2xl text-charcoal">Daily Report</h3>
        </div>
        
        {/* Table Headers */}
        <RowItem 
          label="Metric" 
          today="Today" 
          yesterday="Yesterday" 
          avg="7-Day Avg" 
          isHeader={true}
        />

        {/* FEED SECTION */}
        <SectionHeader title="Nutrition" />
        
        {/* Bottle Milk: Shows Count (Volume ml) */}
        <RowItem 
          label="Bottle Milk" 
          today={metrics.today.bottleCount} 
          subValueToday={metrics.today.bottleVol > 0 ? `${metrics.today.bottleVol}ml` : null}
          yesterday={metrics.yesterday.bottleCount} 
          subValueYest={metrics.yesterday.bottleVol > 0 ? `${metrics.yesterday.bottleVol}ml` : null}
          avg={averages.bottleCount} 
          subValueAvg={averages.bottleVol > 0 ? `${averages.bottleVol}ml` : null}
        />
        
        <RowItem 
          label="Breast Feed" 
          today={metrics.today.breastCount} 
          yesterday={metrics.yesterday.breastCount} 
          avg={averages.breastCount} 
        />
        
        <RowItem 
          label="Solids" 
          today={metrics.today.solidCount} 
          yesterday={metrics.yesterday.solidCount} 
          avg={averages.solidCount} 
        />

        {/* SLEEP SECTION */}
        <SectionHeader title="Sleep" />
        
        <RowItem 
          label="Naps" 
          today={metrics.today.sleepCount} 
          yesterday={metrics.yesterday.sleepCount} 
          avg={averages.sleepCount} 
        />
        <RowItem 
          label="Total Sleep" 
          today={formatDuration(metrics.today.sleepDur)} 
          yesterday={formatDuration(metrics.yesterday.sleepDur)} 
          avg={formatDuration(averages.sleepDur)} 
        />

        {/* DIAPER SECTION */}
        <SectionHeader title="Hygiene" />
        
        <RowItem 
          label="Wet" 
          today={metrics.today.wet} 
          yesterday={metrics.yesterday.wet} 
          avg={averages.wet} 
        />
        <RowItem 
          label="Dirty" 
          today={metrics.today.dirty} 
          yesterday={metrics.yesterday.dirty} 
          avg={averages.dirty} 
        />
        
      </div>

      {/* Health Log Side Panel (Cols 9-12) */}
      <div className="lg:col-span-4 bg-cream/50 rounded-3xl border border-subtle p-6 flex flex-col gap-4 h-fit">
        <h3 className="font-bold text-lg text-charcoal border-b border-subtle pb-3">Health Log (30 Days)</h3>
        
        {metrics.healthLog.length === 0 ? (
          <div className="text-center py-8 text-charcoal/40">
            <span className="block text-2xl mb-2">😊</span>
            <p className="text-sm font-bold">No issues recorded</p>
            <p className="text-xs mt-1">Symptoms and temperature logs will appear here for doctor visits.</p>
          </div>
        ) : (
          <div className="space-y-3">
             {metrics.healthLog.slice(0, 10).map(event => (
               <div key={event.id} className="bg-white p-3 rounded-xl border border-subtle shadow-sm flex flex-col gap-1">
                 <div className="flex justify-between items-start">
                   <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 rounded ${event.type === EventType.SYMPTOM ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
                      {event.type === EventType.SYMPTOM ? 'Symptom' : 'Temp'}
                   </span>
                   <span className="text-[10px] text-charcoal/40 font-bold">
                     {new Date(event.startTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                   </span>
                 </div>
                 
                 <div className="font-bold text-charcoal text-sm mt-1">
                   {event.type === EventType.SYMPTOM 
                      ? (event.details as any).description 
                      : `${(event.details as any).value}${(event.details as any).unit}`}
                 </div>
                 {event.notes && (
                   <div className="text-xs text-charcoal/60 italic">"{event.notes}"</div>
                 )}
               </div>
             ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ConsolidatedReport;
