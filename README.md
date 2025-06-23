# Your Digital Flow

A Firebase-backed, single-page online diary/notebook that lets authenticated users create, read, update, and delete daily entries over the course of a year. Each entry can include rich text, tags, mood, and up to two compressed images stored as Base64 data URIs in Firestore.

## Features
- Authentication (Email/Password, Google)
- Daily entry CRUD with Markdown support
- Mood, tags, and up to 2 images per entry
- Calendar view with entry highlights
- Search and tag filtering
- Export year’s entries as JSON
- Light/Dark theme toggle
- Responsive, mobile-first UI

## Tech Stack
- HTML5, CSS3, Vanilla JS (ES6 modules)
- Firebase Auth & Firestore

## Setup
1. Clone the repo
2. Add your Firebase config to `/public/js/firebase-config.js`
3. Deploy with Firebase Hosting

## Folder Structure
- `/public` - Static assets (HTML, CSS, JS)
- `/src` - JS modules (auth, firestore, ui, utils)

## License
MIT
