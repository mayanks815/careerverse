import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockCareerverseData, Skill } from '../mockData';
import { RepositoryStatus } from './types';

const COLLECTION_NAME = 'skills';

export async function getAll(): Promise<RepositoryStatus<Skill[]>> {
  if (!isFirebaseConfigured || !db) {
    return {
      data: mockCareerverseData.skills,
      source: 'mock',
      success: true
    };
  }
  try {
    const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    const snap = await getDocs(q);
    const list: Skill[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        skill_name: data.skillName || data.skill_name || '',
        category: (data.category || 'Programming') as any,
        proficiency: data.proficiency ?? 80,
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

export async function getById(id: string): Promise<Skill | null> {
  if (!isFirebaseConfigured || !db) {
    const found = mockCareerverseData.skills.find(x => x.id === id);
    return found || null;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        skill_name: data.skillName || data.skill_name || '',
        category: (data.category || 'Programming') as any,
        proficiency: data.proficiency ?? 80,
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

export async function create(data: Omit<Skill, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    const newId = `mock-${COLLECTION_NAME}-${Date.now()}`;
    const newRecord = { ...data, id: newId };
    mockCareerverseData.skills.push(newRecord);
    return newId;
  }
  try {
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), {
      skillName: data.skill_name,
      category: data.category,
      proficiency: data.proficiency,
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

export async function update(id: string, data: Partial<Skill>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    const record = mockCareerverseData.skills.find((s) => s.id === id);
    if (record) {
      Object.assign(record, data);
    }
    return;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    const updateData: any = {};
    if (data.skill_name !== undefined) updateData.skillName = data.skill_name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.proficiency !== undefined) updateData.proficiency = data.proficiency;
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
    mockCareerverseData.skills = mockCareerverseData.skills.filter((s) => s.id !== id);
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

export function subscribe(callback: (status: RepositoryStatus<Skill[]>) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    callback({
      data: mockCareerverseData.skills,
      source: 'mock',
      success: true
    });
    return () => {};
  }
  const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
  return onSnapshot(q, (snap) => {
    const list: Skill[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        skill_name: data.skillName || data.skill_name || '',
        category: (data.category || 'Programming') as any,
        proficiency: data.proficiency ?? 80,
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
