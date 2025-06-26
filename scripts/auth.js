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
        
        // Show loading toast
        showToast('Signing in...', 'info');
        
        // Use retry function with direct Firebase auth for improved reliability
        retryFirebaseOperation(() => {
            return firebase.auth().signInWithEmailAndPassword(email, password);
        }, 3, 800)
            .then((userCredential) => {
                // Clear login form
                document.getElementById('login-email').value = '';
                document.getElementById('login-password').value = '';
                
                console.log('Login successful', userCredential.user.uid);
                const toast = showToast('Login successful! Redirecting...', 'success');
                
                // Wait for toast to be visible (shorter delay) then transition
                setTimeout(() => {
                    // Manually update UI after successful login using smooth transition
                    updateUIAfterAuth(userCredential.user);
                }, 600);
            })
            .catch((error) => {
                console.error('Login error:', error.code, error.message);
                
                // Show user-friendly error messages based on Firebase error codes
                let errorMessage = error.message;
                switch(error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email format. Please check and try again.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email. Please sign up first.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password. Please try again.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your internet connection.';
                        break;
                }
                
                showToast(`Login failed: ${errorMessage}`, 'error');
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
        
        // Create user with Firebase using retry function for improved reliability
        retryFirebaseOperation(() => {
            return firebase.auth().createUserWithEmailAndPassword(email, password);
        }, 3, 800)
            .then((userCredential) => {
                // Clear signup form
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-confirm-password').value = '';
                
                console.log('Account created successfully', userCredential.user.uid);
                showToast('Account created! Welcome to Your Digital Flow', 'success');
                
                // Short delay before transition to ensure toast is visible
                setTimeout(() => {
                    // Manually update UI after successful signup with smooth transition
                    updateUIAfterAuth(userCredential.user);
                }, 600);
            })
            .catch((error) => {
                console.error('Signup error:', error.code, error.message);
                
                // Show user-friendly error messages based on Firebase error codes
                let errorMessage = error.message;
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'This email is already registered. Please login instead.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email format. Please enter a valid email address.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password is too weak. Please use at least 6 characters.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your internet connection.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'Email/password registration is not enabled. Please contact support.';
                        break;
                }
                
                showToast(`Signup failed: ${errorMessage}`, 'error');
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

    // Auth state change listener with improved error handling and transitions
    firebase.auth().onAuthStateChanged(function(user) {
        console.log("Auth state change detected", user ? "Signed in" : "Signed out");
        
        // Safety check for DOM elements
        if (!authContainer || !appContainer) {
            console.error("Auth container or app container not found!");
            // Try to create a graceful fallback
            const authContainerRef = document.getElementById('auth-container');
            const appContainerRef = document.getElementById('app-container');
            
            if (authContainerRef && appContainerRef) {
                console.log("Found container elements using direct ID lookup");
            } else {
                console.error("Critical error: Cannot find containers even with direct lookup");
                showToast("Application error: UI elements missing", "error");
                return;
            }
        }
        
        if (user) {
            // User is signed in - check Firebase connection first
            console.log("User authenticated:", user.uid, user.email);
            
            try {
                // Check if database is accessible
                const isFirebaseDefined = typeof firebase !== 'undefined' && firebase.apps.length > 0;
                if (!isFirebaseDefined) {
                    console.error("Firebase not initialized in auth state change");
                    showToast("Connection issue: Trying to restore session", "warning");
                }
                
                // Ensure required functions are available before proceeding
                if (typeof getCurrentDateString !== 'function') {
                    console.error("getCurrentDateString function not found!");
                    showToast("Application error: Missing critical functions", "error");
                    // Try loading a fallback version from utils.js
                    if (typeof loadScript === 'function') {
                        loadScript('scripts/utils.js', () => {
                            console.log("Loaded utils.js for fallback functions");
                        });
                    }
                }
                
                // Use smooth transition to show app
                transitionContainers(authContainer, appContainer, () => {
                    // Update UI elements after transition completes
                    if (profileEmail) {
                        profileEmail.textContent = user.email;
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
                });
                
                // Show welcome toast on first login/signup
                const isFirstLogin = sessionStorage.getItem('firstLogin') !== 'false';
                if (isFirstLogin) {
                    showToast(`Welcome, ${user.email}! Your digital diary is ready.`, 'success');
                    sessionStorage.setItem('firstLogin', 'false');
                }
            } catch (error) {
                console.error("Error in auth state change handler:", error);
                showToast("An error occurred while loading your data. Please refresh the page.", "error");
            }
        } else {
            // User is signed out - use smooth transition
            console.log("User is signed out, transitioning to auth container");
            transitionContainers(appContainer, authContainer, () => {
                console.log("Transition to authentication view complete");
            });
        }
    }, (error) => {
        // Add explicit error handling for auth state observer
        console.error("Auth state observer error:", error);
        showToast("Authentication error: " + (error.message || "Unknown error"), "error");
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
        // User is authenticated - use smooth transition
        transitionContainers(authContainer, appContainer, () => {
            console.log("Auth container transition complete");
            
            // Update profile email if available
            if (profileEmail) {
                profileEmail.textContent = user.email;
            }
            
            // Check for required functions
            if (typeof getCurrentDateString === 'function' && typeof loadEntries === 'function') {
                loadEntries(user.uid, getCurrentDateString());
            } else {
                console.error("Required functions missing: getCurrentDateString or loadEntries");
            }
            
            if (typeof markCalendarDatesWithEntries === 'function') {
                markCalendarDatesWithEntries(user.uid);
            } else {
                console.error("Required function missing: markCalendarDatesWithEntries");
            }
        });
    } else {
        // User is not authenticated
        transitionContainers(appContainer, authContainer, () => {
            console.log("App container transition complete");
        });
    }
}

// Function to handle smooth transition between auth and app containers
function transitionContainers(fromContainer, toContainer, callback) {
    // Add transition effect
    if (fromContainer && toContainer) {
        fromContainer.classList.add('fade-out');
        
        // Wait for fade-out animation to complete
        setTimeout(() => {
            fromContainer.style.display = 'none';
            toContainer.style.display = 'flex';
            toContainer.classList.add('fade-in');
            
            // Clear classes after animation completes
            setTimeout(() => {
                fromContainer.classList.remove('fade-out');
                toContainer.classList.remove('fade-in');
                
                // Execute callback if provided
                if (typeof callback === 'function') {
                    callback();
                }
            }, 500);
        }, 300);
    } else {
        console.error("Container elements not found for transition");
        
        // Still execute callback if containers are missing
        if (typeof callback === 'function') {
            callback();
        }
    }
}

// Enhanced helper function to show toast notifications with improved stacking and queuing
function showToast(message, type = 'success') {
    console.log(`Toast: ${type} - ${message}`);
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Manage toast queue/limit to prevent overcrowding
    const maxToasts = 3;
    if (toastContainer.children.length >= maxToasts) {
        // Remove the oldest toast if we're at the limit
        const oldestToast = toastContainer.children[0];
        if (oldestToast && oldestToast._timeout) {
            clearTimeout(oldestToast._timeout);
        }
        toastContainer.removeChild(oldestToast);
    }
    
    // Create toast element with improved accessibility
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // For error toasts, ensure they stay visible longer
    const displayDuration = type === 'error' ? 8000 : 
                           type === 'warning' ? 6000 : 5000;
    
    // Add appropriate icon based on toast type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="material-icons">check_circle</i>';
            break;
        case 'error':
            icon = '<i class="material-icons">error</i>';
            break;
        case 'warning':
            icon = '<i class="material-icons">warning</i>';
            break;
        case 'info':
            icon = '<i class="material-icons">info</i>';
            break;
    }
    
    // Add content with icon
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="toast-close" aria-label="Close notification">
            <i class="material-icons">close</i>
        </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Force reflow to ensure animation works
    void toast.offsetWidth;
    toast.classList.add('show');
    
    // Add close button functionality with improved reliability
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            dismissToast(toast, toastContainer);
        });
    }
    
    // Add tap-to-dismiss for mobile users (on the toast itself, not just the close button)
    toast.addEventListener('click', (e) => {
        // Only dismiss if clicked on the toast but not on the close button 
        // (which has its own handler)
        if (e.target.closest('.toast-close') === null) {
            dismissToast(toast, toastContainer);
        }
    });
    
    // Helper function to dismiss toast with animation
    function dismissToast(toastElement, container) {
        if (!toastElement.isConnected) return;
        
        // Clear existing timeout
        if (toastElement._timeout) {
            clearTimeout(toastElement._timeout);
        }
        
        // Start dismiss animation
        toastElement.classList.remove('show');
        
        // Remove after animation completes
        setTimeout(() => {
            try {
                if (toastElement.isConnected) {
                    container.removeChild(toastElement);
                }
                
                // Remove container if empty
                if (container.children.length === 0 && container.isConnected) {
                    document.body.removeChild(container);
                }
            } catch (error) {
                console.error('Error removing toast:', error);
            }
        }, 300);
    }
    
    // Auto-remove after timeout
    const timeout = setTimeout(() => {
        dismissToast(toast, toastContainer);
    }, displayDuration);
    
    // Store timeout to allow manual clearing
    toast._timeout = timeout;
    
    return toast;
}

// Helper function to retry Firebase operations
async function retryFirebaseOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} of ${maxRetries}`);
            return await operation();
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            
            // Only retry if it's a retryable error
            if (!shouldRetryFirebaseOperation(error) || attempt === maxRetries) {
                break;
            }
            
            // Exponential backoff
            const backoffDelay = delay * Math.pow(1.5, attempt - 1);
            console.log(`Retrying in ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
    }
    
    // If we get here, all retries failed
    throw lastError;
}
