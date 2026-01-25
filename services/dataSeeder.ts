
import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { EventType } from '../types';

export const DataSeeder = {
  async seedEvents(babyId: string, userEmail: string) {
    const batch = writeBatch(db);
    const eventsRef = collection(db, 'events');
    const today = new Date();
    const DAYS_TO_SEED = 14; 
    
    // Helper to add variance to times ( +/- 15 mins)
    const fuzzyTime = (baseDate: Date, minutesOffset: number) => {
      const d = new Date(baseDate);
      const variance = Math.floor(Math.random() * 30) - 15; 
      d.setMinutes(d.getMinutes() + minutesOffset + variance);
      return d;
    };

    let totalEvents = 0;

    for (let i = 0; i < DAYS_TO_SEED; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0); // Start of that day

      // --- 1. SLEEP SCHEDULE (4 naps + night) ---
      // Night sleep (carried over from previous day roughly, but for simple visualization we start at midnight)
      const wakesUp = fuzzyTime(date, 6 * 60 + 30); // ~6:30 AM
      
      const nap1Start = fuzzyTime(date, 9 * 60);
      const nap1End = fuzzyTime(nap1Start, 90); // 1.5hr

      const nap2Start = fuzzyTime(date, 13 * 60);
      const nap2End = fuzzyTime(nap2Start, 90); // 1.5hr

      const nap3Start = fuzzyTime(date, 17 * 60);
      const nap3End = fuzzyTime(nap3Start, 45); // 45min

      const bedTime = fuzzyTime(date, 20 * 60); // 8 PM
      // For the sake of the calendar view, we won't span across midnight to avoid complexity in this simple seeder,
      // instead we'll just log "Sleeping" until 11:59PM or leave open ended? 
      // Let's make it a closed event ending at 11:59PM for visualization safety.
      const bedTimeEnd = new Date(date);
      bedTimeEnd.setHours(23, 59, 0, 0);

      const sleeps = [
        { start: nap1Start, end: nap1End },
        { start: nap2Start, end: nap2End },
        { start: nap3Start, end: nap3End },
        { start: bedTime, end: bedTimeEnd } // Night start
      ];

      sleeps.forEach(s => {
        const ref = doc(eventsRef);
        batch.set(ref, {
          babyId,
          type: EventType.SLEEP,
          startTime: s.start.toISOString(),
          endTime: s.end.toISOString(),
          details: {},
          notes: Math.random() > 0.8 ? "Fussed a bit" : null,
          createdAt: new Date().toISOString(),
          createdByEmail: userEmail
        });
        totalEvents++;
      });

      // --- 2. FEEDS (Every ~3 hours) ---
      const feedTimes = [
        fuzzyTime(date, 7 * 60),  // 7:00 AM
        fuzzyTime(date, 10 * 60), // 10:00 AM
        fuzzyTime(date, 13 * 60), // 1:00 PM
        fuzzyTime(date, 16 * 60), // 4:00 PM
        fuzzyTime(date, 19 * 60), // 7:00 PM
        fuzzyTime(date, 23 * 60)  // 11:00 PM (Dream feed)
      ];

      feedTimes.forEach(t => {
        const ref = doc(eventsRef);
        const isBottle = Math.random() > 0.3;
        batch.set(ref, {
          babyId,
          type: EventType.FEED,
          startTime: t.toISOString(),
          endTime: null,
          details: {
            method: isBottle ? 'bottle' : 'breast',
            amountml: isBottle ? 120 + (Math.floor(Math.random() * 4) * 10) : null,
            side: !isBottle ? (Math.random() > 0.5 ? 'left' : 'right') : null
          },
          createdAt: new Date().toISOString(),
          createdByEmail: userEmail
        });
        totalEvents++;
      });

      // --- 3. DIAPERS (Scattered) ---
      const diaperTimes = [
        fuzzyTime(date, 7 * 60 + 15),
        fuzzyTime(date, 10 * 60 + 15),
        fuzzyTime(date, 13 * 60 + 15),
        fuzzyTime(date, 16 * 60 + 15),
        fuzzyTime(date, 19 * 60 + 15),
        fuzzyTime(date, 22 * 60)
      ];

      diaperTimes.forEach(t => {
        const ref = doc(eventsRef);
        const status = Math.random() > 0.6 ? 'wet' : (Math.random() > 0.5 ? 'dirty' : 'mixed');
        batch.set(ref, {
          babyId,
          type: EventType.DIAPER,
          startTime: t.toISOString(),
          endTime: null,
          details: { status },
          createdAt: new Date().toISOString(),
          createdByEmail: userEmail
        });
        totalEvents++;
      });

      // --- 4. MEASUREMENTS (Once a week) ---
      if (i % 7 === 0) {
         const weightRef = doc(eventsRef);
         batch.set(weightRef, {
           babyId,
           type: EventType.MEASUREMENT,
           startTime: fuzzyTime(date, 9 * 60).toISOString(),
           endTime: null,
           details: { type: 'weight', value: 4.5 + (0.1 * (DAYS_TO_SEED - i)), unit: 'kg' }, // Gaining weight
           createdAt: new Date().toISOString(),
           createdByEmail: userEmail
         });
         totalEvents++;
      }
    }

    console.log(`Seeding ${totalEvents} events...`);
    await batch.commit();
  }
};
