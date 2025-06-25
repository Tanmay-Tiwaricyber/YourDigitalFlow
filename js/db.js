/**
 * DB.js
 * Handles all Firebase Realtime Database operations for Timeline Journal
 */

const DB = {
    // Database reference
    database: null,
    
    // User ID
    userId: null,
    
    // User entries reference
    entriesRef: null,
    
    // Cache of entries
    entriesCache: {},
    
    // Cache of notes for selected date
    currentDateNotes: [],
    
    // Tags collected from entries
    tagsCollection: new Set(),
      /**
     * Initialize the database with user ID
     * @param {string} uid - User ID from authentication
     */
    init(uid) {
        try {
            this.database = firebase.database();
            this.userId = uid;
            this.entriesRef = this.database.ref(`users/${uid}/entries`);
            
            // Set connection status listener
            const connectedRef = this.database.ref('.info/connected');
            connectedRef.on('value', (snap) => {
                if (snap.val() === true) {
                    console.log('Connected to Firebase database');
                } else {
                    console.log('Disconnected from Firebase database');
                    // Could show a UI notification here
                }
            });
            
            // Clear cache
            this.entriesCache = {};
            this.tagsCollection = new Set();
            
            // Start listening for data changes
            this.listenForEntries();
            
            return true;
        } catch (error) {
            console.error('Error initializing database:', error);
            alert('Failed to connect to database. Please refresh the page and try again.');
            return false;
        }
    },
    
    /**
     * Listen for changes to user's entries
     */
    listenForEntries() {
        // Remove any existing listeners
        this.entriesRef.off();
        
        // Add value listener for all entries
        this.entriesRef.on('value', snapshot => {
            // Update UI when entries change
            this.handleEntriesUpdate(snapshot);
        }, error => {
            console.error('Error fetching entries:', error);
        });
    },
    
    /**
     * Handle entries data update from Firebase
     * @param {Object} snapshot - Firebase snapshot
     */
    handleEntriesUpdate(snapshot) {
        // Clear cache and tags
        this.entriesCache = {};
        this.tagsCollection = new Set();
        
        // Process data
        if (snapshot.exists()) {
            const entries = snapshot.val();
            
            // Store entries in cache and collect tags
            Object.entries(entries).forEach(([date, entry]) => {
                this.entriesCache[date] = entry;
                
                // Collect tags from all entries
                if (entry.tags && Array.isArray(entry.tags)) {
                    entry.tags.forEach(tag => this.tagsCollection.add(tag));
                }
            });
        }
        
        // Update UI with the new data
        UI.updateCalendar();
        UI.updateTagFilters();
    },    /**
     * Get all notes for a specific date
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of notes with IDs
     */
    async getNotesByDate(dateString) {
        try {
            // Validate that database and entriesRef are initialized
            if (!this.database || !this.entriesRef) {
                console.error('Database or entriesRef not initialized.');
                // Try to re-initialize if user ID is available
                if (this.userId) {
                    console.log('Attempting to re-initialize database connection...');
                    this.database = firebase.database();
                    this.entriesRef = this.database.ref(`users/${this.userId}/entries`);
                } else {
                    throw new Error('Database connection not available');
                }
            }
            
            // Now fetch the data
            const snapshot = await this.entriesRef.child(dateString).once('value');
            
            if (snapshot.exists()) {
                const notes = [];
                snapshot.forEach(childSnapshot => {
                    notes.push({
                        id: childSnapshot.key,
                        data: childSnapshot.val()
                    });
                });
                
                // Sort notes by time
                notes.sort((a, b) => {
                    return this.compareTimeStrings(a.data.time, b.data.time);
                });
                
                // Update current notes cache
                this.currentDateNotes = notes;
                
                return notes;
            }
            
            this.currentDateNotes = [];
            return [];
        } catch (error) {
            console.error('Error fetching notes:', error);
            // Return empty array instead of throwing, to prevent UI crashes
            this.currentDateNotes = [];
            return [];
        }
    },
    
    /**
     * Add a new note to a specific date
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @param {Object} noteData - Note data to save
     * @returns {Promise<string>} The note ID
     */
    async addNoteToDate(dateString, noteData) {
        try {
            // Generate a unique ID using Firebase push
            const newNoteRef = this.entriesRef.child(dateString).push();
            
            // Add note with the generated ID
            await newNoteRef.set(noteData);
            
            // Update tags collection
            if (noteData.tags && Array.isArray(noteData.tags)) {
                noteData.tags.forEach(tag => this.tagsCollection.add(tag));
            }
            
            // Return the new note ID
            return newNoteRef.key;
        } catch (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    },
    
    /**
     * Delete a specific note by ID
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @param {string} noteId - ID of the note to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteNoteById(dateString, noteId) {
        try {
            // Remove from database
            await this.entriesRef.child(`${dateString}/${noteId}`).remove();
            
            // Update current notes cache
            this.currentDateNotes = this.currentDateNotes.filter(note => note.id !== noteId);
            
            // Recollect tags
            this.recollectTags();
            
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    },
    
    /**
     * Helper function to compare time strings (HH:MM) for sorting
     * @param {string} time1 - First time string (HH:MM)
     * @param {string} time2 - Second time string (HH:MM)
     * @returns {number} Comparison result
     */
    compareTimeStrings(time1, time2) {
        // Default to "00:00" if time is not specified
        const t1 = time1 || "00:00";
        const t2 = time2 || "00:00";
        
        // Compare as strings (works for HH:MM format)
        return t1.localeCompare(t2);
    },
    
    /**
     * Recollect all tags from entries
     */
    recollectTags() {
        this.tagsCollection = new Set();
        
        // Iterate through all cached entries to collect tags
        Object.values(this.entriesCache).forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => this.tagsCollection.add(tag));
            }
        });
        
        // Update UI with updated tags
        UI.updateTagFilters();
    },
    
    /**
     * Check if an entry exists for a specific date
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {boolean} True if entry exists
     */
    hasEntry(dateString) {
        return Boolean(this.entriesCache[dateString]);
    },
    
    /**
     * Get all entries
     * @returns {Object} All entries
     */
    getAllEntries() {
        return { ...this.entriesCache };
    },
    
    /**
     * Search entries by content or tags
     * @param {string} query - Search query
     * @returns {Array} Array of matching entries with date
     */
    searchEntries(query) {
        if (!query || query.trim() === '') {
            return [];
        }
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.entries(this.entriesCache).forEach(([date, entry]) => {
            const content = entry.content?.toLowerCase() || '';
            const tags = entry.tags || [];
            
            // Check if content contains query or any tag matches query
            if (
                content.includes(queryLower) ||
                tags.some(tag => tag.toLowerCase().includes(queryLower))
            ) {
                results.push({
                    date,
                    entry
                });
            }
        });
        
        return results;
    },
    
    /**
     * Filter entries by tag
     * @param {string} tag - Tag to filter by
     * @returns {Array} Array of matching entries with date
     */
    filterEntriesByTag(tag) {
        if (!tag || tag.trim() === '') {
            return [];
        }
        
        const results = [];
        
        Object.entries(this.entriesCache).forEach(([date, entry]) => {
            const tags = entry.tags || [];
            
            // Check if entry has the tag
            if (tags.includes(tag)) {
                results.push({
                    date,
                    entry
                });
            }
        });
        
        return results;
    },
    
    /**
     * Get all unique tags from all entries
     * @returns {Array} Array of unique tags
     */
    getAllTags() {
        return Array.from(this.tagsCollection).sort();
    },
    
    /**
     * Export all user entries as JSON
     * @returns {Object} All entries data
     */
    exportEntries() {
        return {
            exportDate: new Date().toISOString(),            userId: this.userId,
            entries: this.getAllEntries()
        };
    }
};

// Make DB available globally
window.DB = DB;
