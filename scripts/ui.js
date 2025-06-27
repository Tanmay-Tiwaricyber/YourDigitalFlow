// UI interactions and responsive behavior
document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation
    setupMobileNavigation();
    
    // Desktop add entry button
    const desktopAddEntryBtn = document.getElementById('desktop-add-entry');
    desktopAddEntryBtn.addEventListener('click', () => {
        const modal = document.getElementById('entry-modal');
        modal.classList.add('active');
        
        // Add animation to modal elements
        setTimeout(() => {
            const modalElements = modal.querySelectorAll('.animate-item');
            modalElements.forEach((element, index) => {
                element.style.setProperty('--item-index', index);
                element.classList.add('slide-in');
            });
        }, 100);
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
    
    // Theme toggle functionality
    setupThemeToggle();
    
    // Enhanced form interactions
    setupFormInteractions();
    
    // Setup tooltips
    setupTooltips();
    
    // Animate entry cards
    animateEntryCards();
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
            
            // Add ripple effect
            addRippleEffect(button);
            
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
                    
                    // Animate form elements
                    setTimeout(() => {
                        const formElements = entryPanel.querySelectorAll('.animate-item');
                        formElements.forEach((element, index) => {
                            element.style.setProperty('--item-index', index);
                            element.classList.add('slide-in');
                        });
                    }, 100);
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

// Add ripple effect to buttons
function addRippleEffect(element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
    ripple.style.left = (event.clientX - rect.left - ripple.offsetWidth / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - ripple.offsetHeight / 2) + 'px';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
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
        if (toggle) {
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
                    if (otherToggle && otherToggle !== toggle) {
                        otherToggle.checked = toggle.checked;
                    }
                });
            });
        }
    });
}

// Setup enhanced form interactions
function setupFormInteractions() {
    // Focus effect for input fields
    const inputFields = document.querySelectorAll('input, textarea, select');
    inputFields.forEach(field => {
        field.addEventListener('focus', () => {
            field.parentElement.classList.add('focused');
        });
        
        field.addEventListener('blur', () => {
            field.parentElement.classList.remove('focused');
            
            // Add 'filled' class if the field has a value
            if (field.value.trim() !== '') {
                field.parentElement.classList.add('filled');
            } else {
                field.parentElement.classList.remove('filled');
            }
        });
        
        // Initial check for pre-filled fields
        if (field.value.trim() !== '') {
            field.parentElement.classList.add('filled');
        }
    });
    
    // Character counter for textareas
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
        const maxLength = textarea.getAttribute('maxlength');
        const counterEl = document.createElement('div');
        counterEl.className = 'char-counter';
        counterEl.textContent = `0/${maxLength}`;
        
        textarea.parentElement.appendChild(counterEl);
        
        textarea.addEventListener('input', () => {
            const currentLength = textarea.value.length;
            counterEl.textContent = `${currentLength}/${maxLength}`;
            
            // Add warning class if getting close to max
            if (currentLength > maxLength * 0.9) {
                counterEl.classList.add('warning');
            } else {
                counterEl.classList.remove('warning');
            }
        });
    });
}

// Setup tooltips
function setupTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', () => {
            const tooltipText = trigger.getAttribute('data-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            
            document.body.appendChild(tooltip);
            
            const triggerRect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            tooltip.style.top = `${triggerRect.top - tooltipRect.height - 10}px`;
            tooltip.style.left = `${triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)}px`;
            
            tooltip.classList.add('visible');
        });
        
        trigger.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.tooltip.visible');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

// Animate entry cards
function animateEntryCards() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.setProperty('--item-index', index % 10);
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all entry cards
    document.querySelectorAll('.entry-card').forEach(card => {
        observer.observe(card);
    });
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const iconMap = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <span class="material-icons">${iconMap[type] || 'info'}</span>
        </div>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
        <div class="toast-close">
            <span class="material-icons">close</span>
        </div>
    `;
    
    // Add close functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('toast-closing');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    toastContainer.appendChild(toast);
    
    // Auto dismiss after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-closing');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}
