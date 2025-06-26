# Your Digital Flow - Diary App

A responsive digital diary application built using HTML, CSS, and vanilla JavaScript with Firebase for authentication and data storage.

## Features

- **Authentication**: Email/password authentication using Firebase Auth
- **Diary Entries**: Add, view, edit, delete, and search entries with title, description, time, mood, and tags
- **Timeline View**: Chronological display of entries for selected dates
- **Calendar Navigation**: Browse entries by date with visual indicators
- **Search & Filter**: Find entries by keywords, tags, or mood
- **Export Functionality**: Export entries by day or month in JSON or TXT format
- **Dark/Light Theme**: Toggle between light and dark themes with persistent preference
- **Responsive Design**: Mobile-optimized with bottom navigation and desktop-optimized with sidebar
- **Accessibility**: Keyboard navigation support and focus management

## Architecture

### Frontend

- **HTML5**: Semantic structure
- **CSS3**: Responsive design using Flexbox and media queries
- **JavaScript**: Vanilla JS (no frameworks) for all functionality

### Backend

- **Firebase Authentication**: User login and registration
- **Firebase Realtime Database**: Storage for user diary entries

## Project Structure

```
/
├── index.html                      # Main HTML file
├── styles/
│   └── main.css                    # All styles for the application
├── scripts/
│   ├── firebase-config.js          # Firebase initialization
│   ├── auth.js                     # Authentication functionality
│   ├── calendar.js                 # Calendar display and date selection
│   ├── entries.js                  # Entry management (create, read, filter)
│   ├── edit.js                     # Edit and delete entry functionality 
│   ├── ui.js                       # UI interactions and responsive behavior
│   └── app.js                      # Main application logic
├── database-rules.json             # Firebase RTDB security rules
├── FIREBASE_RULES_INSTRUCTIONS.md  # Instructions for deploying rules
└── README.md                       # Project documentation
```

## Installation

1. Clone the repository
2. Open `index.html` in your browser

## Firebase Structure

```
{
  "users": {
    "uid123": {
      "entries": {
        "2025-06-25": {
          "08:00": {
            "title": "Morning Walk",
            "description": "Enjoyed the fresh air.",
            "mood": "😊 Happy",
            "tags": ["#nature", "#morning"]
          },
          "21:30": {
            "title": "Study Session",
            "description": "Revised biology for NEET.",
            "mood": "😴 Tired",
            "tags": ["#study", "#neet"]
          }
        }
      }
    }
  }
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is for personal and educational use only.

## Credits

Created with ❤️ by Your Digital Flow Team
