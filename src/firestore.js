// Firestore data-access module
// Handles CRUD for diary entries and user preferences
// Uses Firestore
import { db } from '../public/js/firebase-config.js';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Diary entry schema: { date, content, tags, mood, media }
export async function saveEntry(uid, entry) {
  const ref = doc(db, `users/${uid}/entries/${entry.date}`);
  await setDoc(ref, entry);
}

export async function getEntry(uid, date) {
  const ref = doc(db, `users/${uid}/entries/${date}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function getAllEntries(uid) {
  const ref = collection(db, `users/${uid}/entries`);
  const snap = await getDocs(ref);
  return snap.docs.map(doc => doc.data());
}

export async function deleteEntry(uid, date) {
  const ref = doc(db, `users/${uid}/entries/${date}`);
  await deleteDoc(ref);
}

// User preferences
export async function savePreferences(uid, prefs) {
  const ref = doc(db, `users/${uid}/preferences`);
  await setDoc(ref, prefs, { merge: true });
}

export async function getPreferences(uid) {
  const ref = doc(db, `users/${uid}/preferences`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}
