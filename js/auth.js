/**
 * Auth.js
 * Handles Firebase authentication: login, signup, logout, and auth state changes
 */

const Auth = {
    // Current user object
    currentUser: null,

    /**
     * Initialize auth listeners and UI elements
     */    init() {
        // Setup Firebase auth state change listener
        firebase.auth().onAuthStateChanged(user => this.handleAuthStateChanged(user));

        // Add event listeners for auth forms
        document.getElementById('login-form').addEventListener('submit', e => this.handleLogin(e));
        document.getElementById('signup-form').addEventListener('submit', e => this.handleSignup(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Add event listeners for tab switching
        document.getElementById('login-tab').addEventListener('click', () => this.switchAuthTab('login'));
        document.getElementById('signup-tab').addEventListener('click', () => this.switchAuthTab('signup'));
        
        // Check for URL parameters
        const params = new URLSearchParams(window.location.search);
        if (params.has('signupsuccess')) {
            this.switchAuthTab('login');
            Utils.showSuccess('Account created successfully! Please log in.', 'login-success');
            
            // Remove the parameter from URL without refreshing
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },/**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */    async handleLogin(e) {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Clear previous errors and success messages
        Utils.clearError('login-error');
        Utils.clearSuccess('login-success');
        
        // Validate inputs
        if (!email || !password) {
            Utils.showError('Please enter both email and password', 'login-error');
            return;
        }
        
        // Show loading spinner
        Utils.showLoading();
        
        try {
            // Attempt to sign in with Firebase
            await firebase.auth().signInWithEmailAndPassword(email, password);
            // Show temporary success message
            Utils.showSuccess('Login successful! Redirecting...', 'login-success');
            // Rest will be handled by the auth state change listener
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Failed to login. Please check your credentials.';
            
            // Handle specific Firebase auth errors
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address format';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            }
            
            Utils.showError(errorMessage, 'login-error');
            Utils.hideLoading();
        }
    },    /**
     * Handle signup form submission
     * @param {Event} e - Form submit event
     */    async handleSignup(e) {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        
        // Clear previous errors and success messages
        Utils.clearError('signup-error');
        Utils.clearSuccess('signup-success');
        
        // Validate inputs
        if (!email || !password) {
            Utils.showError('Please enter both email and password', 'signup-error');
            return;
        }
        
        if (password !== confirmPassword) {
            Utils.showError('Passwords do not match', 'signup-error');
            return;
        }
        
        if (password.length < 6) {
            Utils.showError('Password must be at least 6 characters', 'signup-error');
            return;
        }
        
        // Show loading spinner
        Utils.showLoading();
        
        try {
            // Attempt to create account with Firebase
            await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Show success message
            Utils.showSuccess('Account created successfully!', 'signup-success');
            
            // After a brief delay, sign out and redirect to login
            setTimeout(async () => {
                // Sign out the user
                await firebase.auth().signOut();
                
                // Redirect to login page with success parameter
                window.location.href = window.location.pathname + '?signupsuccess=true';
            }, 1500);
        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'Failed to create account';
            
            // Handle specific Firebase auth errors
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email address is already in use';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address format';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            }
            
            Utils.showError(errorMessage, 'signup-error');
            Utils.hideLoading();
        }
    },

    /**
     * Handle logout button click
     */
    async handleLogout() {
        try {
            Utils.showLoading();
            await firebase.auth().signOut();
            // Auth state change listener will handle redirect
        } catch (error) {
            console.error('Logout error:', error);
            Utils.hideLoading();
        }
    },    /**
     * Handle authentication state changes
     * @param {Object} user - Firebase user object
     */    handleAuthStateChanged(user) {
        Utils.hideLoading();
        
        if (user) {
            // User is signed in
            this.currentUser = user;
            
            // Update UI with user info
            document.getElementById('user-email').textContent = user.email;
            
            // Show main app, hide auth container
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('main-container').classList.remove('hidden');
            document.getElementById('bottom-nav').classList.remove('hidden');

            // Initialize in the correct order: first DB, then UI
            try {
                // Initialize database first
                const dbInitSuccess = DB.init(user.uid);
                
                if (dbInitSuccess) {
                    // Only initialize UI if DB was successful
                    UI.init();
                    
                    // Initialize profile elements
                    this.initProfileElements();
                } else {
                    console.error("Database initialization failed");
                    Utils.showToast("Failed to connect to database", "error");
                }
            } catch (error) {
                console.error("Error during initialization:", error);
                Utils.showToast("An error occurred during startup", "error");
            }
            
            // Check if this is a new login
            if (!this._hasShownWelcome) {
                this._hasShownWelcome = true;
                
                // Show welcome toast message with animation
                Utils.showToast(`Welcome, ${user.email}!`, 'success');
            }
        } else {
            // User is signed out
            this.currentUser = null;
            console.log('User signed out');
            
            // Show auth container, hide main app
            document.getElementById('auth-container').classList.remove('hidden');
            document.getElementById('main-container').classList.add('hidden');
            document.getElementById('bottom-nav').classList.add('hidden');

            // Reset forms
            document.getElementById('login-form').reset();
            document.getElementById('signup-form').reset();
            
            // Switch to login tab
            this.switchAuthTab('login');
        }
    },
    
    /**
     * Initialize profile elements and event listeners
     */
    initProfileElements() {        // Profile dropdown toggle with enhanced animations
        const profileBtn = document.querySelector('.profile-btn');
        const profileDropdown = document.querySelector('.profile-dropdown-content');
        const dropdownParent = document.querySelector('.profile-dropdown');
        
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            dropdownParent.classList.toggle('active');
            
            // Add avatar animation on click
            const avatar = profileBtn.querySelector('.profile-avatar');
            avatar.style.animation = 'pulse 0.5s ease';
            
            setTimeout(() => {
                avatar.style.animation = '';
            }, 500);
            
            if (profileDropdown.classList.contains('show')) {
                // Apply staggered animation to dropdown items
                const dropdownItems = profileDropdown.querySelectorAll('a');
                dropdownItems.forEach((item, index) => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(10px)';
                    
                    setTimeout(() => {
                        item.style.transition = 'all 0.3s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 50 * (index + 1));
                });
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            profileDropdown.classList.remove('show');
            dropdownParent.classList.remove('active');
        });
        
        // Profile view button
        document.getElementById('view-profile-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfileModal();
        });
        
        // Settings button
        document.getElementById('edit-profile-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSettingsModal();
        });
        
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('show');
                });
            });
        });
        
        // Save profile button
        document.getElementById('save-profile-btn').addEventListener('click', () => {
            this.saveProfileChanges();
        });
        
        // Theme switch in settings
        const themeSwitch = document.getElementById('theme-switch-checkbox');
        const themeLabel = document.getElementById('theme-label');
        
        // Set initial state based on current theme
        themeSwitch.checked = document.body.classList.contains('dark-mode');
        themeLabel.textContent = themeSwitch.checked ? 'Dark' : 'Light';
        
        // Add event listener
        themeSwitch.addEventListener('change', () => {
            Utils.toggleTheme();
            themeLabel.textContent = themeSwitch.checked ? 'Dark' : 'Light';
        });
          // Reset password button
        document.getElementById('reset-password-btn').addEventListener('click', () => {
            this.sendPasswordReset();
        });
        
        // Export all data button
        document.getElementById('export-all-btn').addEventListener('click', () => {
            UI.exportEntries();
        });
    },
    
    /**
     * Show the profile modal with user information
     */    showProfileModal() {
        if (!this.currentUser) return;
        
        const modal = document.getElementById('profile-modal');
        const modalContent = modal.querySelector('.modal-content');
        const emailField = document.getElementById('profile-email');
        const displayNameField = document.getElementById('profile-display-name');
        const createdField = document.getElementById('profile-created');
        const profileAvatar = modal.querySelector('.profile-avatar-large');
        
        // Fill in user information
        emailField.value = this.currentUser.email;
        displayNameField.value = this.currentUser.displayName || '';
        
        // Format creation time
        if (this.currentUser.metadata && this.currentUser.metadata.creationTime) {
            const creationDate = new Date(this.currentUser.metadata.creationTime);
            createdField.textContent = creationDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            createdField.textContent = 'N/A';
        }
        
        // Show modal with enhanced animation sequence
        modal.classList.add('show');
        
        // Animate modal components with a sequence
        setTimeout(() => {
            // Add entrance animation to the avatar
            if (profileAvatar) {
                profileAvatar.style.animation = 'scaleIn 0.5s ease forwards';
                profileAvatar.style.opacity = '0';
                profileAvatar.style.transform = 'scale(0.5)';
                
                setTimeout(() => {
                    profileAvatar.style.opacity = '1';
                    profileAvatar.style.transform = 'scale(1)';
                }, 100);
            }
            
            // Animate form fields one by one
            const formGroups = modal.querySelectorAll('.form-group');
            formGroups.forEach((group, index) => {
                group.style.opacity = '0';
                group.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    group.style.transition = 'all 0.3s ease';
                    group.style.opacity = '1';
                    group.style.transform = 'translateY(0)';
                }, 150 * (index + 1));
            });
        }, 300);
    },
    
    /**
     * Show the settings modal
     */    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('show');
        
        // Enhanced animations for settings modal
        const settingsSections = modal.querySelectorAll('.settings-section');
        
        // Animate settings sections with a staggered effect
        settingsSections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.4s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateX(0)';
            }, 100 * (index + 1));
            
            // Animate individual setting options within each section
            const settingOptions = section.querySelectorAll('.settings-item');
            settingOptions.forEach((option, optIndex) => {
                option.style.opacity = '0';
                option.style.transform = 'translateY(15px)';
                
                setTimeout(() => {
                    option.style.transition = 'all 0.3s ease';
                    option.style.opacity = '1';
                    option.style.transform = 'translateY(0)';
                }, 150 * (index + 1) + 100 * optIndex);
            });
        });
    },
    
    /**
     * Save profile changes
     */
    async saveProfileChanges() {
        if (!this.currentUser) return;
        
        const displayName = document.getElementById('profile-display-name').value.trim();
        
        try {
            Utils.showLoading();
            
            // Update display name
            await this.currentUser.updateProfile({
                displayName: displayName
            });
            
            Utils.hideLoading();
            Utils.showToast('Profile updated successfully!', 'success');
            
            // Close the modal
            document.getElementById('profile-modal').classList.remove('show');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            Utils.hideLoading();
            Utils.showToast('Failed to update profile', 'error');
        }
    },
    
    /**
     * Send password reset email
     */
    async sendPasswordReset() {
        if (!this.currentUser || !this.currentUser.email) return;
        
        try {
            Utils.showLoading();
            await firebase.auth().sendPasswordResetEmail(this.currentUser.email);
            Utils.hideLoading();
            Utils.showToast('Password reset email sent!', 'success');
        } catch (error) {
            console.error('Error sending password reset:', error);
            Utils.hideLoading();
            Utils.showToast('Failed to send password reset email', 'error');
        }
    },

    /**
     * Switch between login and signup tabs
     * @param {string} tab - Tab to activate ('login' or 'signup')
     */
    switchAuthTab(tab) {
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        
        // Clear any error messages
        Utils.clearError('login-error');
        Utils.clearError('signup-error');
        
        if (tab === 'login') {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginTab.classList.remove('active');
            signupTab.classList.add('active');
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
    },

    /**
     * Get the current user's ID
     * @returns {string|null} User ID or null if not signed in
     */
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    },

    /**     * Check if user is authenticated
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }
};

// Make Auth available globally
window.Auth = Auth;
