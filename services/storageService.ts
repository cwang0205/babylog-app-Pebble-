import { BabyProfile, BabyEvent, EventType, Gender } from '../types';

const KEYS = {
  BABIES: 'babylog_babies',
  EVENTS: 'babylog_events',
  CURRENT_BABY: 'babylog_current_baby_id'
};

export const StorageService = {
  getBabies: (): BabyProfile[] => {
    try {
      const data = localStorage.getItem(KEYS.BABIES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveBaby: (baby: BabyProfile): void => {
    const babies = StorageService.getBabies();
    const existingIndex = babies.findIndex(b => b.id === baby.id);
    if (existingIndex >= 0) {
      babies[existingIndex] = baby;
    } else {
      babies.push(baby);
    }
    localStorage.setItem(KEYS.BABIES, JSON.stringify(babies));
  },

  getCurrentBabyId: (): string | null => {
    return localStorage.getItem(KEYS.CURRENT_BABY);
  },

  setCurrentBabyId: (id: string): void => {
    localStorage.setItem(KEYS.CURRENT_BABY, id);
  },

  getEvents: (babyId: string): BabyEvent[] => {
    try {
      const allEvents: BabyEvent[] = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
      return allEvents.filter(e => e.babyId === babyId).sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    } catch (e) {
      return [];
    }
  },

  addEvent: (event: BabyEvent): void => {
    const allEvents: BabyEvent[] = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
    allEvents.push(event);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(allEvents));
  },

  deleteEvent: (eventId: string): void => {
    const allEvents: BabyEvent[] = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
    const filtered = allEvents.filter(e => e.id !== eventId);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(filtered));
  },

  // --- DEMO DATA GENERATOR ---
  initializeDemoData: (): void => {
    if (localStorage.getItem(KEYS.BABIES)) return; // Only seed if empty

    const baby1Id = crypto.randomUUID();
    const baby2Id = crypto.randomUUID();

    // Helper to create date relative to now
    const getDate = (daysAgo: number, hour: number, minute: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    };
    
    // Set Birth Dates relative to now
    const birthDate1 = new Date();
    birthDate1.setMonth(birthDate1.getMonth() - 2); // 2 Months old
    
    const birthDate2 = new Date();
    birthDate2.setMonth(birthDate2.getMonth() - 6); // 6 Months old

    const babies: BabyProfile[] = [
      { id: baby1Id, name: 'Guai', gender: Gender.BOY, birthDate: birthDate1.toISOString() },
      { id: baby2Id, name: 'Zhuzhu', gender: Gender.GIRL, birthDate: birthDate2.toISOString() }
    ];

    const events: BabyEvent[] = [];

    // Generate 7 days of history for Guai (Baby 1)
    for (let i = 0; i <= 7; i++) {
      // 1. Routine: Morning Feed (07:00)
      events.push({
        id: crypto.randomUUID(),
        babyId: baby1Id,
        type: EventType.FEED,
        startTime: getDate(i, 7, 15),
        details: { method: 'bottle', amountml: 150 },
        createdAt: new Date().toISOString()
      });

      // 2. Routine: Morning Nap (09:00 - 10:30)
      events.push({
        id: crypto.randomUUID(),
        babyId: baby1Id,
        type: EventType.SLEEP,
        startTime: getDate(i, 9, 0),
        endTime: getDate(i, 10, 30),
        details: {},
        createdAt: new Date().toISOString()
      });

      // 3. Routine: Lunch Feed (11:00)
      events.push({
        id: crypto.randomUUID(),
        babyId: baby1Id,
        type: EventType.FEED,
        startTime: getDate(i, 11, 0),
        details: { method: 'bottle', amountml: 140 },
        createdAt: new Date().toISOString()
      });

      // 4. Routine: Afternoon Diaper (13:00)
      events.push({
        id: crypto.randomUUID(),
        babyId: baby1Id,
        type: EventType.DIAPER,
        startTime: getDate(i, 13, 0),
        details: { status: i % 2 === 0 ? 'dirty' : 'wet' },
        createdAt: new Date().toISOString()
      });

      // 5. Routine: Afternoon Nap (13:30 - 15:00)
      events.push({
        id: crypto.randomUUID(),
        babyId: baby1Id,
        type: EventType.SLEEP,
        startTime: getDate(i, 13, 30),
        endTime: getDate(i, 15, 0),
        details: {},
        createdAt: new Date().toISOString()
      });
      
       // 6. Routine: Evening Feed (18:00)
      events.push({
        id: crypto.randomUUID(),
        babyId: baby1Id,
        type: EventType.FEED,
        startTime: getDate(i, 18, 0),
        details: { method: 'bottle', amountml: 160 },
        createdAt: new Date().toISOString()
      });

      // 7. Routine: Bedtime (20:00)
      events.push({
        id: crypto.randomUUID(),
        babyId: baby1Id,
        type: EventType.SLEEP,
        startTime: getDate(i, 20, 0),
        endTime: getDate(i, 23, 59), // Just primarily for visual, realistically would span days
        details: {},
        createdAt: new Date().toISOString()
      });
    }

    // Special Events for Guai
    // Symptom: Cough yesterday
    events.push({
      id: crypto.randomUUID(),
      babyId: baby1Id,
      type: EventType.SYMPTOM,
      startTime: getDate(1, 14, 30),
      details: { description: 'Dry cough during nap' },
      createdAt: new Date().toISOString()
    });

    // Measurement: Weight 3 days ago
    events.push({
      id: crypto.randomUUID(),
      babyId: baby1Id,
      type: EventType.MEASUREMENT,
      startTime: getDate(3, 9, 0),
      details: { type: 'weight', value: 6.8, unit: 'kg' },
      createdAt: new Date().toISOString()
    });
    
    // Measurement: Height 3 days ago
    events.push({
      id: crypto.randomUUID(),
      babyId: baby1Id,
      type: EventType.MEASUREMENT,
      startTime: getDate(3, 9, 5),
      details: { type: 'height', value: 62, unit: 'cm' },
      createdAt: new Date().toISOString()
    });

    // Note: Today
    events.push({
      id: crypto.randomUUID(),
      babyId: baby1Id,
      type: EventType.NOTE,
      startTime: getDate(0, 16, 0),
      details: {},
      notes: "Guai was very happy playing with the rattle today!",
      createdAt: new Date().toISOString()
    });

    // Generate sparse data for Zhuzhu (Baby 2)
    for (let i = 0; i <= 3; i++) {
       events.push({
        id: crypto.randomUUID(),
        babyId: baby2Id,
        type: EventType.FEED,
        startTime: getDate(i, 8, 30),
        details: { method: 'breast', side: 'left', amountml: 0 },
        createdAt: new Date().toISOString()
      });
      events.push({
        id: crypto.randomUUID(),
        babyId: baby2Id,
        type: EventType.DIAPER,
        startTime: getDate(i, 10, 0),
        details: { status: 'wet' },
        createdAt: new Date().toISOString()
      });
    }

    localStorage.setItem(KEYS.BABIES, JSON.stringify(babies));
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
    localStorage.setItem(KEYS.CURRENT_BABY, baby1Id);
  }
};