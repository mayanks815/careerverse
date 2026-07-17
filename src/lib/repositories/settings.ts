import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockCareerverseData, Settings } from '../mockData';
import { RepositoryStatus } from './types';

const COLLECTION_NAME = 'settings';

function mapSettingsData(id: string, data: any): Settings {
  return {
    id,
    theme: data.theme || 'space-dark',
    maintenanceMode: data.maintenanceMode ?? false,
    accentColor: data.accentColor || 'blue',
    animationSpeed: data.animationSpeed ?? 1,
    warpSpeed: data.warpSpeed ?? 1.5,
    landingDuration: data.landingDuration ?? 1.0,
    soundEnabled: data.soundEnabled ?? true,
    backgroundMusicEnabled: data.backgroundMusicEnabled ?? false,
    reducedMotion: data.reducedMotion ?? false,
    is_visible: data.visible ?? true,
    display_order: data.displayOrder ?? 1,
  };
}

export async function getAll(): Promise<RepositoryStatus<Settings[]>> {
  if (!isFirebaseConfigured || !db) {
    return {
      data: [mockCareerverseData.settings],
      source: 'mock',
      success: true
    };
  }
  try {
    const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    const snap = await getDocs(q);
    const list: Settings[] = [];
    snap.forEach((docSnap) => {
      list.push(mapSettingsData(docSnap.id, docSnap.data()));
    });
    return {
      data: list,
      source: 'firebase',
      success: true
    };
  } catch (error) {
    console.error(`Error in ${COLLECTION_NAME} repository getAll:`, error);
    throw error;
  }
}

export async function getById(id: string): Promise<Settings | null> {
  if (!isFirebaseConfigured || !db) {
    return mockCareerverseData.settings.id === id ? mockCareerverseData.settings : null;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return mapSettingsData(snap.id, snap.data());
    }
    return null;
  } catch (error) {
    console.error(`Error in ${COLLECTION_NAME} repository getById:`, error);
    throw error;
  }
}

export async function create(data: Omit<Settings, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    const newId = `mock-${COLLECTION_NAME}-${Date.now()}`;
    const newRecord = { ...data, id: newId };
    mockCareerverseData.settings = newRecord;
    return newId;
  }
  try {
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), {
      theme: data.theme,
      maintenanceMode: data.maintenanceMode,
      accentColor: data.accentColor,
      animationSpeed: data.animationSpeed,
      warpSpeed: data.warpSpeed,
      landingDuration: data.landingDuration,
      soundEnabled: data.soundEnabled,
      backgroundMusicEnabled: data.backgroundMusicEnabled,
      reducedMotion: data.reducedMotion,
      visible: data.is_visible,
      displayOrder: data.display_order,
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error in ${COLLECTION_NAME} repository create:`, error);
    throw error;
  }
}

export async function update(id: string, data: Partial<Settings>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    if (mockCareerverseData.settings.id === id || id === 'default') {
      Object.assign(mockCareerverseData.settings, data);
    }
    return;
  }
  try {
    let resolvedId = id;
    if (!resolvedId || resolvedId === 'default' || resolvedId.startsWith('mock-')) {
      const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        resolvedId = snap.docs[0].id;
      } else {
        await create(data as Omit<Settings, 'id'>);
        return;
      }
    }

    const docRef = doc(db!, COLLECTION_NAME, resolvedId);
    const updateData: any = {};
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.maintenanceMode !== undefined) updateData.maintenanceMode = data.maintenanceMode;
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor;
    if (data.animationSpeed !== undefined) updateData.animationSpeed = data.animationSpeed;
    if (data.warpSpeed !== undefined) updateData.warpSpeed = data.warpSpeed;
    if (data.landingDuration !== undefined) updateData.landingDuration = data.landingDuration;
    if (data.soundEnabled !== undefined) updateData.soundEnabled = data.soundEnabled;
    if (data.backgroundMusicEnabled !== undefined) updateData.backgroundMusicEnabled = data.backgroundMusicEnabled;
    if (data.reducedMotion !== undefined) updateData.reducedMotion = data.reducedMotion;
    if (data.is_visible !== undefined) updateData.visible = data.is_visible;
    if (data.display_order !== undefined) updateData.displayOrder = data.display_order;
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error in ${COLLECTION_NAME} repository update:`, error);
    throw error;
  }
}

export async function remove(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error in ${COLLECTION_NAME} repository remove:`, error);
    throw error;
  }
}

export function subscribe(callback: (status: RepositoryStatus<Settings[]>) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    callback({
      data: [mockCareerverseData.settings],
      source: 'mock',
      success: true
    });
    return () => {};
  }
  const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
  return onSnapshot(q, (snap) => {
    const list: Settings[] = [];
    snap.forEach((docSnap) => {
      list.push(mapSettingsData(docSnap.id, docSnap.data()));
    });
    callback({
      data: list,
      source: 'firebase',
      success: true
    });
  }, (error) => {
    console.error(`Error in ${COLLECTION_NAME} repository subscription:`, error);
    callback({
      data: [],
      source: 'firebase',
      success: false,
      error
    });
  });
}
