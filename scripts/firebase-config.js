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

// Initialize Firebase with robust error handling and retry capability
let initRetries = 0;
const maxInitRetries = 3;

function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (!firebase.apps.length) {
            console.log(`Initializing Firebase (attempt ${initRetries + 1})`);
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully");
        } else {
            console.log("Firebase already initialized, using existing app");
        }
        
        // Verify that Firebase was initialized correctly
        if (!firebase.app) {
            throw new Error("Firebase app not available after initialization");
        }
        
        // Add a connection status listener
        firebase.database().ref(".info/connected").on("value", (snap) => {
            if (snap.val() === true) {
                console.log("Connected to Firebase RTDB");
                
                // Show reconnection message if this wasn't the first connection
                if (sessionStorage.getItem('previouslyConnected') === 'true') {
                    if (typeof showToast === 'function') {
                        showToast('Connection restored', 'success');
                    }
                }
                
                // Mark as having been connected
                sessionStorage.setItem('previouslyConnected', 'true');
            } else {
                console.log("Disconnected from Firebase RTDB");
            }
        });
        
        return true;
    } catch (error) {
        console.error(`Firebase initialization error (attempt ${initRetries + 1})`, error);
        
        // Retry initialization if below max retries
        if (initRetries < maxInitRetries) {
            initRetries++;
            console.log(`Retrying Firebase initialization in ${initRetries * 1000}ms...`);
            
            // Use exponential backoff for retries
            setTimeout(initializeFirebase, initRetries * 1000);
            return false;
        }
        
        // Display error to user if all retries failed
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            const message = "Failed to connect to Firebase. Please check your connection and reload the page.";
            
            // Use built-in alert if showToast isn't available yet
            if (typeof showToast === 'function') {
                showToast(message, 'error');
            } else {
                console.warn("ShowToast function not available, using alert");
                alert(message);
            }
        }
        
        return false;
    }
}

// Run the initialization function
initializeFirebase();

// Get database and auth references with fallback handling
let auth, database;
try {
    // Get auth reference with verification
    auth = firebase.auth();
    if (!auth) {
        throw new Error("Firebase auth reference is null");
    }
    
    // Get database reference with verification
    database = firebase.database();
    if (!database) {
        throw new Error("Firebase database reference is null");
    }
    
    console.log("Firebase auth and database references created successfully");
    
    // Register auth state observer with improved logging
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("Auth state changed: User is signed in", user.uid);
            console.log("Email:", user.email);
            console.log("Email verified:", user.emailVerified);
            console.log("Auth provider:", user.providerData[0]?.providerId || 'unknown');
        } else {
            console.log("Auth state changed: User is signed out");
        }
    }, (error) => {
        console.error("Auth state observer error:", error);
    });
    
    // Test database connectivity
    database.ref('.info/connected').on('value', (snapshot) => {
        const isConnected = snapshot.val();
        console.log("Firebase database connected:", isConnected);
    }, (error) => {
        console.error("Database connectivity check failed:", error);
    });
} catch (error) {
    console.error("Error getting Firebase references:", error);
    
    // Create placeholder objects to prevent null reference errors
    if (!auth) {
        console.warn("Creating placeholder auth object");
        auth = {
            onAuthStateChanged: (fn) => { console.warn("Using placeholder auth"); },
            signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase auth not available")),
            createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase auth not available")),
            signOut: () => Promise.reject(new Error("Firebase auth not available")),
            currentUser: null
        };
    }
    
    if (!database) {
        console.warn("Creating placeholder database object");
        database = {
            ref: () => ({
                on: () => {},
                once: () => Promise.reject(new Error("Firebase database not available")),
                set: () => Promise.reject(new Error("Firebase database not available")),
                update: () => Promise.reject(new Error("Firebase database not available")),
                remove: () => Promise.reject(new Error("Firebase database not available"))
            })
        };
    }
    
    // Display error to user
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const message = "Failed to connect to Firebase services. Please check your connection and reload the page.";
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(message, 'error');
            } else {
                alert(message);
            }
        }, 1000);
    }
}
