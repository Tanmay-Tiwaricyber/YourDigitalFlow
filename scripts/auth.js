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
    const logoutButton = document.getElementById('logout-button');
    const profileLogoutButton = document.getElementById('logout-button');
    const profileEmail = document.getElementById('profile-email');

    // Toggle between login and signup forms
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
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
        
        // Create user with Firebase
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Clear signup form
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-confirm-password').value = '';
                
                showToast('Account created successfully!', 'success');
            })
            .catch((error) => {
                showToast(`Signup failed: ${error.message}`, 'error');
            });
    });

    // Logout functionality
    logoutButton.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                showToast('Logged out successfully', 'success');
            })
            .catch((error) => {
                showToast(`Logout failed: ${error.message}`, 'error');
            });
    });

    // Auth state change listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            
            if (profileEmail) {
                profileEmail.textContent = user.email;
            }
            
            // Load user's entries for today
            loadEntries(user.uid, getCurrentDateString());
            
            // Mark calendar dates with entries
            markCalendarDatesWithEntries(user.uid);
        } else {
            // User is signed out
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    });
});

// Helper function to show toast notifications with enhanced UI
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Make toast dismissable on click
    toast.addEventListener('click', () => {
        document.body.removeChild(toast);
    });
    
    // Remove after animation completes
    setTimeout(() => {
        if (document.body.contains(toast)) {
            // Add fade-out class
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            
            // Remove after fade out
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 4000);
}
