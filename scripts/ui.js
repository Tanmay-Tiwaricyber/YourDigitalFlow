// UI interactions and responsive behavior
document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation
    setupMobileNavigation();
    
    // Mobile sidebar
    setupMobileSidebar();
    
    // Desktop add entry button
    const desktopAddEntryBtn = document.getElementById('desktop-add-entry');
    desktopAddEntryBtn.addEventListener('click', () => {
        const modal = document.getElementById('entry-modal');
        modal.classList.add('active');
        
        // Set default time to current time
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('modal-entry-time').value = `${hours}:${minutes}`;
        
        // Focus on title input
        setTimeout(() => {
            document.getElementById('modal-entry-title').focus();
        }, 300);
    });
    
    // Empty state add entry button
    const emptyAddEntryBtn = document.getElementById('empty-add-entry');
    if (emptyAddEntryBtn) {
        emptyAddEntryBtn.addEventListener('click', () => {
            if (window.innerWidth >= 768) {
                // Desktop view - open modal
                document.getElementById('entry-modal').classList.add('active');
            } else {
                // Mobile view - show entry panel
                document.getElementById('entry-panel').classList.add('active');
                
                // Change active nav item
                const navBtns = document.querySelectorAll('.nav-item');
                navBtns.forEach(btn => btn.classList.remove('active'));
                document.querySelector('.nav-item[data-view="add-entry"]').classList.add('active');
            }
            
            // Set default time
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('entry-time').value = `${hours}:${minutes}`;
            document.getElementById('modal-entry-time').value = `${hours}:${minutes}`;
        });
    }
    
    // Close entry modal
    const closeModalBtn = document.getElementById('close-modal');
    closeModalBtn.addEventListener('click', () => {
        document.getElementById('entry-modal').classList.remove('active');
    });
    
    // Close entry panel
    const closeEntryPanelBtn = document.getElementById('close-entry-panel');
    closeEntryPanelBtn.addEventListener('click', () => {
        document.getElementById('entry-panel').classList.remove('active');
        
        // Switch back to timeline view
        const navBtns = document.querySelectorAll('.nav-item');
        navBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.nav-item[data-view="timeline"]').classList.add('active');
        
        // Show main content
        document.querySelector('.main-content').style.display = 'block';
    });
    
    // Setup clear search buttons
    setupClearSearchButtons();
    
    // Setup date navigation buttons
    setupDateNavigation();
    
    // Setup today buttons
    setupTodayButtons();
    
    // Theme toggle functionality
    setupThemeToggle();
    
    // Close profile on mobile
    const closeProfileBtn = document.getElementById('close-profile');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            document.getElementById('profile-view').style.display = 'none';
            document.querySelector('.main-content').style.display = 'block';
            
            // Update active nav item
            const navBtns = document.querySelectorAll('.nav-item');
            navBtns.forEach(btn => btn.classList.remove('active'));
            document.querySelector('.nav-item[data-view="timeline"]').classList.add('active');
        });
    }
    
    // Setup clear all tags buttons
    setupClearTagsButtons();
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
            
            // Handle view change with smooth transitions
            switch (viewType) {
                case 'timeline':
                    if (profileView.style.display === 'block') {
                        profileView.style.opacity = '0';
                        setTimeout(() => {
                            profileView.style.display = 'none';
                            mainContent.style.display = 'block';
                            setTimeout(() => {
                                mainContent.style.opacity = '1';
                            }, 10);
                        }, 300);
                    } else {
                        profileView.style.display = 'none';
                        entryPanel.classList.remove('active');
                        mainContent.style.display = 'block';
                        mainContent.style.opacity = '1';
                    }
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
                    
                    // Focus on title input
                    setTimeout(() => {
                        document.getElementById('entry-title').focus();
                    }, 300);
                    break;
                    
                case 'profile':
                    mainContent.style.opacity = '0';
                    entryPanel.classList.remove('active');
                    
                    setTimeout(() => {
                        mainContent.style.display = 'none';
                        profileView.style.display = 'block';
                        
                        setTimeout(() => {
                            profileView.style.opacity = '1';
                        }, 10);
                    }, 300);
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

// Setup mobile sidebar functionality
function setupMobileSidebar() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!menuToggle) return;
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

// Setup clear search buttons
function setupClearSearchButtons() {
    const clearButtons = [
        {
            button: document.getElementById('clear-desktop-search'),
            input: document.getElementById('desktop-search')
        },
        {
            button: document.getElementById('clear-profile-search'),
            input: document.getElementById('profile-search')
        }
    ];
    
    clearButtons.forEach(item => {
        if (!item.button || !item.input) return;
        
        item.button.addEventListener('click', () => {
            item.input.value = '';
            item.input.focus();
            
            // Trigger input event to update search
            const event = new Event('input', { bubbles: true });
            item.input.dispatchEvent(event);
        });
    });
}

// Setup date navigation
function setupDateNavigation() {
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    
    if (!prevDayBtn || !nextDayBtn) return;
    
    prevDayBtn.addEventListener('click', () => {
        navigateToAdjacentDay(-1);
    });
    
    nextDayBtn.addEventListener('click', () => {
        navigateToAdjacentDay(1);
    });
}

// Navigate to adjacent day
function navigateToAdjacentDay(direction) {
    // Get currently selected date
    const day = selectedDate.getDate();
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();
    
    // Create new date (clone selected date and add/subtract days)
    const newDate = new Date(year, month, day + direction);
    
    // Format new date as YYYY-MM-DD
    const dateString = formatDateString(newDate);
    
    // Update UI and load entries
    selectDate(dateString);
}

// Format date as YYYY-MM-DD
function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Setup today buttons
function setupTodayButtons() {
    const todayButtons = [
        document.getElementById('go-to-today'),
        document.getElementById('mobile-go-to-today')
    ];
    
    todayButtons.forEach(button => {
        if (!button) return;
        
        button.addEventListener('click', () => {
            // Get current date as string
            const today = getCurrentDateString();
            
            // Select today's date
            selectDate(today);
            
            // Hide mobile calendar
            document.getElementById('mobile-calendar-container').style.display = 'none';
        });
    });
}

// Setup clear all tags buttons
function setupClearTagsButtons() {
    const clearTagsButtons = [
        document.getElementById('clear-all-tags'),
        document.getElementById('profile-clear-all-tags')
    ];
    
    clearTagsButtons.forEach(button => {
        if (!button) return;
        
        button.addEventListener('click', () => {
            // Clear current filter tags
            currentFilterTags = [];
            
            // Remove active class from all tag filter buttons
            const tagFilters = document.querySelectorAll('.tag-filter');
            tagFilters.forEach(tag => {
                tag.classList.remove('active');
            });
            
            // Reload entries with cleared filters
            if (auth.currentUser) {
                loadEntries(auth.currentUser.uid, getCurrentDateString());
            }
        });
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
