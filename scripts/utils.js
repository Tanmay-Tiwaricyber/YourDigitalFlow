// Utility functions for Your Digital Flow

// Get current date string in YYYY-MM-DD format for consistent date handling
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format time from 24h to 12h format
function formatTime(time) {
    if (!time) return '';
    
    // If already in HH:MM format, parse it
    let hours, minutes;
    if (time.includes(':')) {
        [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        minutes = minutes.padStart(2, '0');
    } else {
        return time; // Return original if not in expected format
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12h format
    
    return `${hours}:${minutes} ${period}`;
}

// Format date for display (e.g., June 26, 2025)
function formatDate(dateString) {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Debug utility to check if Firebase is initialized
function checkFirebaseStatus() {
    console.log('--- Firebase Status Check ---');
    console.log('Firebase loaded:', typeof firebase !== 'undefined');
    
    if (typeof firebase !== 'undefined') {
        console.log('Firebase apps initialized:', firebase.apps.length);
        
        try {
            const authStatus = !!firebase.auth();
            console.log('Auth available:', authStatus);
            
            const dbStatus = !!firebase.database();
            console.log('Database available:', dbStatus);
            
            const currentUser = firebase.auth().currentUser;
            console.log('Current user:', currentUser ? `${currentUser.uid} (${currentUser.email})` : 'Not signed in');
        } catch (error) {
            console.error('Error checking Firebase services:', error);
        }
    }
    console.log('-------------------------');
}
