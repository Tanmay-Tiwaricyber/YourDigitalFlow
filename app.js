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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const loginPage = document.getElementById('login-page');
const mainApp = document.getElementById('main-app');
const loginBtn = document.getElementById('login-btn');
const signupLink = document.getElementById('signup-link');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const themeToggle = document.getElementById('theme-toggle');
const themeSwitch = document.getElementById('theme-switch');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const fabBtn = document.getElementById('fab-btn');
const loading = document.getElementById('loading');
const toast = document.getElementById('toast');
const submitEntryBtn = document.getElementById('submit-entry');
const tagsInput = document.getElementById('entry-tags');
const tagsContainer = document.getElementById('tags-container');
const refreshBtn = document.getElementById('refresh-btn');
const entriesContainer = document.getElementById('entries-container');
const currentDateEl = document.getElementById('current-date');
const searchBtn = document.getElementById('search-btn');
const filterBtn = document.getElementById('filter-btn');
const exportBtn = document.getElementById('export-btn');

// App State
let currentPage = 'timeline-page';
let selectedMood = '😊';
let tags = [];
let currentUser = null;

// Format date for display
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Update current date display
function updateCurrentDate() {
    currentDateEl.textContent = formatDate(new Date());
}

// Initialize app
function initApp() {
    // Set current date
    updateCurrentDate();
    
    // Check saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeSwitch.checked = true;
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUser = user;
            loginPage.style.display = 'none';
            mainApp.style.display = 'block';
            userEmail.textContent = user.email;
            loadEntries();
        } else {
            // No user is signed in
            loginPage.style.display = 'flex';
            mainApp.style.display = 'none';
            focusFirstInputOnLogin();
        }
    });
}

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeSwitch.checked = true;
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeSwitch.checked = false;
    }
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const pageId = item.getAttribute('data-page');
        showPage(pageId);
        
        // Update active nav item
        navItems.forEach(navItem => {
            navItem.classList.remove('active');
        });
        item.classList.add('active');
    });
});

// FAB button click
fabBtn.addEventListener('click', () => {
    showPage('add-entry-page');
    
    // Update active nav item
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === 'add-entry-page') {
            item.classList.add('active');
        }
    });
});

// Modern smooth page transitions
function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    const nextPage = document.getElementById(pageId);
    if (nextPage) {
        nextPage.classList.add('active');
        nextPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    currentPage = pageId;
}

// Mood selection
const moodOptions = document.querySelectorAll('.mood-option');
moodOptions.forEach(option => {
    option.addEventListener('click', () => {
        moodOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        selectedMood = option.textContent;
    });
});

// Tags input handling
tagsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagsInput.value.trim() !== '') {
        const tagText = tagsInput.value.trim();
        tags.push(tagText);
        renderTags();
        tagsInput.value = '';
    }
});

function renderTags() {
    tagsContainer.innerHTML = '';
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = `#${tag}`;
        tagsContainer.appendChild(tagElement);
    });
}

// Show loading indicator
function showLoading() {
    loading.style.display = 'flex';
}

// Hide loading indicator
function hideLoading() {
    loading.style.display = 'none';
}

// Show toast message
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Login functionality
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (email && password) {
        showLoading();
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                hideLoading();
                showToast('Login successful');
            })
            .catch((error) => {
                hideLoading();
                showToast('Login failed: ' + error.message);
            });
    } else {
        showToast('Please enter email and password');
    }
});

// Signup link
signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (email && password) {
        showLoading();
        
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                hideLoading();
                showToast('Account created successfully');
            })
            .catch((error) => {
                hideLoading();
                showToast('Signup failed: ' + error.message);
            });
    } else {
        showToast('Please enter email and password');
    }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    showLoading();
    
    auth.signOut()
        .then(() => {
            hideLoading();
            showToast('Successfully logged out');
        })
        .catch((error) => {
            hideLoading();
            showToast('Logout failed: ' + error.message);
        });
});

// Add entry functionality
submitEntryBtn.addEventListener('click', () => {
    const title = document.getElementById('entry-title').value;
    const description = document.getElementById('entry-description').value;
    
    if (title && description) {
        showLoading();
        
        // Get current date and time
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // Create entry object
        const entry = {
            title: title,
            description: description,
            mood: selectedMood,
            tags: tags,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Save to Firebase RTDB
        if (currentUser) {
            const entryRef = database.ref(`users/${currentUser.uid}/entries/${dateStr}/${timeStr}`);
            entryRef.set(entry)
                .then(() => {
                    hideLoading();
                    showToast('Entry added successfully!');
                    
                    // Reset form
                    document.getElementById('entry-title').value = '';
                    document.getElementById('entry-description').value = '';
                    tags = [];
                    renderTags();
                    
                    // Show timeline page
                    showPage('timeline-page');
                    
                    // Update nav
                    navItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-page') === 'timeline-page') {
                            item.classList.add('active');
                        }
                    });
                    
                    // Reload entries
                    loadEntries();
                })
                .catch((error) => {
                    hideLoading();
                    showToast('Error saving entry: ' + error.message);
                });
        } else {
            hideLoading();
            showToast('User not authenticated');
        }
    } else {
        showToast('Please enter title and description');
    }
});

// Refresh button
refreshBtn.addEventListener('click', () => {
    showLoading();
    loadEntries();
});

