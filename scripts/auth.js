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
    loginForm.addEventListener('submit', (e) => {
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
        
        console.log('Attempting to sign in with Firebase');
        
        // Disable the login button to prevent multiple submissions
        loginButton.disabled = true;
        loginButton.textContent = 'Signing in...';
        
        // Sign in with Firebase
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Clear login form
                document.getElementById('login-email').value = '';
                document.getElementById('login-password').value = '';
                
                console.log('Login successful', userCredential.user.uid);
                showToast('Login successful!', 'success');
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
    signupForm.addEventListener('submit', (e) => {
        // Prevent default form submission
        e.preventDefault();
        
        console.log('Signup form submitted');
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
        
        // Disable the signup button to prevent multiple submissions
        signupButton.disabled = true;
        signupButton.textContent = 'Creating account...';
        
        // Create user with Firebase
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Clear signup form
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-confirm-password').value = '';
                
                console.log('Account created successfully', userCredential.user.uid);
                showToast('Account created successfully!', 'success');
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
            
            // Update user stats in profile
            if (typeof updateUserStats === 'function') {
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
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    });
});

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
