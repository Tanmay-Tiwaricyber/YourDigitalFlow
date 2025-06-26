// UI interactions and responsive behavior
document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation
    setupMobileNavigation();
    
    // Desktop add entry button
    const desktopAddEntryBtn = document.getElementById('desktop-add-entry');
    desktopAddEntryBtn.addEventListener('click', () => {
        const modal = document.getElementById('entry-modal');
        modal.classList.add('active');
    });
    
    // Close entry modal
    const closeModalBtn = document.getElementById('close-modal');
    closeModalBtn.addEventListener('click', () => {
        document.getElementById('entry-modal').classList.remove('active');
    });
    
    // Close entry panel
    const closeEntryPanelBtn = document.getElementById('close-entry-panel');
    closeEntryPanelBtn.addEventListener('click', () => {
        document.getElementById('entry-panel').classList.remove('active');
    });
    
    // Close profile view button
    const closeProfileBtn = document.getElementById('close-profile-view');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            document.getElementById('profile-view').style.display = 'none';
            document.querySelector('.main-content').style.display = 'block';
            
            // Set timeline button as active
            const navButtons = document.querySelectorAll('.nav-item');
            navButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector('.nav-item[data-view="timeline"]').classList.add('active');
        });
    }
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            const searchInputs = document.querySelectorAll('#profile-search, #desktop-search');
            searchInputs.forEach(input => {
                input.value = '';
                input.dispatchEvent(new Event('input'));
            });
        });
    }
    
    // Clear all filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            // Clear mood filters
            document.querySelectorAll('.mood-filter.active').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Clear tag filters
            document.querySelectorAll('.tag-filter.active').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Reset filter variables and reload entries
            currentFilterMood = null;
            currentFilterTags = [];
            
            if (auth.currentUser) {
                loadEntries(auth.currentUser.uid, getCurrentDateString());
            }
        });
    }
    
    // Theme toggle functionality
    setupThemeToggle();
});

// Setup mobile navigation
function setupMobileNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    const entryPanel = document.getElementById('entry-panel');
    const profileView = document.getElementById('profile-view');
    const mainContent = document.querySelector('.main-content');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get view type
            const viewType = button.getAttribute('data-view');
            
            // Handle view change
            switch (viewType) {
                case 'timeline':
                    profileView.style.display = 'none';
                    entryPanel.classList.remove('active');
                    mainContent.style.display = 'block';
                    break;
                    
                case 'add-entry':
                    profileView.style.display = 'none';
                    entryPanel.classList.add('active');
                    mainContent.style.display = 'block';
                    
                    // Set default time to current time
                    const now = new Date();
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    document.getElementById('entry-time').value = `${hours}:${minutes}`;
                    break;
                    
                case 'profile':
                    profileView.style.display = 'block';
                    entryPanel.classList.remove('active');
                    mainContent.style.display = 'none';
                    break;
            }
        });
    });
    
    // Close modal when clicking outside
    const modal = document.getElementById('entry-modal');
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Setup theme toggle functionality
function setupThemeToggle() {
    const themeToggles = [
        document.getElementById('theme-toggle'),
        document.getElementById('profile-theme-toggle')
    ];
    
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggles.forEach(toggle => {
            if (toggle) toggle.checked = true;
        });
    }
    
    // Add event listeners to theme toggles
    themeToggles.forEach(toggle => {
        if (!toggle) return;
        
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
            
            // Sync other toggle
            themeToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    otherToggle.checked = toggle.checked;
                }
            });
        });
    });
}

// Update user stats in profile
function updateUserStats(userId) {
    const entryCountEl = document.getElementById('entry-count');
    const daysCountEl = document.getElementById('days-count');
    
    if (!entryCountEl || !daysCountEl) return;
    
    database.ref(`users/${userId}/entries`).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // Count total days with entries
            const daysCount = Object.keys(snapshot.val()).length;
            daysCountEl.textContent = daysCount;
            
            // Count total entries
            let entryCount = 0;
            snapshot.forEach(dateSnapshot => {
                entryCount += Object.keys(dateSnapshot.val()).length;
            });
            entryCountEl.textContent = entryCount;
        } else {
            daysCountEl.textContent = '0';
            entryCountEl.textContent = '0';
        }
    }).catch(error => {
        console.error('Error fetching user stats:', error);
    });
}
