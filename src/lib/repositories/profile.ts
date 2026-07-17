import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockCareerverseData, Profile } from '../mockData';
import { RepositoryStatus } from './types';

const COLLECTION_NAME = 'profile';

export async function getAll(): Promise<RepositoryStatus<Profile[]>> {
  if (!isFirebaseConfigured || !db) {
    return {
      data: [mockCareerverseData.profile],
      source: 'mock',
      success: true
    };
  }
  try {
    const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    const snap = await getDocs(q);
    const list: Profile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        title: data.title || '',
        bio: data.bio || '',
        tagline: data.tagline || '',
        resume_url: data.resumeUrl || data.resume_url || '',
        avatar: data.avatar || '',
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

export async function getById(id: string): Promise<Profile | null> {
  if (!isFirebaseConfigured || !db) {
    return mockCareerverseData.profile.id === id ? mockCareerverseData.profile : null;
  }
  try {
    const docRef = doc(db!, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name || '',
        title: data.title || '',
        bio: data.bio || '',
        tagline: data.tagline || '',
        resume_url: data.resumeUrl || data.resume_url || '',
        avatar: data.avatar || '',
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

export async function create(data: Omit<Profile, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    const newId = `mock-${COLLECTION_NAME}-${Date.now()}`;
    const newRecord = { ...data, id: newId };
    mockCareerverseData.profile = newRecord;
    return newId;
  }
  try {
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), {
      name: data.name,
      title: data.title,
      bio: data.bio,
      tagline: data.tagline,
      resumeUrl: data.resume_url,
      avatar: data.avatar,
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

export async function update(id: string, data: Partial<Profile>): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    if (mockCareerverseData.profile.id === id || id === 'default') {
      Object.assign(mockCareerverseData.profile, data);
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
        await create(data as Omit<Profile, 'id'>);
        return;
      }
    }

    const docRef = doc(db!, COLLECTION_NAME, resolvedId);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.tagline !== undefined) updateData.tagline = data.tagline;
    if (data.resume_url !== undefined) updateData.resumeUrl = data.resume_url;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
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

export function subscribe(callback: (status: RepositoryStatus<Profile[]>) => void): () => void {
  if (!isFirebaseConfigured || !db) {
    callback({
      data: [mockCareerverseData.profile],
      source: 'mock',
      success: true
    });
    return () => {};
  }
  const q = query(collection(db!, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
  return onSnapshot(q, (snap) => {
    const list: Profile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        title: data.title || '',
        bio: data.bio || '',
        tagline: data.tagline || '',
        resume_url: data.resumeUrl || data.resume_url || '',
        avatar: data.avatar || '',
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
