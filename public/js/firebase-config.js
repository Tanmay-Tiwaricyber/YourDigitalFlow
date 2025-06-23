// Firebase config and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0s9vHEkDR0lWEXIsI8TvcHHjX9TQ5xXk",
  authDomain: "connectchat-d3713.firebaseapp.com",
  databaseURL: "https://connectchat-d3713-default-rtdb.firebaseio.com",
  projectId: "connectchat-d3713",
  storageBucket: "connectchat-d3713.appspot.com",
  messagingSenderId: "393420495514",
  appId: "1:393420495514:web:4ff7e73efe3d68172f5d23"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
