import { doc, getDoc, setDoc, increment, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { RepositoryStatus } from './types';

export interface AnalyticsData {
  visitors: number;
  planetVisits: Record<string, number>;
  resumeDownloads: number;
  contactClicks: number;
  averageSessionTime: number; // in seconds
  sessionDurations: number[]; // stored to compute average
  lastSyncTime: string;
}

const COLLECTION_NAME = 'analytics';
const DOC_ID = 'dashboard';

const defaultMockAnalytics: AnalyticsData = {
  visitors: 342,
  planetVisits: {
    core: 245,
    education: 189,
    skills: 210,
    experience: 198,
    achievements: 154,
    contact: 120
  },
  resumeDownloads: 84,
  contactClicks: 52,
  averageSessionTime: 145, // seconds
  sessionDurations: [120, 180, 90, 200, 145, 140],
  lastSyncTime: new Date().toLocaleTimeString()
};

// Try local storage for offline memory
function getLocalFallback(): AnalyticsData {
  if (typeof window === 'undefined') return defaultMockAnalytics;
  const stored = localStorage.getItem('careerverse_analytics');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return defaultMockAnalytics;
}

function saveLocalFallback(data: AnalyticsData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('careerverse_analytics', JSON.stringify(data));
}

export async function getAnalytics(): Promise<RepositoryStatus<AnalyticsData>> {
  if (!isFirebaseConfigured || !db) {
    return {
      data: getLocalFallback(),
      source: 'mock',
      success: true
    };
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const mapped = {
        visitors: data.visitors ?? 0,
        planetVisits: data.planetVisits ?? {},
        resumeDownloads: data.resumeDownloads ?? 0,
        contactClicks: data.contactClicks ?? 0,
        averageSessionTime: data.averageSessionTime ?? 0,
        sessionDurations: data.sessionDurations ?? [],
        lastSyncTime: data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()
      };
      saveLocalFallback(mapped);
      return {
        data: mapped,
        source: 'firebase',
        success: true
      };
    } else {
      // Create default
      await setDoc(docRef, {
        visitors: defaultMockAnalytics.visitors,
        planetVisits: defaultMockAnalytics.planetVisits,
        resumeDownloads: defaultMockAnalytics.resumeDownloads,
        contactClicks: defaultMockAnalytics.contactClicks,
        averageSessionTime: defaultMockAnalytics.averageSessionTime,
        sessionDurations: defaultMockAnalytics.sessionDurations,
        updatedAt: serverTimestamp()
      });
      return {
        data: defaultMockAnalytics,
        source: 'firebase',
        success: true
      };
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
}

export async function recordVisitor(): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const local = getLocalFallback();
    local.visitors += 1;
    saveLocalFallback(local);
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, {
      visitors: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Error recording visitor:", err);
    throw err;
  }
}

export async function recordPlanetVisit(planet: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const local = getLocalFallback();
    local.planetVisits[planet] = (local.planetVisits[planet] || 0) + 1;
    saveLocalFallback(local);
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, {
      [`planetVisits.${planet}`]: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Error recording planet visit:", err);
    throw err;
  }
}

export async function recordResumeDownload(): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const local = getLocalFallback();
    local.resumeDownloads += 1;
    saveLocalFallback(local);
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, {
      resumeDownloads: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Error recording resume download:", err);
    throw err;
  }
}

export async function recordContactClick(): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const local = getLocalFallback();
    local.contactClicks += 1;
    saveLocalFallback(local);
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, {
      contactClicks: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Error recording contact click:", err);
    throw err;
  }
}

export async function recordSessionDuration(seconds: number): Promise<void> {
  if (seconds <= 0) return;
  if (!isFirebaseConfigured || !db) {
    const local = getLocalFallback();
    local.sessionDurations.push(seconds);
    const sum = local.sessionDurations.reduce((a, b) => a + b, 0);
    local.averageSessionTime = Math.round(sum / local.sessionDurations.length);
    saveLocalFallback(local);
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, DOC_ID);
    const snap = await getDoc(docRef);
    let updated: number[] = [];
    if (snap.exists()) {
      const currentDurations = snap.data().sessionDurations ?? [];
      updated = [...currentDurations, seconds].slice(-50);
    } else {
      updated = [seconds];
    }
    const average = Math.round(updated.reduce((a, b) => a + b, 0) / updated.length);
    await setDoc(docRef, {
      sessionDurations: updated,
      averageSessionTime: average,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Error recording session duration:", err);
    throw err;
  }
}

export function subscribeAnalytics(callback: (status: RepositoryStatus<AnalyticsData>) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    callback({
      data: getLocalFallback(),
      source: 'mock',
      success: true
    });
    return () => {};
  }
  const docRef = doc(db!, COLLECTION_NAME, DOC_ID);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        data: {
          visitors: data.visitors ?? 0,
          planetVisits: data.planetVisits ?? {},
          resumeDownloads: data.resumeDownloads ?? 0,
          contactClicks: data.contactClicks ?? 0,
          averageSessionTime: data.averageSessionTime ?? 0,
          sessionDurations: data.sessionDurations ?? [],
          lastSyncTime: data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleTimeString() : new Date().toLocaleTimeString()
        },
        source: 'firebase',
        success: true
      });
    } else {
      callback({
        data: defaultMockAnalytics,
        source: 'firebase',
        success: true
      });
    }
  }, (err) => {
    console.error("Analytics subscription error:", err);
    callback({
      data: getLocalFallback(),
      source: 'firebase',
      success: false,
      error: err
    });
  });
}
