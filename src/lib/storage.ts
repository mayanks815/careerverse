import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

/**
 * Upload a File to Firebase Storage and return its public download URL.
 *
 * @param path  Storage path, e.g. 'resume/resume.pdf' or 'avatars/profile.jpg'
 * @param file  The File or Blob to upload
 * @returns     Public download URL string
 */
export async function uploadFile(path: string, file: File): Promise<string> {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars.');
  }
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

/**
 * Delete a file from Firebase Storage by its full download URL.
 * Silently ignores 'object-not-found' errors.
 *
 * @param downloadUrl  Full Firebase Storage download URL
 */
export async function deleteStorageFile(downloadUrl: string): Promise<void> {
  if (!isFirebaseConfigured || !storage) return;
  try {
    const storageRef = ref(storage, downloadUrl);
    await deleteObject(storageRef);
  } catch (err: any) {
    // 'storage/object-not-found' — already deleted, safe to ignore
    if (err?.code !== 'storage/object-not-found') {
      console.error('deleteStorageFile error:', err);
      throw err;
    }
  }
}

/**
 * Build a namespaced storage path to prevent collisions.
 *
 * @param category  e.g. 'resume' | 'avatar' | 'certificate'
 * @param fileName  Original file name
 * @returns         e.g. 'resume/resume-1720000000000.pdf'
 */
export function buildStoragePath(category: string, fileName: string): string {
  const ext = fileName.split('.').pop();
  return `${category}/${category}-${Date.now()}.${ext}`;
}
