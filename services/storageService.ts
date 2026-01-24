import { BabyProfile, BabyEvent } from '../types';

// STORAGE KEYS
// We will namespace data by user ID or baby ID to keep organization clean.
// Pattern: 'babylog:babies:{userId}'
// Pattern: 'babylog:events:{babyId}'

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const StorageService = {
  
  // --- BABY PROFILES ---

  getBabies: async (userId: string): Promise<BabyProfile[]> => {
    try {
      const key = `babylog:babies:${userId}`;
      const json = localStorage.getItem(key);
      if (!json) return [];
      return JSON.parse(json) as BabyProfile[];
    } catch (e) {
      console.error("Error fetching babies from local storage:", e);
      return [];
    }
  },

  saveBaby: async (userId: string, baby: Omit<BabyProfile, 'id'>): Promise<BabyProfile> => {
    try {
      const key = `babylog:babies:${userId}`;
      const existingJson = localStorage.getItem(key);
      const babies: BabyProfile[] = existingJson ? JSON.parse(existingJson) : [];
      
      const newBaby: BabyProfile = {
        id: generateId(),
        ...baby
      };
      
      babies.push(newBaby);
      localStorage.setItem(key, JSON.stringify(babies));
      
      return newBaby;
    } catch (e) {
      console.error("Error saving baby to local storage:", e);
      throw e;
    }
  },

  // --- EVENTS ---

  getEvents: async (babyId: string): Promise<BabyEvent[]> => {
    try {
      const key = `babylog:events:${babyId}`;
      const json = localStorage.getItem(key);
      const events: BabyEvent[] = json ? JSON.parse(json) : [];
      
      // Sort by start time descending (newest first)
      return events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    } catch (e) {
      console.error("Error fetching events from local storage:", e);
      return [];
    }
  },

  addEvent: async (event: Omit<BabyEvent, 'id'>): Promise<BabyEvent> => {
    try {
      const key = `babylog:events:${event.babyId}`;
      const existingJson = localStorage.getItem(key);
      const events: BabyEvent[] = existingJson ? JSON.parse(existingJson) : [];
      
      const newEvent: BabyEvent = {
        id: generateId(),
        ...event
      };
      
      events.push(newEvent);
      localStorage.setItem(key, JSON.stringify(events));
      
      return newEvent;
    } catch (e) {
      console.error("Error adding event to local storage:", e);
      throw e;
    }
  },

  updateEvent: async (event: BabyEvent): Promise<void> => {
    try {
      const key = `babylog:events:${event.babyId}`;
      const existingJson = localStorage.getItem(key);
      if (!existingJson) return;

      let events: BabyEvent[] = JSON.parse(existingJson);
      const index = events.findIndex(e => e.id === event.id);
      
      if (index !== -1) {
        events[index] = event;
        localStorage.setItem(key, JSON.stringify(events));
      }
    } catch (e) {
      console.error("Error updating event in local storage:", e);
    }
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    // Note: This function requires finding which baby list the event belongs to.
    // In a real local-first app with this structure, passing the babyId is preferred.
    // However, to maintain the interface, we will iterate keys or assuming the caller knows.
    // For simplicity in this specific "Simpler Version" request, we will search all event keys.
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('babylog:events:')) {
          const json = localStorage.getItem(key);
          let events: BabyEvent[] = json ? JSON.parse(json) : [];
          
          const initialLength = events.length;
          events = events.filter(e => e.id !== eventId);
          
          if (events.length !== initialLength) {
             localStorage.setItem(key, JSON.stringify(events));
             return; // Found and deleted
          }
        }
      }
    } catch (e) {
      console.error("Error deleting event from local storage:", e);
    }
  },

  // --- DEMO DATA (Optional) ---
  initializeDemoData: () => {
     // No-op
  }
};