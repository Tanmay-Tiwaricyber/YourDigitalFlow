// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA0s9vHEkDR0lWEXIsI8TvcHHjX9TQ5xXk",
    authDomain: "connectchat-d3713.firebaseapp.com",
    databaseURL: "https://connectchat-d3713-default-rtdb.firebaseio.com",
    projectId: "connectchat-d3713",
    storageBucket: "connectchat-d3713.firebasestorage.app",
    messagingSenderId: "393420495514",
    appId: "1:393420495514:web:4ff7e73efe3d68172f5d23"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error", error);
}

// Get database and auth references
const auth = firebase.auth();
const database = firebase.database();
