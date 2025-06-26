// Calendar functionality
let currentDate = new Date();
let selectedDate = new Date();
let calendarEntryDates = [];

// Initialize calendars when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendars();
    
    // Desktop calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        navigateMonth(-1);
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        navigateMonth(1);
    });
    
    // Mobile calendar navigation
    document.getElementById('mobile-prev-month').addEventListener('click', () => {
        navigateMonth(-1);
    });
    
    document.getElementById('mobile-next-month').addEventListener('click', () => {
        navigateMonth(1);
    });
    
    // Mobile calendar toggle
    document.getElementById('mobile-calendar-toggle').addEventListener('click', () => {
        const calendarContainer = document.getElementById('mobile-calendar-container');
        calendarContainer.style.display = calendarContainer.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close mobile calendar with close button
    document.getElementById('close-mobile-calendar').addEventListener('click', () => {
        document.getElementById('mobile-calendar-container').style.display = 'none';
    });
});

// Initialize desktop and mobile calendars
function initializeCalendars() {
    renderCalendar('calendar', currentDate);
    renderCalendar('mobile-calendar', currentDate);
    updateCalendarMonthDisplay();
}

// Navigate month (previous/next)
function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar('calendar', currentDate);
    renderCalendar('mobile-calendar', currentDate);
    updateCalendarMonthDisplay();
}

// Update month display on calendars
function updateCalendarMonthDisplay() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const monthDisplay = `${month} ${year}`;
    
    document.getElementById('calendar-month').textContent = monthDisplay;
    document.getElementById('mobile-calendar-month').textContent = monthDisplay;
}

// Render calendar for a specific month
function renderCalendar(containerId, date) {
    const calendarContainer = document.getElementById(containerId);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Create a date for the first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get the starting day of the week (0 = Sunday)
    const startingDay = firstDay.getDay();
    
    // Get the number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create calendar table
    let calendarHTML = '<table>';
    
    // Add weekday headers
    calendarHTML += '<tr>';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        calendarHTML += `<th>${day}</th>`;
    });
    calendarHTML += '</tr>';
    
    // Add calendar days
    let day = 1;
    const today = new Date();
    
    // Create weeks
    for (let i = 0; i < 6; i++) {
        // Break if we've gone past the number of days in the month
        if (day > daysInMonth) break;
        
        calendarHTML += '<tr>';
        
        // Create days
        for (let j = 0; j < 7; j++) {
            if ((i === 0 && j < startingDay) || day > daysInMonth) {
                calendarHTML += '<td></td>';
            } else {
                // Check if this is today
                const isToday = today.getDate() === day && 
                                today.getMonth() === month && 
                                today.getFullYear() === year;
                
                // Check if this is the selected date
                const isSelected = selectedDate.getDate() === day && 
                                  selectedDate.getMonth() === month && 
                                  selectedDate.getFullYear() === year;
                
                // Check if this date has entries
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEntries = calendarEntryDates.includes(dateString);
                
                // Set classes based on conditions
                let classes = [];
                if (isToday) classes.push('today');
                if (isSelected) classes.push('selected');
                if (hasEntries) classes.push('has-entries');
                
                const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
                
                // Create clickable day with proper date attribute
                calendarHTML += `<td${classAttr} data-date="${dateString}">${day}</td>`;
                day++;
            }
        }
        
        calendarHTML += '</tr>';
    }
    
    calendarHTML += '</table>';
    calendarContainer.innerHTML = calendarHTML;
    
    // Add click event to calendar days
    const calendarDays = calendarContainer.querySelectorAll('td[data-date]');
    calendarDays.forEach(day => {
        day.addEventListener('click', () => {
            const dateString = day.getAttribute('data-date');
            selectDate(dateString);
        });
    });
}

// Select a specific date
function selectDate(dateString) {
    // Parse dateString (YYYY-MM-DD) to Date
    const [year, month, day] = dateString.split('-').map(Number);
    selectedDate = new Date(year, month - 1, day);
    
    // Update UI to show selected date
    updateDateDisplay(dateString);
    
    // Re-render calendars to reflect the selected date
    renderCalendar('calendar', currentDate);
    renderCalendar('mobile-calendar', currentDate);
    
    // Hide mobile calendar after selection
    document.getElementById('mobile-calendar-container').style.display = 'none';
    
    // Load entries for selected date
    if (auth.currentUser) {
        loadEntries(auth.currentUser.uid, dateString);
    }
}

// Update date display in the header
function updateDateDisplay(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Format date: "Monday, June 26, 2025"
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric', 
        year: 'numeric'
    });
    
    document.getElementById('mobile-date-display').textContent = formattedDate;
}

// Mark calendar dates that have entries
function markCalendarDatesWithEntries(userId) {
    calendarEntryDates = [];
    
    // Get the current month
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Reference to entries for the current month
    const entriesRef = database.ref(`users/${userId}/entries`);
    
    // Query entries for all dates in the month
    entriesRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            // Get dates with entries
            snapshot.forEach(dateSnapshot => {
                calendarEntryDates.push(dateSnapshot.key);
            });
            
            // Re-render calendars to mark dates with entries
            renderCalendar('calendar', currentDate);
            renderCalendar('mobile-calendar', currentDate);
        }
    }).catch(error => {
        console.error('Error fetching entries for calendar:', error);
    });
}

// Get current date as a string (YYYY-MM-DD)
function getCurrentDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
