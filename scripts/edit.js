// Edit and Delete functionality for diary entries
let currentEditingEntry = null;

document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners for entry editing buttons
    setupEditFunctionality();
});

// Setup click handlers for edit and delete buttons
function setupEditFunctionality() {
    // Event delegation for edit buttons
    document.addEventListener('click', (event) => {
        // Handle edit button clicks
        if (event.target.closest('.edit-entry-btn')) {
            const entryCard = event.target.closest('.entry-card');
            if (entryCard) {
                const entryData = JSON.parse(entryCard.getAttribute('data-entry'));
                editEntry(entryData);
            }
        }
        
        // Handle delete button clicks
        if (event.target.closest('.delete-entry-btn')) {
            const entryCard = event.target.closest('.entry-card');
            if (entryCard) {
                const entryData = JSON.parse(entryCard.getAttribute('data-entry'));
                showDeleteConfirmation(entryData);
            }
        }
    });

    // Setup edit save button handlers
    document.getElementById('edit-save-entry').addEventListener('click', () => {
        saveEditedEntry();
    });

    document.getElementById('modal-edit-save-entry').addEventListener('click', () => {
        saveEditedEntry('modal');
    });
    
    // Setup delete confirmation buttons
    document.getElementById('confirm-delete').addEventListener('click', () => {
        if (currentEditingEntry) {
            deleteEntry(currentEditingEntry);
        }
        closeDeleteModal();
    });

    document.getElementById('cancel-delete').addEventListener('click', () => {
        closeDeleteModal();
    });
}

// Open edit modal/panel with entry data
function editEntry(entryData) {
    currentEditingEntry = entryData;
    const isMobile = window.innerWidth < 768;
    
    // Determine if we should use modal or panel
    const source = isMobile ? 'panel' : 'modal';
    const prefix = source === 'modal' ? 'modal-edit-' : 'edit-';
    
    // Populate form fields
    document.getElementById(`${prefix}entry-title`).value = entryData.title || '';
    document.getElementById(`${prefix}entry-description`).value = entryData.description || '';
    document.getElementById(`${prefix}entry-time`).value = entryData.time || '';
    
    // Set mood
    const moodBtns = document.querySelectorAll(`#${prefix}entry-panel .mood-btn, #edit-entry-modal .mood-btn`);
    moodBtns.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-mood') === entryData.mood) {
            btn.classList.add('selected');
            document.getElementById(`${prefix}selected-mood`).value = entryData.mood;
        }
    });
    
    // Set tags
    document.getElementById(`${prefix}entry-tags`).value = entryData.tags ? entryData.tags.join(' ') : '';
    
    // Show edit panel or modal
    if (isMobile) {
        document.getElementById('edit-entry-panel').classList.add('active');
    } else {
        document.getElementById('edit-entry-modal').classList.add('active');
    }
}

// Save the edited entry back to Firebase
function saveEditedEntry(source = 'panel') {
    if (!currentEditingEntry) return;
    
    const prefix = source === 'modal' ? 'modal-edit-' : 'edit-';
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
        time = currentEditingEntry.time;
    }
    
    // Process tags
    let tags = [];
    if (tagsText) {
        tags = tagsText.split(/[\s,]+/)
            .filter(tag => tag.trim() !== '')
            .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
    }
    
    // Get user and date
    const user = auth.currentUser;
    if (!user) {
        showToast('You must be logged in to edit entries', 'error');
        return;
    }
    
    const dateString = currentEditingEntry.date;
    const oldTime = currentEditingEntry.time;
    
    // Create updated entry data
    const entryData = {
        title,
        description,
        mood,
        tags,
        updatedAt: new Date().toISOString()
    };
    
    // If time changed, we need to delete old entry and create new one
    if (time !== oldTime) {
        // Transaction to ensure atomicity
        const updates = {};
        updates[`users/${user.uid}/entries/${dateString}/${oldTime}`] = null;
        updates[`users/${user.uid}/entries/${dateString}/${time}`] = entryData;
        
        database.ref().update(updates)
            .then(() => {
                finishEditProcess(source);
                showToast('Entry updated successfully', 'success');
                loadEntries(user.uid, dateString);
            })
            .catch(error => {
                showToast(`Error updating entry: ${error.message}`, 'error');
            });
    } else {
        // Just update the existing entry
        database.ref(`users/${user.uid}/entries/${dateString}/${time}`)
            .update(entryData)
            .then(() => {
                finishEditProcess(source);
                showToast('Entry updated successfully', 'success');
                loadEntries(user.uid, dateString);
            })
            .catch(error => {
                showToast(`Error updating entry: ${error.message}`, 'error');
            });
    }
}

// Close panels and modals after editing
function finishEditProcess(source) {
    if (source === 'panel') {
        document.getElementById('edit-entry-panel').classList.remove('active');
    } else {
        document.getElementById('edit-entry-modal').classList.remove('active');
    }
    currentEditingEntry = null;
}

// Show delete confirmation dialog
function showDeleteConfirmation(entryData) {
    currentEditingEntry = entryData;
    document.getElementById('delete-modal').classList.add('active');
    
    // Set entry title in confirmation message
    const entryTitle = document.getElementById('delete-entry-title');
    entryTitle.textContent = entryData.title;
    
    // Focus on cancel button (safer default)
    setTimeout(() => {
        document.getElementById('cancel-delete').focus();
    }, 100);
}

// Close delete confirmation modal
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    currentEditingEntry = null;
}

// Delete an entry
function deleteEntry(entryData) {
    const user = auth.currentUser;
    if (!user) {
        showToast('You must be logged in to delete entries', 'error');
        return;
    }
    
    const dateString = entryData.date;
    const time = entryData.time;
    
    database.ref(`users/${user.uid}/entries/${dateString}/${time}`)
        .remove()
        .then(() => {
            showToast('Entry deleted successfully', 'success');
            loadEntries(user.uid, dateString);
            markCalendarDatesWithEntries(user.uid);
        })
        .catch(error => {
            showToast(`Error deleting entry: ${error.message}`, 'error');
        });
}
