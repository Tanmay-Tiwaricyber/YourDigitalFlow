// Main application script
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app when DOM is loaded
    console.log('Your Digital Flow app initialized');
    
    // Initialize keyboard navigation for accessibility
    setupKeyboardNavigation();
    
    // Set the current date as the selected date initially
    const today = getCurrentDateString();
    updateDateDisplay(today);
    
    // This will be triggered by auth state change listener in auth.js
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Update tag filters with user data
            updateTagFilters(user.uid);
            
            // Set default time in entry forms
            setDefaultTimeInEntryForms();
        }
    });
});

// Set default time in entry forms
function setDefaultTimeInEntryForms() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    document.getElementById('entry-time').value = currentTime;
    document.getElementById('modal-entry-time').value = currentTime;
}

// Handle errors gracefully
window.addEventListener('error', (event) => {
    console.error('Error occurred:', event.error);
    showToast('An error occurred. Please refresh the page.', 'error');
});

// Ensure app works offline by handling Firebase connection status
firebase.database().ref('.info/connected').on('value', (snapshot) => {
    const isConnected = snapshot.val();
    if (!isConnected) {
        showToast('You are offline. Changes will sync when connection is restored.', 'warning');
    }
});