// Add glass class to main containers on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    // Header
    document.querySelector('.app-header')?.classList.add('glass');
    // Date selector
    document.querySelector('.date-selector')?.classList.add('glass');
    // Timeline container
    document.querySelector('.timeline-container')?.classList.add('glass');
    // Add-entry container
    document.querySelector('.add-entry-container')?.classList.add('glass');
    // Login form
    document.querySelector('.login-form')?.classList.add('glass');
    // Settings options
    document.querySelectorAll('.settings-option').forEach(el => el.classList.add('glass'));
    // Modern: add focus-visible for keyboard navigation
    document.body.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            document.body.classList.add('user-is-tabbing');
        }
    });
    document.body.addEventListener('mousedown', () => {
        document.body.classList.remove('user-is-tabbing');
    });
});

// Calendar icon click: open date picker and update timeline
const calendarIcon = document.querySelector('.calendar-icon');
if (calendarIcon) {
    calendarIcon.style.cursor = 'pointer';
    calendarIcon.addEventListener('click', () => {
        // Create a hidden input[type=date]
        let dateInput = document.getElementById('hidden-date-input');
        if (!dateInput) {
            dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.id = 'hidden-date-input';
            dateInput.style.display = 'none';
            document.body.appendChild(dateInput);
        }
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.onchange = function() {
            // Update current date display and reload entries for selected date
            const selectedDate = new Date(this.value);
            currentDateEl.textContent = formatDate(selectedDate);
            loadEntries(this.value);
        };
        dateInput.click();
    });
}

// Update loadEntries to accept a date string
function loadEntries(dateStr) {
    if (!currentUser) return;
    const dateToLoad = dateStr || new Date().toISOString().split('T')[0];
    entriesContainer.innerHTML = '<div class="pull-to-refresh">Loading entries...</div>';
    const entriesRef = database.ref(`users/${currentUser.uid}/entries/${dateToLoad}`);
    entriesRef.once('value')
        .then((snapshot) => {
            const entries = snapshot.val();
            renderEntries(entries);
            hideLoading();
        })
        .catch((error) => {
            hideLoading();
            showToast('Error loading entries: ' + error.message);
            entriesContainer.innerHTML = '<div class="pull-to-refresh">Error loading entries. Pull to refresh.</div>';
        });
}

// Load entries from Firebase
function loadEntries() {
    if (!currentUser) return;
    
    entriesContainer.innerHTML = '<div class="pull-to-refresh">Loading entries...</div>';
    
    // Get today's entries
    const today = new Date().toISOString().split('T')[0];
    const entriesRef = database.ref(`users/${currentUser.uid}/entries/${today}`);
    
    entriesRef.once('value')
        .then((snapshot) => {
            const entries = snapshot.val();
            renderEntries(entries);
            hideLoading();
        })
        .catch((error) => {
            hideLoading();
            showToast('Error loading entries: ' + error.message);
            entriesContainer.innerHTML = '<div class="pull-to-refresh">Error loading entries. Pull to refresh.</div>';
        });
}

// Render entries to the timeline
function renderEntries(entries) {
    entriesContainer.innerHTML = '';
    
    if (!entries) {
        entriesContainer.innerHTML = '<div class="pull-to-refresh">No entries yet. Add your first entry!</div>';
        return;
    }
    
    // Convert entries object to array and sort by time
    const entriesArray = Object.entries(entries)
        .map(([time, entry]) => ({ time, ...entry }))
        .sort((a, b) => a.time.localeCompare(b.time));
    
    entriesArray.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry-card';
        entryElement.innerHTML = `
            <div class="entry-header">
                <div class="entry-time">${entry.time}</div>
                <div class="entry-mood">${entry.mood}</div>
            </div>
            <h3 class="entry-title">${entry.title}</h3>
            <p class="entry-description">${entry.description}</p>
            <div class="entry-tags">
                ${entry.tags ? entry.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : ''}
            </div>
        `;
        entriesContainer.appendChild(entryElement);
    });
    
    entriesContainer.innerHTML += '<div class="pull-to-refresh">Pull down to refresh</div>';
}

// Export data functionality
exportBtn.addEventListener('click', () => {
    if (!currentUser) {
        showToast('Please log in to export data');
        return;
    }
    
    showLoading();
    
    const entriesRef = database.ref(`users/${currentUser.uid}/entries`);
    entriesRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `your-digital-flow-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            hideLoading();
            showToast('Data exported successfully');
        })
        .catch((error) => {
            hideLoading();
            showToast('Export failed: ' + error.message);
        });
});

// Search functionality
searchBtn.addEventListener('click', () => {
    const searchTerm = prompt('Enter search keyword:');
    if (searchTerm) {
        showToast(`Searching for: ${searchTerm}`);
        // In a real app, implement search logic
    }
});

// Filter functionality
filterBtn.addEventListener('click', () => {
    const mood = prompt('Enter mood emoji to filter:');
    if (mood) {
        showToast(`Filtering by mood: ${mood}`);
        // In a real app, implement filter logic
    }
});

// Modern: focus first input on login page show
function focusFirstInputOnLogin() {
    if (loginPage.style.display !== 'none') {
        setTimeout(() => {
            emailInput?.focus();
        }, 200);
    }
}
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        currentUser = user;
        loginPage.style.display = 'none';
        mainApp.style.display = 'block';
        userEmail.textContent = user.email;
        loadEntries();
    } else {
        // No user is signed in
        loginPage.style.display = 'flex';
        mainApp.style.display = 'none';
        focusFirstInputOnLogin();
    }
});

// Initialize the app
initApp();
