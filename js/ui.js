/**
 * UI.js
 * Handles all UI interactions, calendar generation, modals, and DOM rendering
 */

const UI = {
    // Currently selected date
    selectedDate: null,
    
    // Current month/year for calendar view
    currentCalendarDate: new Date(),
    
    // Currently active tags for filtering
    activeTags: [],
    
    // Image data for current entry
    currentImages: [null, null],
      /**
     * Initialize UI components and event listeners
     */    init() {
        // Set initial selected date to today
        this.selectedDate = new Date();
        
        // Skip theme initialization as we handle it globally now
        // Just initialize calendar
        this.renderCalendar();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Bind note form
        this.bindNoteForm();
        
        // Show today's timeline or empty view
        this.loadDate(Utils.formatDate(this.selectedDate));
    },
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => Utils.toggleTheme());
        
        // Search
        document.getElementById('search-btn').addEventListener('click', () => this.searchEntries());
        document.getElementById('search-input').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.searchEntries();
        });
        
        // Export
        document.getElementById('export-btn').addEventListener('click', () => this.exportEntries());
        
        // Image uploads
        document.getElementById('note-image-1').addEventListener('change', (e) => this.handleImageUpload(e, 0));
        document.getElementById('note-image-2').addEventListener('change', (e) => this.handleImageUpload(e, 1));
        
        // Image removal
        document.getElementById('remove-image-1').addEventLis
        tener('click', () => this.removeImage(0));
        document.getElementById('remove-image-2').addEventListener('click', () => this.removeImage(1));
        
        // Mood selection
        document.querySelectorAll('.mood-option').forEach(element => {
            element.addEventListener('click', () => this.selectMood(element.dataset.mood));
        });
    },
    
    /**
     * Render the calendar for current month/year
     */
    renderCalendar() {
        const calendarDaysElement = document.getElementById('calendar-days');
        const currentMonthElement = document.getElementById('current-month');
        
        // Clear previous calendar
        calendarDaysElement.innerHTML = '';
        
        // Update month/year header
        currentMonthElement.textContent = this.currentCalendarDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        
        // Get calendar days
        const calendarDays = Utils.getCalendarDays(this.currentCalendarDate);
        
        // Create day elements
        calendarDays.forEach(dayInfo => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = dayInfo.date.getDate();
            dayElement.dataset.date = dayInfo.dateString;
            
            // Add appropriate classes
            if (dayInfo.isPadding) {
                dayElement.classList.add('padding');
            }
            
            if (dayInfo.isToday) {
                dayElement.classList.add('today');
            }
            
            // Add has-entry class if there is an entry for this date
            if (DB.hasEntry(dayInfo.dateString)) {
                dayElement.classList.add('has-entry');
            }
            
            // Add click event to non-padding days
            if (!dayInfo.isPadding) {
                dayElement.addEventListener('click', () => this.loadDate(dayInfo.dateString));
            }
            
            // Add selected class if this is the selected date
            if (
                this.selectedDate && 
                this.selectedDate.getDate() === dayInfo.date.getDate() &&
                this.selectedDate.getMonth() === dayInfo.date.getMonth() &&
                this.selectedDate.getFullYear() === dayInfo.date.getFullYear()
            ) {
                dayElement.classList.add('active');
            }
            
            calendarDaysElement.appendChild(dayElement);
        });
    },
    
    /**
     * Change the month view in calendar
     * @param {number} delta - Number of months to add (negative to go back)
     */
    changeMonth(delta) {
        this.currentCalendarDate = new Date(
            this.currentCalendarDate.getFullYear(),
            this.currentCalendarDate.getMonth() + delta,
            1
        );
        
        this.renderCalendar();
    },
      /**
     * Load timeline for a specific date
     * @param {string} dateString - Date in YYYY-MM-DD format
     */    async loadDate(dateString) {
        try {
            Utils.showLoading();
            
            // Update selected date
            this.selectedDate = Utils.parseDate(dateString);
            
            // Highlight selected date in calendar
            document.querySelectorAll('.day').forEach(day => {
                day.classList.remove('active');
                if (day.dataset.date === dateString) {
                    day.classList.add('active');
                }
            });
            
            // Check if DB is initialized properly before trying to get notes
            if (!DB.database || !DB.entriesRef) {
                console.error("Database not properly initialized");
                Utils.showToast("Database connection issue. Please try refreshing the page.", "error");
                Utils.hideLoading();
                return;
            }
            
            // Get notes for the date
            const notes = await DB.getNotesByDate(dateString);
            
            // Update timeline with date header
            document.getElementById('entry-date').textContent = Utils.formatReadableDate(this.selectedDate);
            
            // Render timeline with notes
            this.renderTimeline(notes);
            
            // Reset the new note form
            this.resetNoteForm();
            
            // Show timeline view and hide other views
            document.getElementById('no-entry-message').classList.add('hidden');
            document.getElementById('timeline-container').classList.remove('hidden');
            document.getElementById('search-results').classList.add('hidden');
        } catch (error) {
            console.error('Error loading timeline:', error);
            Utils.showToast("There was an error loading your notes", "error");
        } finally {
            Utils.hideLoading();
        }
    },
    
    /**
     * Render the timeline with notes
     * @param {Array} notes - Array of note objects
     */
    renderTimeline(notes) {
        const timelineEl = document.getElementById('timeline-notes');
        timelineEl.innerHTML = '';
        
        if (notes.length === 0) {
            // Show empty state message
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'timeline-empty';
            emptyMessage.innerHTML = `
                <p>No notes for this date yet.</p>
                <p>Add a note using the form below.</p>
            `;
            timelineEl.appendChild(emptyMessage);
            return;
        }
        
        // Create note cards for each note
        notes.forEach(note => {
            const noteCard = this.renderNoteCard(note);
            timelineEl.appendChild(noteCard);
        });
    },
    
    /**
     * Create a DOM element for a note card
     * @param {Object} note - Note object with id and data
     * @returns {HTMLElement} The note card DOM element
     */
    renderNoteCard(note) {
        const { id, data } = note;
        
        const card = document.createElement('div');
        card.className = 'timeline-note';
        card.dataset.id = id;
        
        // Format time for display
        const timeDisplay = Utils.formatTimeForDisplay(data.time);
        
        // Create time marker
        const timeMarker = document.createElement('div');
        timeMarker.className = 'note-time';
        timeMarker.innerHTML = `
            <span class="time-icon">🕒</span>
            <span class="time-text">${timeDisplay}</span>
        `;
        
        // Create note content
        const noteContent = document.createElement('div');
        noteContent.className = 'note-content';
        
        // Add note text
        const noteText = document.createElement('div');
        noteText.className = 'note-text';
        noteText.textContent = data.content;
        noteContent.appendChild(noteText);
        
        // Add mood and tags if present
        const noteMetaInfo = document.createElement('div');
        noteMetaInfo.className = 'note-meta-info';
        
        // Add mood if present
        if (data.mood) {
            const moodEl = document.createElement('div');
            moodEl.className = 'note-mood';
            moodEl.innerHTML = `Mood: ${Utils.getMoodEmoji(data.mood)} ${data.mood.charAt(0).toUpperCase() + data.mood.slice(1)}`;
            noteMetaInfo.appendChild(moodEl);
        }
        
        // Add tags if present
        if (data.tags && data.tags.length > 0) {
            const tagsEl = document.createElement('div');
            tagsEl.className = 'note-tags';
            tagsEl.innerHTML = `Tags: ${data.tags.join(', ')}`;
            noteMetaInfo.appendChild(tagsEl);
        }
        
        noteContent.appendChild(noteMetaInfo);
        
        // Add images if present
        if (data.media && data.media.length > 0) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'note-media';
            
            data.media.forEach(media => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'note-image-container';
                
                const img = document.createElement('img');
                img.src = media.dataURI;
                img.alt = media.name;
                img.className = 'note-image';
                
                imgContainer.appendChild(img);
                mediaContainer.appendChild(imgContainer);
            });
            
            noteContent.appendChild(mediaContainer);
        }
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-icon delete-note';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNote(id);
        });
        
        // Assemble the card
        card.appendChild(timeMarker);
        card.appendChild(noteContent);
        card.appendChild(deleteBtn);
        
        return card;
    },
    
    /**
     * Reset entry editor to empty state
     */
    resetEntryEditor() {
        // Reset text fields
        document.getElementById('entry-text').value = '';
        document.getElementById('entry-tags').value = '';
        
        // Reset mood selection
        document.querySelectorAll('.mood-option').forEach(element => {
            element.classList.remove('selected');
        });
        
        // Reset images
        this.currentImages = [null, null];
        this.updateImagePreviews();
    },
    
    /**
     * Fill entry editor with entry data
     * @param {Object} entry - Entry data
     */
    fillEntryEditor(entry) {
        // Set content
        document.getElementById('entry-text').value = entry.content || '';
        
        // Set tags
        document.getElementById('entry-tags').value = Utils.joinTags(entry.tags || []);
        
        // Set mood
        if (entry.mood) {
            this.selectMood(entry.mood, false);
        }
        
        // Set images
        this.currentImages = [null, null];
        if (entry.media && Array.isArray(entry.media)) {
            entry.media.forEach((media, index) => {
                if (index < 2) {
                    this.currentImages[index] = media;
                }
            });
        }
        
        // Update image previews
        this.updateImagePreviews();
    },    /**
     * Reset the note form to empty state
     */
    resetNoteForm() {
        // Reset text field
        document.getElementById('note-content').value = '';
        document.getElementById('note-tags').value = '';
        document.getElementById('note-time').value = '';
        
        // Reset mood selection
        document.querySelectorAll('.mood-option').forEach(element => {
            element.classList.remove('selected');
        });
        
        // Reset images
        this.currentImages = [null, null];
        this.updateImagePreviews();
    },
    
    /**
     * Set up note form event listeners
     */
    bindNoteForm() {
        // Add note form submission
        document.getElementById('note-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewNote();
        });
        
        // Set default time to current time
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('note-time').value = `${hours}:${minutes}`;
    },
    
    /**
     * Add a new note to the current date
     */
    async addNewNote() {
        if (!this.selectedDate) {
            return;
        }
        
        const dateString = Utils.formatDate(this.selectedDate);
        const content = document.getElementById('note-content').value.trim();
        const tagsString = document.getElementById('note-tags').value;
        const time = document.getElementById('note-time').value;
        const tags = Utils.parseTags(tagsString);
        
        // Validate content
        if (!content) {
            Utils.showToast('Please enter some content for your note', 'error');
            return;
        }
        
        // Find selected mood
        const selectedMoodElement = document.querySelector('.mood-option.selected');
        const mood = selectedMoodElement ? selectedMoodElement.dataset.mood : null;
        
        // Prepare media array
        const media = this.currentImages.filter(img => img !== null);
        
        // Create note object
        const noteData = {
            time,
            content,
            tags,
            timestamp: new Date().toISOString()
        };
        
        // Only add mood if selected
        if (mood) {
            noteData.mood = mood;
        }
        
        // Only add media if exists
        if (media.length > 0) {
            noteData.media = media;
        }
        
        try {
            // Create save button with loading state
            const addButton = document.getElementById('add-note-btn');
            const originalText = addButton.textContent;
            addButton.textContent = 'Adding...';
            addButton.disabled = true;
            
            Utils.showLoading();
            await DB.addNoteToDate(dateString, noteData);
            
            // Reload notes for this date
            const notes = await DB.getNotesByDate(dateString);
            this.renderTimeline(notes);
            
            // Reset form
            this.resetNoteForm();
            
            // Show success feedback
            addButton.textContent = '✓ Added!';
            setTimeout(() => {
                addButton.textContent = originalText;
                addButton.disabled = false;
            }, 1500);
            
            Utils.hideLoading();
            
            // Show success toast notification
            Utils.showToast('Note added successfully!', 'success');
        } catch (error) {
            console.error('Error adding note:', error);
            Utils.hideLoading();
            
            // Restore button and show error
            const addButton = document.getElementById('add-note-btn');
            addButton.textContent = 'Add Note';
            addButton.disabled = false;
            
            // Show error toast
            Utils.showToast('Failed to add note. Please try again.', 'error');
        }
    },
    
    /**
     * Delete a note
     * @param {string} noteId - ID of the note to delete
     */
    async deleteNote(noteId) {
        if (!this.selectedDate || !noteId) {
            return;
        }
        
        const dateString = Utils.formatDate(this.selectedDate);
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this note? This cannot be undone.')) {
            return;
        }
        
        try {
            Utils.showLoading();
            await DB.deleteNoteById(dateString, noteId);
            
            // Reload notes for this date
            const notes = await DB.getNotesByDate(dateString);
            this.renderTimeline(notes);
            
            Utils.hideLoading();
            
            // Show toast notification
            Utils.showToast('Note deleted successfully.', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            Utils.hideLoading();
            
            // Show error toast notification
            Utils.showToast('Failed to delete note. Please try again.', 'error');
        }
    },
      /**
     * Handle image upload
     * @param {Event} e - File input change event
     * @param {number} index - Image index (0 or 1)
     */
    async handleImageUpload(e, index) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            Utils.showToast('Please select an image file', 'error');
            return;
        }
        
        // Check file size (limit to 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
            Utils.showToast('Image must be less than 5MB', 'error');
            return;
        }
        
        try {
            Utils.showLoading();
            
            // Convert to base64 with compression
            const dataURI = await Utils.convertImageToBase64(file);
            
            // Store image data
            this.currentImages[index] = {
                name: file.name,
                dataURI
            };
            
            // Update preview
            this.updateImagePreviews();
            
            Utils.hideLoading();
        } catch (error) {
            console.error('Error processing image:', error);
            Utils.showToast('Failed to process image', 'error');
            Utils.hideLoading();
        }
    },
    
    /**
     * Remove an image
     * @param {number} index - Image index (0 or 1)
     */
    removeImage(index) {
        this.currentImages[index] = null;
        this.updateImagePreviews();
        
        // Reset the file input
        const fileInput = document.getElementById(`image-upload-${index + 1}`);
        fileInput.value = '';
    },
    
    /**
     * Update image previews based on currentImages array
     */
    updateImagePreviews() {
        for (let i = 0; i < 2; i++) {
            const previewElement = document.getElementById(`image-preview-${i + 1}`);
            const labelElement = document.getElementById(`image-label-${i + 1}`);
            const removeButton = document.getElementById(`remove-image-${i + 1}`);
            
            if (this.currentImages[i]) {
                // Show preview with image
                previewElement.style.backgroundImage = `url('${this.currentImages[i].dataURI}')`;
                previewElement.classList.remove('hidden');
                labelElement.classList.add('hidden');
                removeButton.classList.remove('hidden');
            } else {
                // Show upload button
                previewElement.style.backgroundImage = '';
                previewElement.classList.add('hidden');
                labelElement.classList.remove('hidden');
                removeButton.classList.add('hidden');
            }
        }
    },
    
    /**
     * Select a mood
     * @param {string} mood - Mood value
     * @param {boolean} toggleOff - If true, clicking the same mood will toggle it off
     */
    selectMood(mood, toggleOff = true) {
        const moodElements = document.querySelectorAll('.mood-option');
        
        // Find the element for this mood
        const targetElement = document.querySelector(`.mood-option[data-mood="${mood}"]`);
        
        if (!targetElement) return;
        
        // If already selected and toggleOff is true, deselect it
        if (targetElement.classList.contains('selected') && toggleOff) {
            targetElement.classList.remove('selected');
            return;
        }
        
        // Deselect all moods
        moodElements.forEach(el => el.classList.remove('selected'));
        
        // Select this mood
        targetElement.classList.add('selected');
    },
    
    /**
     * Search entries by query
     */
    searchEntries() {
        const query = document.getElementById('search-input').value.trim();
        
        if (!query) {
            return;
        }
        
        // Search and display results
        const results = DB.searchEntries(query);
        this.displaySearchResults(results, `Search results for: "${query}"`);
    },
    
    /**
     * Filter entries by tag
     * @param {string} tag - Tag to filter by
     */
    filterByTag(tag) {
        // Toggle tag activation
        const tagIndex = this.activeTags.indexOf(tag);
        
        if (tagIndex !== -1) {
            // Remove tag if already active
            this.activeTags.splice(tagIndex, 1);
        } else {
            // Add tag to active list
            this.activeTags.push(tag);
        }
        
        // Update tag elements
        this.updateTagFilters();
        
        // If no active tags, show today's entry
        if (this.activeTags.length === 0) {
            this.loadDate(Utils.formatDate(new Date()));
            return;
        }
        
        // Combine results from all active tags
        let combinedResults = [];
        
        this.activeTags.forEach(activeTag => {
            const results = DB.filterEntriesByTag(activeTag);
            
            // Add to combined results if not already included
            results.forEach(result => {
                if (!combinedResults.some(r => r.date === result.date)) {
                    combinedResults.push(result);
                }
            });
        });
        
        // Display results
        this.displaySearchResults(
            combinedResults, 
            `Entries tagged with: ${this.activeTags.join(', ')}`
        );
    },
    
    /**
     * Display search/filter results
     * @param {Array} results - Array of entries with dates
     * @param {string} title - Title for results
     */
    displaySearchResults(results, title) {
        // Hide entry editor and no-entry message
        document.getElementById('entry-editor').classList.add('hidden');
        document.getElementById('no-entry-message').classList.add('hidden');
        
        // Get and clear results container
        const searchResults = document.getElementById('search-results');
        const resultsList = document.getElementById('results-list');
        searchResults.classList.remove('hidden');
        resultsList.innerHTML = '';
        
        // Set results title
        const header = searchResults.querySelector('h2');
        header.textContent = title;
        
        // Add results or no results message
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No entries found';
            resultsList.appendChild(noResults);
            return;
        }
        
        // Sort results by date (newest first)
        results.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Create result items
        results.forEach(({ date, entry }) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.dataset.date = date;
            
            // Parse the date
            const parsedDate = Utils.parseDate(date);
            
            // Create header with date and mood
            const header = document.createElement('div');
            header.className = 'result-header';
            
            const dateElement = document.createElement('h3');
            dateElement.textContent = Utils.formatReadableDate(parsedDate);
            header.appendChild(dateElement);
            
            // Add mood icon if present
            if (entry.mood) {
                let moodIcon;
                switch (entry.mood) {
                    case 'happy': moodIcon = 'fa-grin'; break;
                    case 'sad': moodIcon = 'fa-frown'; break;
                    case 'neutral': moodIcon = 'fa-meh'; break;
                    case 'excited': moodIcon = 'fa-grin-stars'; break;
                    case 'tired': moodIcon = 'fa-tired'; break;
                    default: moodIcon = 'fa-smile';
                }
                
                const moodElement = document.createElement('i');
                moodElement.className = `fas ${moodIcon}`;
                moodElement.title = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);
                header.appendChild(moodElement);
            }
            
            resultItem.appendChild(header);
            
            // Add content preview
            if (entry.content) {
                const content = document.createElement('div');
                content.className = 'result-content';
                content.textContent = Utils.truncateText(entry.content, 100);
                resultItem.appendChild(content);
            }
            
            // Add tags
            if (entry.tags && entry.tags.length > 0) {
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'result-tags';
                
                entry.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag';
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
                
                resultItem.appendChild(tagsContainer);
            }
            
            // Add click handler
            resultItem.addEventListener('click', () => this.loadDate(date));
            
            resultsList.appendChild(resultItem);
        });
    },
    
    /**
     * Export all entries to a JSON file
     */
    exportEntries() {
        const data = DB.exportEntries();
        Utils.exportToJson(data, `diary-export-${Utils.formatDate(new Date())}.json`);
    },
    
    /**
     * Update tag filters display
     */
    updateTagFilters() {
        const tagsContainer = document.getElementById('tag-filters');
        tagsContainer.innerHTML = '';
        
        const tags = DB.getAllTags();
        
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            
            // Add active class if tag is active
            if (this.activeTags.includes(tag)) {
                tagElement.classList.add('active');
            }
            
            // Add click handler for filtering
            tagElement.addEventListener('click', () => this.filterByTag(tag));
            
            tagsContainer.appendChild(tagElement);
        });
    },
      /**
     * Update calendar display (called when entries change)
     */
    updateCalendar() {
        // Check which days have entries
        document.querySelectorAll('.day').forEach(async day => {
            const date = day.dataset.date;
            
            if (!date) return;
            
            try {
                // Check if there are any notes for this date
                const snapshot = await DB.entriesRef.child(date).once('value');
                if (snapshot.exists()) {
                    day.classList.add('has-entry');
                } else {                    day.classList.remove('has-entry');
                }
            } catch (error) {
                console.error('Error checking entries for date', date, error);
            }
        });
    }
};

// Make UI available globally
window.UI = UI;
