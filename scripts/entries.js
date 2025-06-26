// Entries functionality for Your Digital Flow app
let allUserEntries = {}; // Cache for user entries
let currentFilterMood = null;
let currentFilterTags = [];
let currentSearchQuery = '';

// Initialize entries functionality
document.addEventListener('DOMContentLoaded', () => {
    // Entry form buttons in mobile panel
    const saveEntryBtn = document.getElementById('save-entry');
    saveEntryBtn.addEventListener('click', () => saveEntry('panel'));
    
    // Entry form buttons in desktop modal
    const modalSaveEntryBtn = document.getElementById('modal-save-entry');
    modalSaveEntryBtn.addEventListener('click', () => saveEntry('modal'));
    
    // Mood selector buttons
    setupMoodSelectors('panel');
    setupMoodSelectors('modal');
    
    // Export buttons functionality
    document.getElementById('export-day').addEventListener('click', () => exportEntries('day'));
    document.getElementById('export-month').addEventListener('click', () => exportEntries('month'));
    document.getElementById('profile-export-day').addEventListener('click', () => exportEntries('day'));
    document.getElementById('profile-export-month').addEventListener('click', () => exportEntries('month'));
    
    // Setup filter functionality
    setupFilterButtons();
    
    // Search functionality
    setupSearchFunctionality();
});

