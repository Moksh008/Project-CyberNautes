// Scan history + settings store.
// Source of truth is Cloud Firestore (scoped per signed-in user). When there is
// no user or Firestore is unreachable, we fall back to the local browser cache.

import { initFirestore } from '../config/firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import {
  upsertScan as lsUpsert,
  clearScans as lsClear,
  getSettings as lsGetSettings,
  saveSettings as lsSaveSettings,
  DEFAULT_SETTINGS,
  type ScanRecord,
  type AppSettings,
} from '../utils/scanHistory';

export type { ScanRecord, AppSettings };

const scansCol = (db: Awaited<ReturnType<typeof initFirestore>>, uid: string) =>
  collection(db, 'users', uid, 'scans');

/** Load scans from Firestore. Throws if unavailable so the caller can fall back. */
export async function loadScans(uid: string): Promise<ScanRecord[]> {
  const db = await initFirestore();
  const snap = await getDocs(query(scansCol(db, uid), orderBy('timestamp', 'desc')));
  return snap.docs.map((d) => d.data() as ScanRecord);
}

/** Save a scan. Always updates the local cache; also writes to Firestore when signed in. */
export async function saveScan(uid: string | null, record: ScanRecord): Promise<void> {
  lsUpsert(record);
  if (!uid) return;
  try {
    const db = await initFirestore();
    await setDoc(doc(scansCol(db, uid), record.id), record);
  } catch (err) {
    console.warn('Firestore saveScan failed (kept local copy):', err);
  }
}

export async function clearAllScans(uid: string | null): Promise<void> {
  lsClear();
  if (!uid) return;
  try {
    const db = await initFirestore();
    const snap = await getDocs(scansCol(db, uid));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  } catch (err) {
    console.warn('Firestore clearAllScans failed:', err);
  }
}

export async function loadSettings(uid: string | null): Promise<AppSettings> {
  const local = lsGetSettings();
  if (!uid) return local;
  try {
    const db = await initFirestore();
    const snap = await getDoc(doc(db, 'users', uid));
    const remote = snap.exists() ? (snap.data().settings as Partial<AppSettings> | undefined) : undefined;
    return { ...DEFAULT_SETTINGS, ...local, ...(remote || {}) };
  } catch (err) {
    console.warn('Firestore loadSettings failed (using local):', err);
    return local;
  }
}

export async function persistSettings(uid: string | null, next: AppSettings): Promise<void> {
  lsSaveSettings(next);
  if (!uid) return;
  try {
    const db = await initFirestore();
    await setDoc(doc(db, 'users', uid), { settings: next }, { merge: true });
  } catch (err) {
    console.warn('Firestore persistSettings failed:', err);
  }
}
