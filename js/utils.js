/**
 * Utils.js
 * Helper functions for date formatting, image processing, and other utility functions
 */

const Utils = {
    /**
     * Format a date object into YYYY-MM-DD string
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Format a date object into a readable format (e.g., June 23, 2023)
     * @param {Date} date - The date to format
     * @returns {string} Human-readable date string
     */
    formatReadableDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Parse YYYY-MM-DD string into a Date object
     * @param {string} dateString - The date string to parse
     * @returns {Date} Date object
     */
    parseDate(dateString) {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day);
    },

    /**
     * Get first day of the month for a given date
     * @param {Date} date - The date to get the first day of the month for
     * @returns {Date} First day of the month
     */
    getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },

    /**
     * Get last day of the month for a given date
     * @param {Date} date - The date to get the last day of the month for
     * @returns {Date} Last day of the month
     */
    getLastDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    },

    /**
     * Get all days in a month including padding days from previous/next month
     * @param {Date} date - Current month/year
     * @returns {Array} Array of date objects for calendar
     */
    getCalendarDays(date) {
        const firstDay = this.getFirstDayOfMonth(date);
        const lastDay = this.getLastDayOfMonth(date);
        const days = [];
        
        // Add previous month's days
        const prevMonthDays = firstDay.getDay();
        const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const prevMonthLastDay = this.getLastDayOfMonth(prevMonth).getDate();
        
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const prevDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthLastDay - i);
            days.push({
                date: prevDate,
                isPadding: true,
                isToday: this.isSameDay(prevDate, new Date()),
                dateString: this.formatDate(prevDate)
            });
        }
        
        // Add current month's days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
            days.push({
                date: currentDate,
                isPadding: false,
                isToday: this.isSameDay(currentDate, new Date()),
                dateString: this.formatDate(currentDate)
            });
        }
        
        // Add next month's days to fill the grid (6 rows x 7 days = 42 total)
        const nextMonthDays = 42 - days.length;
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        
        for (let i = 1; i <= nextMonthDays; i++) {
            const nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
            days.push({
                date: nextDate,
                isPadding: true,
                isToday: this.isSameDay(nextDate, new Date()),
                dateString: this.formatDate(nextDate)
            });
        }
        
        return days;
    },

    /**
     * Check if two dates are the same day
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if dates are the same day
     */
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    },

    /**
     * Convert an image file to a compressed base64 data URI
     * @param {File} file - The image file to convert
     * @param {number} maxWidth - Maximum width of the image
     * @param {number} maxHeight - Maximum height of the image
     * @param {number} quality - JPEG quality (0-1)
     * @returns {Promise<string>} Base64 data URI
     */
    imageToBase64(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                
                img.onload = function() {
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    // Create canvas for resizing
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress image
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to base64 data URI with compression
                    const dataURI = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataURI);
                };
                
                img.onerror = function() {
                    reject(new Error('Failed to load image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    },

    /**
     * Show loading spinner
     */
    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    },

    /**
     * Hide loading spinner
     */
    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    },

    /**
     * Split a comma-separated string into an array of trimmed tags
     * @param {string} tagsString - Comma-separated tags
     * @returns {Array} Array of trimmed tags
     */
    parseTags(tagsString) {
        if (!tagsString || tagsString.trim() === '') {
            return [];
        }
        
        return tagsString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
    },

    /**
     * Join an array of tags into a comma-separated string
     * @param {Array} tagsArray - Array of tags
     * @returns {string} Comma-separated string
     */
    joinTags(tagsArray) {
        if (!tagsArray || !Array.isArray(tagsArray)) {
            return '';
        }
        
        return tagsArray.join(', ');
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID string
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Truncate a string to a maximum length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substr(0, maxLength) + '...';
    },    /**
     * Toggle dark/light theme with animation effects
     */
    toggleTheme() {
        // Add transition effect to body for smooth theme change
        document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
        
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Update theme toggle button icon with animation
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            // Add rotation animation
            themeToggle.style.animation = 'rotate 0.5s ease-in-out';
            
            // After animation completes, update the icon
            setTimeout(() => {
                themeToggle.innerHTML = isDarkMode ? 
                    '<i class="fas fa-sun"></i>' : 
                    '<i class="fas fa-moon"></i>';
                themeToggle.style.animation = '';
            }, 250);
            
            // Notify user of theme change with a subtle animation on relevant elements
            const elements = document.querySelectorAll('.timeline-note, .calendar-day, .note-form, .modal-content');
            elements.forEach(el => {
                el.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    el.style.animation = '';
                }, 500);
            });
        }
    },/**     * Initialize theme based on localStorage preference or default to light theme
     */    initTheme() {
        const storedTheme = localStorage.getItem('darkMode');
        
        // Default to light theme unless explicitly set to dark
        const isDarkMode = storedTheme === 'true';
        
        // Apply theme - always default to light theme if no preference is set
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            // Ensure dark mode is removed (just to be safe)
            document.body.classList.remove('dark-mode');
            // Make sure we always set light mode as default in storage
            localStorage.setItem('darkMode', 'false');
        }
        
        // Update theme toggle button icon with animation
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = isDarkMode ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
            
            // Add a subtle animation to the theme toggle on page load
            themeToggle.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                themeToggle.style.animation = '';
            }, 500);
        }
    },/**
     * Show an error message to the user
     * @param {string} message - Error message to display
     * @param {string} elementId - ID of element to display error in
     */
    showError(message, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    },

    /**
     * Clear an error message
     * @param {string} elementId - ID of element to clear
     */
    clearError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.classList.add('hidden');
        }
    },
    
    /**
     * Show a success message to the user
     * @param {string} message - Success message to display
     * @param {string} elementId - ID of element to display success in
     */
    showSuccess(message, elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    },

    /**
     * Clear a success message
     * @param {string} elementId - ID of element to clear
     */
    clearSuccess(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.classList.add('hidden');
        }
    },
    
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast ('success', 'error', 'info')
     * @param {number} duration - Duration in milliseconds
     */
    showToast(message, type = 'info', duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '1000';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        toast.style.padding = '12px 20px';
        toast.style.marginBottom = '10px';
        toast.style.borderRadius = 'var(--border-radius)';
        toast.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.15)';
        toast.style.backgroundColor = type === 'success' ? '#2ecc71' : 
                                    type === 'error' ? 'var(--danger-color)' : 
                                    'var(--primary-color)';
        toast.style.color = '#fff';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, duration);
    },    /**
     * Export data as JSON file for download
     * @param {Object} data - Data to export
     * @param {string} filename - Filename for download
     */
    exportToJson(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    
    /**
     * Convert an image file to Base64, compress and resize it
     * @param {File} file - The image file to convert
     * @returns {Promise<string>} Base64 data URI
     */
    convertImageToBase64(file) {
        return this.imageToBase64(file, 500, 500, 0.7);
    },
    
    /**
     * Compress an existing Base64 image
     * @param {string} base64 - Base64 string to compress
     * @returns {Promise<string>} Compressed Base64 string
     */
    compressImage(base64) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxWidth = 500;
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress with quality of 0.7 (70%)
                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressed);
            };
            
            img.onerror = function() {
                reject(new Error('Failed to load image for compression'));
            };
            
            img.src = base64;
        });
    },
    
    /**
     * Sort notes by their time field
     * @param {Array} notes - Array of note objects with time property
     * @returns {Array} Sorted array of notes
     */
    sortNotesByTime(notes) {
        return [...notes].sort((a, b) => {
            // Default to "00:00" if time is not specified
            const timeA = a.data.time || "00:00";
            const timeB = b.data.time || "00:00";
            
            return timeA.localeCompare(timeB);
        });
    },
    
    /**
     * Format time string (HH:MM) to display format (e.g., "07:30 AM")
     * @param {string} timeString - Time string in HH:MM format
     * @returns {string} Formatted time string
     */
    formatTimeForDisplay(timeString) {
        if (!timeString) return '';
        
        // Convert 24-hour format to 12-hour with AM/PM
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12; // Convert 0 to 12
        
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    },
    
    /**
     * Get emoji for a mood
     * @param {string} mood - Mood name
     * @returns {string} Emoji character
     */
    getMoodEmoji(mood) {
        switch (mood?.toLowerCase()) {
            case 'happy': return '😊';
            case 'sad': return '😔';
            case 'neutral': return '😐';
            case 'excited': return '🤩';
            case 'tired': return '😴';
            case 'calm': return '😌';
            default: return '';
        }
    },    /**
     * Apply animation to an element
     * @param {HTMLElement} element - The element to animate
     * @param {string} animationName - Name of the animation (fadeIn, slideIn, etc.)
     * @param {number} duration - Duration in milliseconds
     * @param {number} delay - Delay in milliseconds
     * @param {Function} callback - Optional callback when animation ends
     */
    animateElement(element, animationName, duration = 500, delay = 0, callback = null) {
        if (!element) return;
        
        element.style.animation = '';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.animation = `${animationName} ${duration}ms ease forwards`;
              if (callback) {
                setTimeout(callback, duration);
            }
        }, delay);
    },
    
    /**
     * Apply staggered animations to a group of elements
     * @param {NodeList|Array} elements - The elements to animate
     * @param {string} animationName - Name of the animation
     * @param {number} duration - Duration in milliseconds
     * @param {number} staggerDelay - Delay between each element in milliseconds
     */
    animateElements(elements, animationName, duration = 500, staggerDelay = 100) {
        if (!elements || !elements.length) return;
          Array.from(elements).forEach((element, index) => {
            this.animateElement(element, animationName, duration, index * staggerDelay);
        });
    },
    
    /**
     * Check if the current device is a mobile device
     * @returns {boolean} True if mobile device
     */
    isMobileDevice() {
        return window.innerWidth <= 768;
    },
    
    /**
     * Check if the device is very small (like iPhone SE)
     * @returns {boolean} True if very small device
     */
    isVerySmallDevice() {
        return window.innerWidth <= 375;
    },
    
    /**
     * Initialize mobile responsiveness enhancements
     */
    initMobileResponsiveness() {
        // Check if mobile and add necessary classes
        if (this.isMobileDevice()) {
            document.body.classList.add('mobile-device');
            
            // Adjust calendar height on mobile
            const calendarContainer = document.querySelector('.calendar-container');
            if (calendarContainer) {
                calendarContainer.style.maxHeight = this.isVerySmallDevice() ? '250px' : '280px';
            }
            
            // Handle user email display on mobile
            const userEmailEl = document.getElementById('user-email');
            if (userEmailEl) {
                const email = userEmailEl.textContent;
                if (email && email.includes('@') && this.isVerySmallDevice()) {
                    userEmailEl.textContent = email.split('@')[0];
                }
            }
        }
        
        // Add resize listener to adjust UI on orientation change
        window.addEventListener('resize', () => {
            if (this.isMobileDevice()) {
                document.body.classList.add('mobile-device');
            } else {
                document.body.classList.remove('mobile-device');
            }
            
            // Re-calculate calendar day sizes on resize
            this.adjustCalendarDays();
        });
        
        // Initialize first load adjustments
        this.adjustCalendarDays();
    },
    
    /**
     * Adjust calendar days size to maintain aspect ratio
     */
    adjustCalendarDays() {
        const days = document.querySelectorAll('.day');
        if (!days.length) return;
        
        // For very small devices, make calendar smaller
        if (this.isVerySmallDevice()) {
            days.forEach(day => {
                day.style.fontSize = '0.6rem';
            });
        }
    },
};

// Make Utils available globally instead of using export
window.Utils = Utils;