// Load user entries for a specific date
function loadEntries(userId, dateString) {
    const entriesContainer = document.getElementById('entries-container');
    const emptyState = document.getElementById('empty-state');
    
    // Reference to entries for the specific date
    const dateEntriesRef = database.ref(`users/${userId}/entries/${dateString}`);
    
    // Clear existing entries
    entriesContainer.innerHTML = '';
    
    // Show loading state
    entriesContainer.innerHTML = '<div class="loading">Loading entries...</div>';
    
    // Fetch entries
    dateEntriesRef.once('value', (snapshot) => {
        // Clear loading state
        entriesContainer.innerHTML = '';
        
        if (snapshot.exists()) {
            // Sort entries by time
            const entries = [];
            snapshot.forEach((childSnapshot) => {
                const timeKey = childSnapshot.key;
                const entryData = childSnapshot.val();
                entries.push({
                    time: timeKey,
                    ...entryData
                });
            });
            
            // Sort by time (earliest first)
            entries.sort((a, b) => a.time.localeCompare(b.time));
            
            // Apply current filters
            let filteredEntries = entries;
            
            if (currentFilterMood) {
                filteredEntries = filteredEntries.filter(entry => entry.mood === currentFilterMood);
            }
            
            if (currentFilterTags.length > 0) {
                filteredEntries = filteredEntries.filter(entry => {
                    if (!entry.tags) return false;
                    return currentFilterTags.some(tag => entry.tags.includes(tag));
                });
            }
            
            if (currentSearchQuery) {
                const query = currentSearchQuery.toLowerCase();
                filteredEntries = filteredEntries.filter(entry => {
                    const titleMatch = entry.title && entry.title.toLowerCase().includes(query);
                    const descMatch = entry.description && entry.description.toLowerCase().includes(query);
                    const tagMatch = entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query));
                    return titleMatch || descMatch || tagMatch;
                });
            }
            
            // Display entries or empty state
            if (filteredEntries.length > 0) {
                filteredEntries.forEach(entry => {
                    entriesContainer.appendChild(createEntryCard(entry));
                });
                emptyState.style.display = 'none';
            } else {
                // Show empty state or "no matches" message
                emptyState.style.display = 'block';
                if (currentFilterMood || currentFilterTags.length > 0 || currentSearchQuery) {
                    emptyState.innerHTML = `
                        <div class="empty-state-icon">
                            <i class="material-icons">search</i>
                        </div>
                        <h3>No matching entries</h3>
                        <p>Try adjusting your filters or search</p>
                    `;
                } else {
                    emptyState.innerHTML = `
                        <div class="empty-state-icon">
                            <i class="material-icons">book</i>
                        </div>
                        <h3>No entries for this day</h3>
                        <p>Add your first diary entry by clicking the + button below</p>
                    `;
                }
            }
        } else {
            // No entries for this date
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="empty-state-icon">
                    <i class="material-icons">book</i>
                </div>
                <h3>No entries for this day</h3>
                <p>Add your first diary entry by clicking the + button below</p>
            `;
        }
    }).catch(error => {
        console.error('Error loading entries:', error);
        entriesContainer.innerHTML = `<div class="error">Error loading entries: ${error.message}</div>`;
    });
    
    // Update all tag filters
    updateTagFilters(userId);
}

// Create an entry card element
function createEntryCard(entry) {
    const entryCard = document.createElement('div');
    entryCard.className = 'entry-card';
    
    // Apply different styling based on mood
    if (entry.mood) {
        const moodClass = getMoodClass(entry.mood);
        if (moodClass) {
            entryCard.classList.add(`mood-${moodClass}`);
        }
    }
    
    // Format the time (convert 24h to 12h format)
    const timeFormatted = formatTime(entry.time);
    
    // Truncate description if it's too long
    const description = entry.description || '';
    const truncatedDescription = description.length > 250 ? 
        `${description.substring(0, 250)}...` : description;
    
    // Create HTML for entry card with enhanced formatting
    entryCard.innerHTML = `
        <div class="entry-header">
            <h3 class="entry-title">${entry.title || 'Untitled Entry'}</h3>
            <span class="entry-time">
                <i class="material-icons">schedule</i> ${timeFormatted}
            </span>
        </div>
        <p class="entry-description">${truncatedDescription}</p>
        <div class="entry-mood">${entry.mood || ''}</div>
        <div class="entry-tags">
            ${entry.tags ? entry.tags.map(tag => `<span class="entry-tag">${tag}</span>`).join('') : ''}
        </div>
        <div class="entry-actions">
            <button class="btn-icon view-full" title="View Full Entry">
                <i class="material-icons">visibility</i>
            </button>
            <button class="btn-icon edit-entry-btn" title="Edit Entry">
                <i class="material-icons">edit</i>
            </button>
            <button class="btn-icon delete-entry-btn" title="Delete Entry">
                <i class="material-icons">delete</i>
            </button>
        </div>
    `;
    
    // Store the entry data as a data attribute for edit and delete operations
    entryCard.setAttribute('data-entry', JSON.stringify({
        ...entry,
        date: getCurrentDateString() // Make sure date is included for database operations
    }));
    
    // Add event listeners for entry actions
    const viewBtn = entryCard.querySelector('.view-full');
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            showEntryDetail(entry);
        });
    }
    
    return entryCard;
}

// Get mood class for styling
function getMoodClass(mood) {
    if (mood.includes('Happy') || mood.includes('😊')) return 'happy';
    if (mood.includes('Sad') || mood.includes('😢')) return 'sad';
    if (mood.includes('Angry') || mood.includes('😠')) return 'angry';
    if (mood.includes('Tired') || mood.includes('😴')) return 'tired';
    if (mood.includes('Relaxed') || mood.includes('😌')) return 'relaxed';
    return '';
}

// Show entry detail in a modal
function showEntryDetail(entry) {
    // Create modal for entry details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'entry-detail-modal';
    modal.classList.add('active');
    
    // Format the time (convert 24h to 12h format)
    const timeFormatted = formatTime(entry.time);
    
    // Format the date
    let dateFormatted = entry.date;
    try {
        const [year, month, day] = entry.date.split('-');
        const dateObj = new Date(year, month - 1, day);
        dateFormatted = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (e) {
        console.error('Error formatting date:', e);
    }
    
    modal.innerHTML = `
        <div class="modal-content entry-detail-modal">
            <div class="modal-header">
                <h3>${entry.title || 'Untitled Entry'}</h3>
                <button class="btn-icon" id="close-detail-modal">
                    <i class="material-icons">close</i>
                </button>
            </div>
            <div class="entry-detail">
                <div class="entry-meta">
                    <div class="meta-item">
                        <i class="material-icons">event</i>
                        <span>${dateFormatted}</span>
                    </div>
                    <div class="meta-item">
                        <i class="material-icons">schedule</i>
                        <span>${timeFormatted}</span>
                    </div>
                    ${entry.mood ? `
                        <div class="meta-item">
                            <span class="mood-indicator">${entry.mood}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="entry-content">
                    <p>${entry.description || 'No description provided.'}</p>
                </div>
                
                ${entry.tags && entry.tags.length > 0 ? `
                    <div class="entry-tags detail-tags">
                        ${entry.tags.map(tag => `<span class="entry-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="entry-actions detail-actions">
                    <button class="btn btn-outline btn-sm edit-detail-btn">
                        <i class="material-icons">edit</i> Edit
                    </button>
                    <button class="btn btn-outline btn-sm btn-danger delete-detail-btn">
                        <i class="material-icons">delete</i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add to the DOM
    document.body.appendChild(modal);
    
    // Setup close button
    const closeBtn = document.getElementById('close-detail-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Setup edit button
    const editBtn = modal.querySelector('.edit-detail-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editEntry({
                ...entry,
                date: entry.date || getCurrentDateString()
            });
            document.body.removeChild(modal);
        });
    }
    
    // Setup delete button
    const deleteBtn = modal.querySelector('.delete-detail-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            showDeleteConfirmation({
                ...entry,
                date: entry.date || getCurrentDateString()
            });
            document.body.removeChild(modal);
        });
    }
}

// Edit an existing entry
function editEntry(entry) {
    // Create modal for editing
    const modal = document.createElement('div');
    modal.className = 'modal edit-entry-modal active';
    
    // Prepare tags for input (convert array to comma-separated)
    const tagsString = entry.tags ? entry.tags.join(', ') : '';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Entry</h3>
                <button class="btn-icon close-edit-modal">
                    <i class="material-icons">close</i>
                </button>
            </div>
            <div class="edit-form">
                <div class="form-group">
                    <label for="edit-entry-title">Title <span class="required">*</span></label>
                    <input type="text" id="edit-entry-title" value="${entry.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="edit-entry-time">Time <span class="recommended">recommended</span></label>
                    <input type="time" id="edit-entry-time" value="${entry.time || ''}">
                    <div class="form-hint">Time format: HH:MM (24-hour)</div>
                </div>
                <div class="form-group">
                    <label for="edit-entry-mood">Mood <span class="recommended">recommended</span></label>
                    <div class="mood-selector edit-mood-selector">
                        <button type="button" class="mood-btn" data-mood="Happy 😊" ${entry.mood === 'Happy 😊' ? 'data-selected="true"' : ''}>😊</button>
                        <button type="button" class="mood-btn" data-mood="Relaxed 😌" ${entry.mood === 'Relaxed 😌' ? 'data-selected="true"' : ''}>😌</button>
                        <button type="button" class="mood-btn" data-mood="Sad 😢" ${entry.mood === 'Sad 😢' ? 'data-selected="true"' : ''}>😢</button>
                        <button type="button" class="mood-btn" data-mood="Angry 😠" ${entry.mood === 'Angry 😠' ? 'data-selected="true"' : ''}>😠</button>
                        <button type="button" class="mood-btn" data-mood="Tired 😴" ${entry.mood === 'Tired 😴' ? 'data-selected="true"' : ''}>😴</button>
                    </div>
                    <input type="hidden" id="edit-selected-mood" value="${entry.mood || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-entry-description">Description</label>
                    <textarea id="edit-entry-description" rows="5">${entry.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="edit-entry-tags">Tags <span class="form-hint">(comma or space separated)</span></label>
                    <input type="text" id="edit-entry-tags" value="${tagsString}">
                    <div class="form-hint">Example: work, important, idea</div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-cancel" id="cancel-edit">Cancel</button>
                    <button type="button" class="btn btn-primary" id="save-edit">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(modal);
    
    // Set up mood selector in the edit form
    const moodButtons = modal.querySelectorAll('.edit-mood-selector .mood-btn');
    const selectedMoodInput = document.getElementById('edit-selected-mood');
    
    moodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove selected class from all buttons
            moodButtons.forEach(b => b.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Update hidden input
            selectedMoodInput.value = this.getAttribute('data-mood');
        });
        
        // Set initially selected button
        if (btn.getAttribute('data-selected') === 'true') {
            btn.classList.add('selected');
        }
    });
    
    // Add close functionality
    const closeBtn = modal.querySelector('.close-edit-modal');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    const cancelBtn = document.getElementById('cancel-edit');
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add save functionality
    const saveBtn = document.getElementById('save-edit');
    saveBtn.addEventListener('click', () => {
        // Get edited values
        const editedTitle = document.getElementById('edit-entry-title').value.trim();
        const editedDescription = document.getElementById('edit-entry-description').value.trim();
        let editedTime = document.getElementById('edit-entry-time').value;
        const editedMood = document.getElementById('edit-selected-mood').value;
        const editedTagsText = document.getElementById('edit-entry-tags').value.trim();
        
        // Basic validation
        if (!editedTitle) {
            showToast('Please enter a title', 'error');
            return;
        }
        
        if (!editedTime) {
            // Use original time if not provided
            editedTime = entry.time;
        }
        
        // Process tags
        let editedTags = [];
        if (editedTagsText) {
            editedTags = editedTagsText.split(/[\s,]+/)
                .filter(tag => tag.trim() !== '')
                .map(tag => tag.trim())
                // Remove duplicates
                .filter((tag, index, self) => self.indexOf(tag) === index);
        }
        
        // Create updated entry object
        const updatedEntry = {
            title: editedTitle,
            description: editedDescription,
            time: editedTime,
            mood: editedMood,
            tags: editedTags,
            updatedAt: Date.now() // Add timestamp for the update
        };
        
        // Save the updated entry
        updateEntry(entry, updatedEntry);
        
        // Close modal
        document.body.removeChild(modal);
    });
    
    // Close when clicking outside
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Update an entry in the database
function updateEntry(originalEntry, updatedEntry) {
    const userId = firebase.auth().currentUser.uid;
    if (!userId) {
        showToast('You must be logged in to update entries', 'error');
        return;
    }
    
    // Get current date
    const currentDate = document.getElementById('selected-date').dataset.date;
    
    if (!currentDate) {
        showToast('Date not selected', 'error');
        return;
    }
    
    // Show loading indicator
    document.getElementById('loading').classList.add('active');
    
    // Reference to the specific entry
    const entryRef = database.ref(`users/${userId}/entries/${currentDate}/${originalEntry.id}`);
    
    // Update the entry in Firebase
    entryRef.update(updatedEntry)
        .then(() => {
            // Hide loading indicator
            document.getElementById('loading').classList.remove('active');
            
            // Show success message
            showToast('Entry updated successfully', 'success');
            
            // Reload entries to reflect changes
            loadEntries(userId, currentDate);
        })
        .catch((error) => {
            console.error('Error updating entry:', error);
            
            // Hide loading indicator
            document.getElementById('loading').classList.remove('active');
            
            // Show error message
            showToast('Failed to update entry: ' + error.message, 'error');
        });
}

// Delete an entry from the database
function deleteEntry(entry) {
    const userId = firebase.auth().currentUser.uid;
    if (!userId) {
        showToast('You must be logged in to delete entries', 'error');
        return;
    }
    
    // Get current date
    const currentDate = document.getElementById('selected-date').dataset.date;
    
    if (!currentDate) {
        showToast('Date not selected', 'error');
        return;
    }
    
    // Show loading indicator
    document.getElementById('loading').classList.add('active');
    
    // Reference to the specific entry
    const entryRef = database.ref(`users/${userId}/entries/${currentDate}/${entry.id}`);
    
    // Delete the entry from Firebase
    entryRef.remove()
        .then(() => {
            // Hide loading indicator
            document.getElementById('loading').classList.remove('active');
            
            // Show success message
            showToast('Entry deleted successfully', 'success');
            
            // Reload entries to reflect changes
            loadEntries(userId, currentDate);
        })
        .catch((error) => {
            console.error('Error deleting entry:', error);
            
            // Hide loading indicator
            document.getElementById('loading').classList.remove('active');
            
            // Show error message
            showToast('Failed to delete entry: ' + error.message, 'error');
        });
}

// Save a new entry (from either mobile panel or desktop modal)
function saveEntry(source) {
    // Determine which form elements to use based on source
    const prefix = source === 'modal' ? 'modal-' : '';
    const titleInput = document.getElementById(`${prefix}entry-title`);
    const descriptionInput = document.getElementById(`${prefix}entry-description`);
    const timeInput = document.getElementById(`${prefix}entry-time`);
    const selectedMoodInput = document.getElementById(`${prefix}selected-mood`);
    const tagsInput = document.getElementById(`${prefix}entry-tags`);
    
    // Get form values
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    let time = timeInput.value;
    const mood = selectedMoodInput.value;
    const tagsText = tagsInput.value.trim();
    
    // Basic validation
    if (!title) {
        showToast('Please enter a title', 'error');
        return;
    }
    
    if (!time) {
        // Use current time if not provided
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        time = `${hours}:${minutes}`;
    }
    
    // Process tags (convert space or comma separated tags to array)
    let tags = [];
    if (tagsText) {
        // Split by spaces or commas
        tags = tagsText.split(/[\s,]+/)
            // Filter out empty strings
            .filter(tag => tag.trim() !== '')
            // Ensure all tags start with #
            .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
    }
    
    // Get current user and selected date
    const user = auth.currentUser;
    if (!user) {
        showToast('You must be logged in to save entries', 'error');
        return;
    }
    
    // Get current date in YYYY-MM-DD format
    const dateString = getCurrentDateString();
    
    // Create entry data
    const entryData = {
        title,
        description,
        mood,
        tags
    };
    
    // Save to Firebase
    database.ref(`users/${user.uid}/entries/${dateString}/${time}`)
        .set(entryData)
        .then(() => {
            // Clear form
            titleInput.value = '';
            descriptionInput.value = '';
            timeInput.value = '';
            selectedMoodInput.value = '';
            tagsInput.value = '';
            
            // Reset mood buttons
            document.querySelectorAll(`.mood-btn`).forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Close panel or modal
            if (source === 'panel') {
                document.getElementById('entry-panel').classList.remove('active');
            } else {
                document.getElementById('entry-modal').classList.remove('active');
            }
            
            // Show success message
            showToast('Entry saved successfully', 'success');
            
            // Reload entries for current date
            loadEntries(user.uid, dateString);
            
            // Update calendar to mark this date as having entries
            markCalendarDatesWithEntries(user.uid);
        })
        .catch(error => {
            showToast(`Error saving entry: ${error.message}`, 'error');
        });
}

// Setup mood selector functionality
function setupMoodSelectors(source) {
    const prefix = source === 'modal' ? 'modal-' : '';
    const moodBtns = document.querySelectorAll(`#${prefix}entry-panel .mood-btn, #entry-modal .mood-btn`);
    const selectedMoodInput = document.getElementById(`${prefix}selected-mood`);
    
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove 'selected' class from all buttons
            moodBtns.forEach(b => b.classList.remove('selected'));
            
            // Add 'selected' class to clicked button
            btn.classList.add('selected');
            
            // Set the selected mood value
            selectedMoodInput.value = btn.getAttribute('data-mood');
        });
    });
}

