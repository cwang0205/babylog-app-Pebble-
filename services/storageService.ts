
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { BabyProfile, BabyEvent, EventType } from '../types';

// COLLECTION NAMES
const BABIES_COLLECTION = 'babies';
const EVENTS_COLLECTION = 'events';

export const StorageService = {
  
  // --- BABY PROFILES (CLOUD + SHARING) ---

  /**
   * Subscribes to all babies where the current user's email is in the 'allowedEmails' list.
   */
  subscribeToBabies: (userEmail: string, onUpdate: (babies: BabyProfile[]) => void, onError: (error: Error) => void) => {
    const babiesRef = collection(db, BABIES_COLLECTION);
    const q = query(babiesRef, where("allowedEmails", "array-contains", userEmail));
    
    return onSnapshot(q, (querySnapshot) => {
      const babies: BabyProfile[] = [];
      querySnapshot.forEach((doc) => {
        babies.push({ id: doc.id, ...doc.data() } as BabyProfile);
      });
      onUpdate(babies);
    }, (error) => {
      console.error("Error subscribing to babies:", error);
      onError(error);
    });
  },

  /**
   * Fetches all babies where the current user's email is in the 'allowedEmails' list.
   * This covers both babies they own and babies shared with them.
   */
  getBabies: async (userEmail: string): Promise<BabyProfile[]> => {
    try {
      const babiesRef = collection(db, BABIES_COLLECTION);
      // Query: Give me babies where 'allowedEmails' array contains my email
      const q = query(babiesRef, where("allowedEmails", "array-contains", userEmail));
      
      const querySnapshot = await getDocs(q);
      const babies: BabyProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        babies.push({ id: doc.id, ...doc.data() } as BabyProfile);
      });
      
      return babies;
    } catch (e) {
      console.error("Error fetching babies from Firestore:", e);
      throw e;
    }
  },

  /**
   * Creates a new baby profile in the cloud.
   * Automatically adds the creator's email to allowedEmails.
   */
  saveBaby: async (userId: string, userEmail: string, baby: Omit<BabyProfile, 'id' | 'ownerId' | 'allowedEmails'>): Promise<BabyProfile> => {
    try {
      const newBabyData = {
        ...baby,
        ownerId: userId,
        allowedEmails: [userEmail] // Initialize access list with creator
      };

      const docRef = await addDoc(collection(db, BABIES_COLLECTION), newBabyData);
      
      return {
        id: docRef.id,
        ...newBabyData
      };
    } catch (e) {
      console.error("Error saving baby to Firestore:", e);
      throw e;
    }
  },

  /**
   * Updates the checked milestones for a baby.
   */
  updateBabyMilestones: async (babyId: string, milestones: Record<string, boolean>): Promise<void> => {
    try {
      const babyRef = doc(db, BABIES_COLLECTION, babyId);
      await updateDoc(babyRef, {
        milestones
      });
    } catch (e) {
      console.error("Error updating milestones:", e);
      throw e;
    }
  },

  /**
   * Shares a baby profile with another user by email.
   */
  shareBaby: async (babyId: string, emailToInvite: string): Promise<void> => {
    try {
      const babyRef = doc(db, BABIES_COLLECTION, babyId);
      await updateDoc(babyRef, {
        allowedEmails: arrayUnion(emailToInvite)
      });
    } catch (e) {
      console.error("Error sharing baby:", e);
      throw e;
    }
  },

  /**
   * Revokes access for a user.
   */
  unshareBaby: async (babyId: string, emailToRemove: string): Promise<void> => {
    try {
      const babyRef = doc(db, BABIES_COLLECTION, babyId);
      await updateDoc(babyRef, {
        allowedEmails: arrayRemove(emailToRemove)
      });
    } catch (e) {
      console.error("Error unsharing baby:", e);
      throw e;
    }
  },

  // --- EVENTS (CLOUD) ---

  subscribeToEvents: (
    babyId: string, 
    startDate: Date,
    endDate: Date,
    onUpdate: (events: BabyEvent[]) => void, 
    onError: (error: Error) => void
  ) => {
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const q = query(
      eventsRef, 
      where("babyId", "==", babyId),
      where("startTime", ">=", startDate.toISOString()),
      where("startTime", "<=", endDate.toISOString())
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const events: BabyEvent[] = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as BabyEvent);
      });
      // Sort in memory
      onUpdate(events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    }, (error) => {
      console.error("Error subscribing to events:", error);
      onError(error);
    });
  },

  subscribeToHealthEvents: (
    babyId: string,
    startDate: Date,
    onUpdate: (events: BabyEvent[]) => void,
    onError: (error: Error) => void
  ) => {
    const eventsRef = collection(db, EVENTS_COLLECTION);
    const q = query(
      eventsRef,
      where("babyId", "==", babyId),
      where("type", "in", [EventType.SYMPTOM, EventType.MEASUREMENT]),
      where("startTime", ">=", startDate.toISOString())
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const events: BabyEvent[] = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as BabyEvent);
      });
      // Sort in memory
      onUpdate(events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    }, (error) => {
      console.error("Error subscribing to health events:", error);
      onError(error);
    });
  },

  getEvents: async (babyId: string): Promise<BabyEvent[]> => {
    try {
      const eventsRef = collection(db, EVENTS_COLLECTION);
      // Simple query: all events for this babyId
      const q = query(eventsRef, where("babyId", "==", babyId));
      
      const querySnapshot = await getDocs(q);
      const events: BabyEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as BabyEvent);
      });
      
      // Sort in memory (or add compound index in Firestore for orderBy)
      return events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    } catch (e) {
      console.error("Error fetching events from Firestore:", e);
      throw e;
    }
  },

  addEvent: async (event: Omit<BabyEvent, 'id'>): Promise<BabyEvent> => {
    try {
      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), event);
      return {
        id: docRef.id,
        ...event
      };
    } catch (e) {
      console.error("Error adding event to Firestore:", e);
      throw e;
    }
  },

  updateEvent: async (event: BabyEvent): Promise<void> => {
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, event.id);
      const { id, ...data } = event; // Don't save ID inside the doc data if unnecessary
      await updateDoc(eventRef, data);
    } catch (e) {
      console.error("Error updating event in Firestore:", e);
      throw e;
    }
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    } catch (e) {
      console.error("Error deleting event from Firestore:", e);
    }
  }
};
