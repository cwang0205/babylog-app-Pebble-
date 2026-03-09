import { EventType, BabyEvent } from '../types';
import { StorageService } from '../services/storageService';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRandomTime = (date: Date, hourMin: number, hourMax: number) => {
  const newDate = new Date(date);
  newDate.setHours(randomInt(hourMin, hourMax));
  newDate.setMinutes(randomInt(0, 59));
  return newDate.toISOString();
};

export const generateSeedData = async (babyId: string, userEmail: string) => {
  const today = new Date();
  const eventsToCreate: Omit<BabyEvent, 'id'>[] = [];

  for (let i = 0; i < 14; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);

    // 1. Feeds (8-10 per day)
    for (let f = 0; f < randomInt(8, 10); f++) {
      const isBottle = Math.random() > 0.5;
      eventsToCreate.push({
        babyId,
        type: EventType.FEED,
        startTime: generateRandomTime(currentDate, 0, 23),
        details: isBottle 
          ? { method: 'bottle', amountml: randomInt(60, 150) }
          : { method: 'breast', side: Math.random() > 0.5 ? 'left' : 'right' },
        createdAt: new Date().toISOString(),
        createdByEmail: userEmail
      });
    }

    // 2. Diapers (8-10 per day)
    for (let d = 0; d < randomInt(8, 10); d++) {
      const rand = Math.random();
      let status = 'wet';
      if (rand > 0.8) status = 'dirty';
      else if (rand > 0.6) status = 'mixed';

      eventsToCreate.push({
        babyId,
        type: EventType.DIAPER,
        startTime: generateRandomTime(currentDate, 0, 23),
        details: { status },
        createdAt: new Date().toISOString(),
        createdByEmail: userEmail
      });
    }

    // 3. Sleep (4-6 per day)
    for (let s = 0; s < randomInt(4, 6); s++) {
      const start = new Date(generateRandomTime(currentDate, 0, 23));
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + randomInt(30, 180)); // 30 mins to 3 hours

      eventsToCreate.push({
        babyId,
        type: EventType.SLEEP,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        details: {},
        createdAt: new Date().toISOString(),
        createdByEmail: userEmail
      });
    }

    // 4. Measurements (1 per week)
    if (i % 7 === 0) {
      eventsToCreate.push({
        babyId,
        type: EventType.MEASUREMENT,
        startTime: generateRandomTime(currentDate, 8, 12),
        details: { type: 'weight', value: 4.5 + (14 - i) * 0.05, unit: 'kg' },
        createdAt: new Date().toISOString(),
        createdByEmail: userEmail
      });
    }
  }

  // Save all events sequentially to avoid overwhelming Firestore
  let count = 0;
  for (const event of eventsToCreate) {
    await StorageService.addEvent(event);
    count++;
  }
  
  return count;
};
