// Authentication module
// Handles sign up, sign in, sign out, and password reset
// Uses Firebase Auth
import { auth } from '../public/js/firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

export async function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}
