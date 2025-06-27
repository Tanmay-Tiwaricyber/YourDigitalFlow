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
    const profileLogoutButton = document.getElementById('profile-logout-button');
    const profileEmail = document.getElementById('profile-email');

    // Toggle between login and signup forms with animation
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        
        // Animate form elements
        const animateItems = signupForm.querySelectorAll('.animate-item');
        animateItems.forEach((item, index) => {
            item.style.setProperty('--item-index', index);
            item.classList.remove('slide-in');
            void item.offsetWidth; // Force reflow
            item.classList.add('slide-in');
        });
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        
        // Animate form elements
        const animateItems = loginForm.querySelectorAll('.animate-item');
        animateItems.forEach((item, index) => {
            item.style.setProperty('--item-index', index);
            item.classList.remove('slide-in');
            void item.offsetWidth; // Force reflow
            item.classList.add('slide-in');
        });
    });
    
    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility';
            } else {
                input.type = 'password';
                icon.textContent = 'visibility_off';
            }
        });
    });

    // Login functionality with loading state
    loginButton.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Basic validation
        if (!email || !password) {
            showToast('Please enter both email and password', 'error');
            return;
        }
        
        // Show loading state
        loginButton.innerHTML = '<span class="loading-spinner-small"></span> Logging in...';
        loginButton.disabled = true;
        
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
            })
            .finally(() => {
                // Reset button state
                loginButton.innerHTML = 'Login';
                loginButton.disabled = false;
            });
    });

    // Signup functionality with loading state
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
        
        if (password.length < 6) {
            showToast('Password should be at least 6 characters', 'error');
            return;
        }
        
        // Show loading state
        signupButton.innerHTML = '<span class="loading-spinner-small"></span> Creating account...';
        signupButton.disabled = true;
        
        // Create user with Firebase
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Clear signup form
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-password').value = '';
                document.getElementById('signup-confirm-password').value = '';
                
                showToast('Account created successfully!', 'success');
                
                // Create initial user settings
                const userId = userCredential.user.uid;
                database.ref(`users/${userId}/settings`).set({
                    theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
                    notifications: false
                });
            })
            .catch((error) => {
                showToast(`Signup failed: ${error.message}`, 'error');
            })
            .finally(() => {
                // Reset button state
                signupButton.innerHTML = 'Sign Up';
                signupButton.disabled = false;
            });
    });

    // Logout functionality
    const logoutHandler = () => {
        auth.signOut()
            .then(() => {
                showToast('Logged out successfully', 'success');
            })
            .catch((error) => {
                showToast(`Logout failed: ${error.message}`, 'error');
            });
    };
    
    if (logoutButton) logoutButton.addEventListener('click', logoutHandler);
    if (profileLogoutButton) profileLogoutButton.addEventListener('click', logoutHandler);

    // Auth state change listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            
            // Set user email in profile
            if (profileEmail) {
                profileEmail.textContent = user.email;
            }
            
            // Load user settings
            database.ref(`users/${user.uid}/settings`).once('value')
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const settings = snapshot.val();
                        
                        // Apply theme
                        if (settings.theme === 'dark') {
                            document.body.classList.add('dark-theme');
                            const themeToggles = [
                                document.getElementById('theme-toggle'),
                                document.getElementById('profile-theme-toggle')
                            ];
                            themeToggles.forEach(toggle => {
                                if (toggle) toggle.checked = true;
                            });
                        }
                        
                        // Apply other settings
                        const notificationsToggle = document.getElementById('notifications-toggle');
                        if (notificationsToggle && settings.notifications !== undefined) {
                            notificationsToggle.checked = settings.notifications;
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error loading user settings:', error);
                });
            
            // Load today's entries
            const today = new Date();
            const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            loadEntries(user.uid, dateString);
            
            // Update calendar with entry dates
            updateCalendarWithEntries(user.uid, today.getFullYear(), today.getMonth() + 1);
        } else {
            // User is signed out
            appContainer.style.display = 'none';
            authContainer.style.display = 'flex';
            
            // Show login form by default
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            
            // Animate login form elements
            setTimeout(() => {
                const animateItems = loginForm.querySelectorAll('.animate-item');
                animateItems.forEach((item, index) => {
                    item.style.setProperty('--item-index', index);
                    item.classList.add('slide-in');
                });
            }, 100);
        }
    });
    
    // Social login buttons (placeholders for future functionality)
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Social login will be available soon!', 'info');
        });
    });
    
    // Handle Enter key for form submission
    document.getElementById('login-password').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });
    
    document.getElementById('signup-confirm-password').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            signupButton.click();
        }
    });
});

// Helper function to show toast notifications
function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Remove after animation completes
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}
