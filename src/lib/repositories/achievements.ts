import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockCareerverseData, Achievement } from '../mockData';
import { RepositoryStatus } from './types';

const COLLECTION_NAME = 'achievements';

export async function getAll(): Promise<RepositoryStatus<Achievement[]>> {
  if (!isFirebaseConfigured || !db) {
    return {
      data: mockCareerverseData.achievements,
      source: 'mock',
      success: true
    };
  }
  try {
    const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    const snap = await getDocs(q);
    const list: Achievement[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        is_visible: data.visible ?? true,
        display_order: data.displayOrder ?? 1,
      });
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

export async function getById(id: string): Promise<Achievement | null> {
  if (!isFirebaseConfigured || !db) {
    const found = mockCareerverseData.achievements.find(x => x.id === id);
    return found || null;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        is_visible: data.visible ?? true,
        display_order: data.displayOrder ?? 1,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error in ${COLLECTION_NAME} repository getById:`, error);
    throw error;
  }
}

export async function create(data: Omit<Achievement, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    const newId = `mock-${COLLECTION_NAME}-${Date.now()}`;
    const newRecord = { ...data, id: newId };
    mockCareerverseData.achievements.push(newRecord);
    return newId;
  }
  try {
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), {
      title: data.title,
      description: data.description,
      date: data.date,
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

export async function update(id: string, data: Partial<Achievement>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const record = mockCareerverseData.achievements.find((a) => a.id === id);
    if (record) {
      Object.assign(record, data);
    }
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = data.date;
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
    mockCareerverseData.achievements = mockCareerverseData.achievements.filter((a) => a.id !== id);
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

export function subscribe(callback: (status: RepositoryStatus<Achievement[]>) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    callback({
      data: mockCareerverseData.achievements,
      source: 'mock',
      success: true
    });
    return () => {};
  }
  const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
  return onSnapshot(q, (snap) => {
    const list: Achievement[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        is_visible: data.visible ?? true,
        display_order: data.displayOrder ?? 1,
      });
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