// Format time from 24h to 12h format
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    let period = 'AM';
    let hours12 = parseInt(hours, 10);
    
    if (hours12 >= 12) {
        period = 'PM';
        if (hours12 > 12) {
            hours12 -= 12;
        }
    }
    
    if (hours12 === 0) {
        hours12 = 12;
    }
    
    return `${hours12}:${minutes} ${period}`;
}

// Setup filter functionality
function setupFilterButtons() {
    // Mood filters
    const moodFilters = document.querySelectorAll('.mood-filter');
    moodFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active class
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentFilterMood = null;
            } else {
                moodFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilterMood = btn.getAttribute('data-mood');
            }
            
            // Reload entries with filter
            if (auth.currentUser) {
                loadEntries(auth.currentUser.uid, getCurrentDateString());
            }
        });
    });
}

// Update tag filters based on user's entries
function updateTagFilters(userId) {
    const tagFiltersContainers = [
        document.getElementById('tag-filters'),
        document.getElementById('profile-tag-filters')
    ];
    
    // Get all user entries to extract tags
    database.ref(`users/${userId}/entries`).once('value', (snapshot) => {
        const allTags = new Set();
        
        if (snapshot.exists()) {
            // Iterate through all dates
            snapshot.forEach(dateSnapshot => {
                // Iterate through all entries for each date
                dateSnapshot.forEach(timeSnapshot => {
                    const entry = timeSnapshot.val();
                    if (entry.tags && Array.isArray(entry.tags)) {
                        entry.tags.forEach(tag => allTags.add(tag));
                    }
                });
            });
        }
        
        // Update tag filter containers
        tagFiltersContainers.forEach(container => {
            if (!container) return;
            
            container.innerHTML = '';
            
            if (allTags.size === 0) {
                container.innerHTML = '<span class="no-tags">No tags available</span>';
                return;
            }
            
            // Sort tags alphabetically
            const sortedTags = Array.from(allTags).sort();
            
            // Create tag filter buttons
            sortedTags.forEach(tag => {
                const tagBtn = document.createElement('button');
                tagBtn.className = 'tag-filter';
                tagBtn.textContent = tag;
                
                // Add active class if this tag is currently filtered
                if (currentFilterTags.includes(tag)) {
                    tagBtn.classList.add('active');
                }
                
                // Add click event for filtering
                tagBtn.addEventListener('click', () => {
                    tagBtn.classList.toggle('active');
                    
                    if (tagBtn.classList.contains('active')) {
                        // Add to filter
                        if (!currentFilterTags.includes(tag)) {
                            currentFilterTags.push(tag);
                        }
                    } else {
                        // Remove from filter
                        currentFilterTags = currentFilterTags.filter(t => t !== tag);
                    }
                    
                    // Reload entries with updated filters
                    if (auth.currentUser) {
                        loadEntries(auth.currentUser.uid, getCurrentDateString());
                    }
                });
                
                container.appendChild(tagBtn);
            });
        });
    });
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchInputs = [
        document.getElementById('desktop-search'),
        document.getElementById('profile-search')
    ];
    
    searchInputs.forEach(input => {
        if (!input) return;
        
        // Add input event listener with debounce
        let debounceTimeout;
        
        input.addEventListener('input', () => {
            // Clear existing timeout
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
            
            // Set new timeout
            debounceTimeout = setTimeout(() => {
                currentSearchQuery = input.value.trim();
                
                // Update other search input to match
                searchInputs.forEach(otherInput => {
                    if (otherInput !== input) {
                        otherInput.value = currentSearchQuery;
                    }
                });
                
                // Reload entries with search filter
                if (auth.currentUser) {
                    loadEntries(auth.currentUser.uid, getCurrentDateString());
                }
            }, 300); // 300ms debounce
        });
    });
}

