// Authentication related functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const logoutButtons = document.querySelectorAll('#logout-button, #sidebar-logout-button');
    const profileEmail = document.getElementById('profile-email');
    const sidebarUserGreeting = document.getElementById('sidebar-user-greeting');
    const profileSince = document.getElementById('profile-since');
    
    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? 'visibility_off' : 'visibility';
        });
    });

    // Toggle between login and signup forms with fade animation
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.opacity = '0';
        setTimeout(() => {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            setTimeout(() => {
                signupForm.style.opacity = '1';
            }, 10);
        }, 300);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.opacity = '0';
        setTimeout(() => {
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            setTimeout(() => {
                loginForm.style.opacity = '1';
            }, 10);
        }, 300);
    });

    // Login functionality
    loginButton.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Basic validation
        if (!email || !password) {
            showToast('Please enter both email and password', 'error');
            return;
        }
        
        // Change button state to loading
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="material-icons spin">refresh</i> Logging in...';
        
        // Sign in with Firebase
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Clear login form
                document.getElementById('login-email').value = '';
                document.getElementById('login-password').value = '';
                
                showToast('Login successful!', 'success');
            })
            .catch((error) => {
                showToast(`Login failed: ${error.message}`, 'error');
                console.error("Login error:", error);
            })
            .finally(() => {
                // Reset button state
                loginButton.disabled = false;
                loginButton.innerHTML = 'Login';
            });
    });

    // Signup functionality
    signupButton.addEventListener('click', () => {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        // Basic validation
        if (!email || !password) {
            showToast('Please enter both email and password', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        // Password strength check
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Change button state to loading
        signupButton.disabled = true;
        signupButton.innerHTML = '<i class="material-icons spin">refresh</i> Creating account...';
        
        // Create user with Firebase
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Store account creation date
                const user = userCredential.user;
                const creationDate = new Date().toISOString();
                database.ref(`users/${user.uid}/profile`).set({
                    email: user.email,
                    creationDate: creationDate
                });
                
                // Clear signup form
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-confirm-password').value = '';
                
                showToast('Account created successfully!', 'success');
            })
            .catch((error) => {
                showToast(`Signup failed: ${error.message}`, 'error');
                console.error("Signup error:", error);
            })
            .finally(() => {
                // Reset button state
                signupButton.disabled = false;
                signupButton.innerHTML = 'Sign Up';
            });
    });

    // Logout functionality
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Change button state
            button.disabled = true;
            
            auth.signOut()
                .then(() => {
                    showToast('Logged out successfully', 'success');
                })
                .catch((error) => {
                    showToast(`Logout failed: ${error.message}`, 'error');
                })
                .finally(() => {
                    button.disabled = false;
                });
        });
    });

    // Auth state change listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            
            // Update user info in UI
            if (profileEmail) {
                profileEmail.textContent = user.email;
            }
            
            if (sidebarUserGreeting) {
                sidebarUserGreeting.textContent = `Hello, ${user.email.split('@')[0]}!`;
            }
            
            // Get user profile info
            database.ref(`users/${user.uid}/profile`).once('value', snapshot => {
                if (snapshot.exists() && profileSince) {
                    const profile = snapshot.val();
                    if (profile.creationDate) {
                        const date = new Date(profile.creationDate);
                        const formattedDate = date.toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                        });
                        profileSince.textContent = `Member since ${formattedDate}`;
                    }
                }
            });
            
            // Load user's entries for today
            loadEntries(user.uid, getCurrentDateString());
            
            // Mark calendar dates with entries
            markCalendarDatesWithEntries(user.uid);
            
            // Update user stats
            updateUserStats(user.uid);
        } else {
            // User is signed out
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            
            // Reset forms and fade in login form
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            loginForm.style.opacity = '1';
            signupForm.style.opacity = '0';
        }
    });
    
    // Enter key to submit forms
    document.getElementById('login-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });
    
    document.getElementById('signup-confirm-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            signupButton.click();
        }
    });
});

// Update user statistics
function updateUserStats(userId) {
    const totalEntriesEl = document.getElementById('total-entries');
    const daysWithEntriesEl = document.getElementById('days-with-entries');
    const mostCommonMoodEl = document.getElementById('most-common-mood');
    
    if (!totalEntriesEl || !daysWithEntriesEl || !mostCommonMoodEl) return;
    
    database.ref(`users/${userId}/entries`).once('value', snapshot => {
        if (snapshot.exists()) {
            // Initialize counters
            let totalEntries = 0;
            let daysWithEntries = 0;
            const moodCounts = {};
            
            snapshot.forEach(dateSnapshot => {
                daysWithEntries++;
                dateSnapshot.forEach(timeSnapshot => {
                    totalEntries++;
                    const entry = timeSnapshot.val();
                    if (entry.mood) {
                        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
                    }
                });
            });
            
            // Update UI
            totalEntriesEl.textContent = totalEntries;
            daysWithEntriesEl.textContent = daysWithEntries;
            
            // Find most common mood
            let maxCount = 0;
            let mostCommonMood = '-';
            
            for (const mood in moodCounts) {
                if (moodCounts[mood] > maxCount) {
                    maxCount = moodCounts[mood];
                    mostCommonMood = mood;
                }
            }
            
            mostCommonMoodEl.textContent = mostCommonMood;
        } else {
            // No entries yet
            totalEntriesEl.textContent = '0';
            daysWithEntriesEl.textContent = '0';
            mostCommonMoodEl.textContent = '-';
        }
    });
}

// Helper function to show toast notifications with improved styling
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        toast.remove();
    });
    
    // Create toast element with icon
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon;
    switch (type) {
        case 'success':
            icon = 'check_circle';
            break;
        case 'error':
            icon = 'error';
            break;
        case 'warning':
            icon = 'warning';
            break;
        default:
            icon = 'info';
    }
    
    toast.innerHTML = `
        <span class="material-icons toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Remove after animation completes
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}
