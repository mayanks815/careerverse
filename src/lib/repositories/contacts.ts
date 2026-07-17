import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockCareerverseData, Contacts } from '../mockData';
import { RepositoryStatus } from './types';

const COLLECTION_NAME = 'contacts';

export async function getAll(): Promise<RepositoryStatus<Contacts[]>> {
  if (!isFirebaseConfigured || !db) {
    return {
      data: [mockCareerverseData.contact],
      source: 'mock',
      success: true
    };
  }
  try {
    const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    const snap = await getDocs(q);
    const list: Contacts[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        email: data.email || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        socials: data.socials || {},
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

export async function getById(id: string): Promise<Contacts | null> {
  if (!isFirebaseConfigured || !db) {
    return mockCareerverseData.contact.id === id ? mockCareerverseData.contact : null;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        email: data.email || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        socials: data.socials || {},
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

export async function create(data: Omit<Contacts, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    const newId = `mock-${COLLECTION_NAME}-${Date.now()}`;
    const newRecord = { ...data, id: newId };
    mockCareerverseData.contact = newRecord;
    return newId;
  }
  try {
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), {
      email: data.email,
      linkedin: data.linkedin,
      github: data.github,
      socials: data.socials,
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

export async function update(id: string, data: Partial<Contacts>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    if (mockCareerverseData.contact.id === id || id === 'default') {
      Object.assign(mockCareerverseData.contact, data);
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
        await create(data as Omit<Contacts, 'id'>);
        return;
      }
    }

    const docRef = doc(db!, COLLECTION_NAME, resolvedId);
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.linkedin !== undefined) updateData.linkedin = data.linkedin;
    if (data.github !== undefined) updateData.github = data.github;
    if (data.socials !== undefined) updateData.socials = data.socials;
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

export function subscribe(callback: (status: RepositoryStatus<Contacts[]>) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    callback({
      data: [mockCareerverseData.contact],
      source: 'mock',
      success: true
    });
    return () => {};
  }
  const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
  return onSnapshot(q, (snap) => {
    const list: Contacts[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        email: data.email || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        socials: data.socials || {},
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