// Export entries functionality
function exportEntries(scope) {
    const user = auth.currentUser;
    if (!user) {
        showToast('You must be logged in to export entries', 'error');
        return;
    }
    
    // Get selected date
    const dateString = getCurrentDateString();
    let exportRef;
    let filename;
    
    // Determine scope of export
    if (scope === 'day') {
        exportRef = database.ref(`users/${user.uid}/entries/${dateString}`);
        filename = `diary-entries-${dateString}`;
    } else { // month
        const [year, month] = dateString.split('-');
        const monthPrefix = `${year}-${month}`;
        exportRef = database.ref(`users/${user.uid}/entries`).orderByKey().startAt(monthPrefix).endAt(`${monthPrefix}-31`);
        filename = `diary-entries-${year}-${month}`;
    }
    
    // Get format preference
    const formatRadios = document.getElementsByName('export-format');
    let format = 'json'; // Default format
    
    for (const radio of formatRadios) {
        if (radio.checked) {
            format = radio.value;
            break;
        }
    }
    
    // Fetch entries
    exportRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            showToast('No entries to export', 'error');
            return;
        }
        
        let content;
        let mimeType;
        
        if (format === 'json') {
            // Export as JSON
            content = JSON.stringify(snapshot.val(), null, 2);
            mimeType = 'application/json';
            filename += '.json';
        } else { // txt
            // Export as formatted text
            content = formatEntriesAsText(snapshot.val(), scope === 'month');
            mimeType = 'text/plain';
            filename += '.txt';
        }
        
        // Create download link
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger download
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        showToast('Entries exported successfully', 'success');
    }).catch(error => {
        showToast(`Error exporting entries: ${error.message}`, 'error');
    });
}

