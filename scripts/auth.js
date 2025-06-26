// Authentication related functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth module loaded');
    
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
    const profileEmail = document.getElementById('profile-email');
    
    // Check elements are loaded
    console.log('Auth container found:', !!authContainer);
    console.log('Login form found:', !!loginForm);
    console.log('Login button found:', !!loginButton);

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
    loginForm.addEventListener('submit', function(e) {
        // Prevent default form submission
        e.preventDefault();
        
        console.log('Login form submitted');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Basic validation
        if (!email || !password) {
            console.error('Validation error: Missing email or password');
            showToast('Please enter both email and password', 'error');
            return;
        }
        
        console.log('Attempting to sign in with Firebase', { email });
        
        // Check if Firebase is initialized
        if (!firebase.apps.length) {
            console.error('Firebase has not been initialized!');
            showToast('Application error: Firebase not initialized', 'error');
            return;
        }
        
        // Check if auth is available
        if (!auth) {
            console.error('Firebase auth is not available');
            showToast('Application error: Authentication system unavailable', 'error');
            return;
        }
        
        // Disable the login button to prevent multiple submissions
        loginButton.disabled = true;
        loginButton.textContent = 'Signing in...';
        
        // Use direct Firebase auth instance to ensure we have the latest reference
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Clear login form
                document.getElementById('login-email').value = '';
                document.getElementById('login-password').value = '';
                
                console.log('Login successful', userCredential.user.uid);
                showToast('Login successful!', 'success');
                
                // Manually update UI after successful login
                updateUIAfterAuth(userCredential.user);
            })
            .catch((error) => {
                console.error('Login error:', error.code, error.message);
                showToast(`Login failed: ${error.message}`, 'error');
            })
            .finally(() => {
                // Re-enable the login button
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            });
    });

    // Signup functionality
    signupForm.addEventListener('submit', function(e) {
        // Prevent default form submission
        e.preventDefault();
        
        console.log('Signup form submitted');
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        // Basic validation
        if (!email || !password) {
            console.error('Validation error: Missing email or password');
            showToast('Please enter both email and password', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            console.error('Validation error: Passwords do not match');
            showToast('Passwords do not match', 'error');
            return;
        }
        
        console.log('Attempting to create account with Firebase', { email });
        
        // Check if Firebase is initialized
        if (!firebase.apps.length) {
            console.error('Firebase has not been initialized!');
            showToast('Application error: Firebase not initialized', 'error');
            return;
        }
        
        // Disable the signup button to prevent multiple submissions
        signupButton.disabled = true;
        signupButton.textContent = 'Creating account...';
        
        // Create user with Firebase using direct reference
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Clear signup form
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-confirm-password').value = '';
                
                console.log('Account created successfully', userCredential.user.uid);
                showToast('Account created successfully!', 'success');
                
                // Manually update UI after successful signup
                updateUIAfterAuth(userCredential.user);
            })
            .catch((error) => {
                console.error('Signup error:', error.code, error.message);
                showToast(`Signup failed: ${error.message}`, 'error');
            })
            .finally(() => {
                // Re-enable the signup button
                signupButton.disabled = false;
                signupButton.textContent = 'Sign Up';
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
    firebase.auth().onAuthStateChanged(function(user) {
        console.log("Auth state change detected", user ? "Signed in" : "Signed out");
        
        // Safety check for DOM elements
        if (!authContainer || !appContainer) {
            console.error("Auth container or app container not found!");
            return;
        }
        
        if (user) {
            // User is signed in
            console.log("User authenticated:", user.uid, user.email);
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            
            if (profileEmail) {
                profileEmail.textContent = user.email;
            }
            
            // Ensure required functions are available
            if (typeof getCurrentDateString !== 'function') {
                console.error("getCurrentDateString function not found!");
                showToast("Application error: Missing function", "error");
                return;
            }
            
            // Load user's entries for today
            if (typeof loadEntries === 'function') {
                console.log("Loading entries for today");
                loadEntries(user.uid, getCurrentDateString());
            } else {
                console.error("loadEntries function not found");
            }
            
            // Mark calendar dates with entries
            if (typeof markCalendarDatesWithEntries === 'function') {
                console.log("Marking calendar dates with entries");
                markCalendarDatesWithEntries(user.uid);
            } else {
                console.error("markCalendarDatesWithEntries function not found");
            }
            
            // Update user stats in profile
            if (typeof updateUserStats === 'function') {
                console.log("Updating user stats");
                updateUserStats(user.uid);
            }
            
            // Show welcome toast on first login/signup
            const isFirstLogin = sessionStorage.getItem('firstLogin') !== 'false';
            if (isFirstLogin) {
                showToast(`Welcome, ${user.email}! Your digital diary is ready.`, 'success');
                sessionStorage.setItem('firstLogin', 'false');
            }
        } else {
            // User is signed out
            console.log("User is signed out, showing auth container");
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    });
    
    // Test login functionality for troubleshooting
    const testLoginButton = document.getElementById('test-login');
    if (testLoginButton) {
        testLoginButton.addEventListener('click', function() {
            console.log('Test login button clicked');
            
            // Show diagnostic information
            console.log('Firebase initialized:', !!firebase);
            console.log('Firebase apps:', firebase.apps.length);
            console.log('Auth reference:', !!firebase.auth());
            
            // Hard-coded test account
            const testEmail = "test@example.com";
            const testPassword = "password123";
            
            // Create the test account if it doesn't exist, then sign in
            firebase.auth().createUserWithEmailAndPassword(testEmail, testPassword)
                .then(userCredential => {
                    console.log("Test account created successfully");
                    showToast("Test account created", "success");
                    
                    // Now try to login
                    return firebase.auth().signInWithEmailAndPassword(testEmail, testPassword);
                })
                .catch(error => {
                    // If account already exists, just try to sign in
                    if (error.code === 'auth/email-already-in-use') {
                        console.log("Test account already exists, trying to sign in");
                        return firebase.auth().signInWithEmailAndPassword(testEmail, testPassword);
                    } else {
                        throw error;
                    }
                })
                .then(userCredential => {
                    console.log("Test login successful", userCredential.user.uid);
                    showToast("Test login successful!", "success");
                })
                .catch(error => {
                    console.error("Test login error:", error.code, error.message);
                    showToast(`Test login failed: ${error.message}`, "error");
                });
        });
    }
});

// Fallback for getCurrentDateString if it's not defined elsewhere
if (typeof getCurrentDateString !== 'function') {
    console.log('Defining fallback getCurrentDateString function');
    function getCurrentDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Function to manually update UI after authentication
function updateUIAfterAuth(user) {
    console.log("Manually updating UI after auth");
    
    // Safety check for DOM elements
    if (!authContainer || !appContainer) {
        console.error("Auth container or app container not found!");
        return;
    }
    
    if (user) {
        // User is authenticated
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        
        // Update profile email if available
        if (profileEmail) {
            profileEmail.textContent = user.email;
        }
        
        // Check for required functions
        if (typeof getCurrentDateString === 'function' && typeof loadEntries === 'function') {
            loadEntries(user.uid, getCurrentDateString());
        }
        
        if (typeof markCalendarDatesWithEntries === 'function') {
            markCalendarDatesWithEntries(user.uid);
        }
    } else {
        // User is not authenticated
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

// Helper function to show toast notifications
function showToast(message, type = 'success') {
    console.log(`Toast: ${type} - ${message}`);
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Force reflow to ensure animation works
    void toast.offsetWidth;
    
    // Remove after animation completes
    setTimeout(() => {
        try {
            document.body.removeChild(toast);
        } catch (error) {
            console.error('Error removing toast:', error);
        }
    }, 3000);
}