// Format entries as text for TXT export
function formatEntriesAsText(entries, isMonth) {
    let text = 'YOUR DIGITAL FLOW - DIARY ENTRIES\n';
    text += '==================================\n\n';
    
    if (isMonth) {
        // Month export - organize by date
        Object.keys(entries).sort().forEach(date => {
            text += `DATE: ${formatDate(date)}\n`;
            text += '-----------------\n\n';
            
            const timeEntries = entries[date];
            formatDateEntries(timeEntries, text);
        });
    } else {
        // Single date export
        formatDateEntries(entries, text);
    }
    
    return text;
}

// Format entries for a single date
function formatDateEntries(timeEntries, text) {
    // Sort by time
    Object.keys(timeEntries).sort().forEach(time => {
        const entry = timeEntries[time];
        
        text += `TIME: ${formatTime(time)}\n`;
        text += `TITLE: ${entry.title || 'Untitled'}\n`;
        text += `MOOD: ${entry.mood || 'None'}\n`;
        text += `TAGS: ${entry.tags ? entry.tags.join(', ') : 'None'}\n`;
        text += `\n${entry.description || '(No description)'}\n`;
        text += '\n---------------------------\n\n';
    });
    
    return text;
}

// Format date for display (YYYY-MM-DD to Month DD, YYYY)
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}
