// app.js for Your Digital Flow
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0s9vHEkDR0lWEXIsI8TvcHHjX9TQ5xXk",
  authDomain: "connectchat-d3713.firebaseapp.com",
  databaseURL: "https://connectchat-d3713-default-rtdb.firebaseio.com",
  projectId: "connectchat-d3713",
  storageBucket: "connectchat-d3713.firebasestorage.app",
  messagingSenderId: "393420495514",
  appId: "1:393420495514:web:4ff7e73efe3d68172f5d23"
};

// Load Firebase SDKs
const script1 = document.createElement('script');
script1.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
document.head.appendChild(script1);
const script2 = document.createElement('script');
script2.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
document.head.appendChild(script2);
const script3 = document.createElement('script');
script3.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js";
document.head.appendChild(script3);

// Wait for Firebase scripts to load
function waitForFirebase(cb) {
  let loaded = 0;
  [script1, script2, script3].forEach(s => s.onload = () => {
    loaded++;
    if (loaded === 3) cb();
  });
}

waitForFirebase(() => {
  firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.database();
  // TODO: Implement UI logic, auth, diary CRUD, etc.

  // Timeline rendering logic
  function renderTimeline(entries) {
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';
    if (!entries || Object.keys(entries).length === 0) {
      timeline.innerHTML = '<p class="empty-msg">No entries for this date.</p>';
      return;
    }
    // Sort by time
    const times = Object.keys(entries).sort();
    times.forEach(time => {
      const entry = entries[time];
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <div class="entry-header">
          <span class="entry-time">${time}</span>
          <span class="entry-mood">${entry.mood || ''}</span>
        </div>
        <h3 class="entry-title">${entry.title}</h3>
        <p class="entry-description">${entry.description}</p>
        ${entry.tags && entry.tags.length ? `<div class="entry-tags">${entry.tags.map(t => `<span class='tag'>${t}</span>`).join(' ')}</div>` : ''}
        ${entry.image ? `<img class="entry-image" src="${entry.image}" alt="Entry Image" />` : ''}
      `;
      timeline.appendChild(card);
    });
  }

  // Fetch and render entries for selected date
  function loadEntriesForDate(date) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    firebase.database().ref(`users/${user.uid}/entries/${date}`).once('value', snap => {
      renderTimeline(snap.val());
    });
  }

  // Listen for date picker changes
  const mainDatePicker = document.getElementById('main-date-picker');
  if (mainDatePicker) {
    mainDatePicker.value = new Date().toISOString().slice(0,10);
    mainDatePicker.addEventListener('change', e => {
      loadEntriesForDate(e.target.value);
    });
    // Initial load
    firebase.auth().onAuthStateChanged(user => {
      if (user) loadEntriesForDate(mainDatePicker.value);
    });
  }

  // --- SEARCH & FILTER LOGIC ---
  function filterEntries(entries, { keyword = '', mood = '', tag = '' } = {}) {
    if (!entries) return {};
    const filtered = {};
    Object.keys(entries).forEach(time => {
      const entry = entries[time];
      const matchKeyword = keyword ? (
        entry.title.toLowerCase().includes(keyword) ||
        entry.description.toLowerCase().includes(keyword) ||
        (entry.tags && entry.tags.join(' ').toLowerCase().includes(keyword))
      ) : true;
      const matchMood = mood ? entry.mood === mood : true;
      const matchTag = tag ? (entry.tags && entry.tags.includes(tag)) : true;
      if (matchKeyword && matchMood && matchTag) filtered[time] = entry;
    });
    return filtered;
  }

  // --- SIDEBAR SEARCH/FILTER ---
  let lastSidebarEntries = {};
  function updateSidebarTimeline() {
    const date = document.getElementById('sidebar-date-picker').value || new Date().toISOString().slice(0,10);
    const keyword = document.getElementById('sidebar-search').value.trim().toLowerCase();
    const mood = document.getElementById('sidebar-mood-filter').value;
    const tag = document.getElementById('sidebar-tag-filter').value.trim();
    const filtered = filterEntries(lastSidebarEntries, { keyword, mood, tag });
    renderTimeline(filtered);
  }
  // Listen for sidebar filter changes
  ['sidebar-search','sidebar-mood-filter','sidebar-tag-filter','sidebar-date-picker'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateSidebarTimeline);
  });
  // Load entries for sidebar date
  const sidebarDatePicker = document.getElementById('sidebar-date-picker');
  if (sidebarDatePicker) {
    sidebarDatePicker.value = new Date().toISOString().slice(0,10);
    sidebarDatePicker.addEventListener('change', e => {
      const user = firebase.auth().currentUser;
      if (!user) return;
      firebase.database().ref(`users/${user.uid}/entries/${e.target.value}`).once('value', snap => {
        lastSidebarEntries = snap.val() || {};
        updateSidebarTimeline();
      });
    });
    // Initial load
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        firebase.database().ref(`users/${user.uid}/entries/${sidebarDatePicker.value}`).once('value', snap => {
          lastSidebarEntries = snap.val() || {};
          updateSidebarTimeline();
        });
      }
    });
  }

  // --- PROFILE PANEL SEARCH/FILTER ---
  let lastProfileEntries = {};
  function updateProfileTimeline() {
    const keyword = document.getElementById('profile-search').value.trim().toLowerCase();
    const mood = document.getElementById('profile-mood-filter').value;
    const tag = document.getElementById('profile-tag-filter').value.trim();
    const filtered = filterEntries(lastProfileEntries, { keyword, mood, tag });
    renderTimeline(filtered);
  }
  ['profile-search','profile-mood-filter','profile-tag-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateProfileTimeline);
  });
  // Show all entries for selected day in profile panel
  function loadProfileEntries(date) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    firebase.database().ref(`users/${user.uid}/entries/${date}`).once('value', snap => {
      lastProfileEntries = snap.val() || {};
      updateProfileTimeline();
    });
  }
  // When profile panel opens, load today's entries
  const profilePanel = document.getElementById('profile-panel');
  if (profilePanel) {
    document.getElementById('nav-profile').addEventListener('click', () => {
      profilePanel.style.display = 'flex';
      loadProfileEntries(new Date().toISOString().slice(0,10));
    });
    document.getElementById('close-profile-panel').addEventListener('click', () => {
      profilePanel.style.display = 'none';
    });
  }

  // --- EXPORT LOGIC ---
  function download(filename, content) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], {type: 'text/plain'}));
    a.download = filename;
    a.click();
  }
  function exportEntries(entries, format, filename) {
    if (!entries || Object.keys(entries).length === 0) {
      alert('No entries to export.');
      return;
    }
    let content = '';
    if (format === 'json') {
      content = JSON.stringify(entries, null, 2);
      filename += '.json';
    } else {
      // TXT: simple text export
      content = Object.keys(entries).sort().map(time => {
        const e = entries[time];
        return `Time: ${time}\nTitle: ${e.title}\nDescription: ${e.description}\nMood: ${e.mood}\nTags: ${(e.tags||[]).join(', ')}\n`;
      }).join('\n---\n');
      filename += '.txt';
    }
    download(filename, content);
  }
  // Export day (sidebar)
  document.getElementById('export-day').addEventListener('click', () => {
    const user = firebase.auth().currentUser;
    const date = document.getElementById('sidebar-date-picker').value || new Date().toISOString().slice(0,10);
    if (!user) return;
    firebase.database().ref(`users/${user.uid}/entries/${date}`).once('value', snap => {
      const entries = snap.val();
      const format = confirm('Export as JSON? (Cancel for TXT)') ? 'json' : 'txt';
      exportEntries(entries, format, `diary-${date}`);
    });
  });
  // Export month (sidebar)
  document.getElementById('export-month').addEventListener('click', () => {
    const user = firebase.auth().currentUser;
    const date = document.getElementById('sidebar-date-picker').value || new Date().toISOString().slice(0,10);
    const month = date.slice(0,7);
    if (!user) return;
    firebase.database().ref(`users/${user.uid}/entries`).once('value', snap => {
      const all = snap.val() || {};
      let monthEntries = {};
      Object.keys(all).forEach(d => {
        if (d.startsWith(month)) Object.assign(monthEntries, all[d]);
      });
      const format = confirm('Export as JSON? (Cancel for TXT)') ? 'json' : 'txt';
      exportEntries(monthEntries, format, `diary-${month}`);
    });
  });
  // Profile panel export
  document.getElementById('profile-export-day').addEventListener('click', () => {
    const user = firebase.auth().currentUser;
    const date = new Date().toISOString().slice(0,10);
    if (!user) return;
    firebase.database().ref(`users/${user.uid}/entries/${date}`).once('value', snap => {
      const entries = snap.val();
      const format = confirm('Export as JSON? (Cancel for TXT)') ? 'json' : 'txt';
      exportEntries(entries, format, `diary-${date}`);
    });
  });
  document.getElementById('profile-export-month').addEventListener('click', () => {
    const user = firebase.auth().currentUser;
    const month = new Date().toISOString().slice(0,7);
    if (!user) return;
    firebase.database().ref(`users/${user.uid}/entries`).once('value', snap => {
      const all = snap.val() || {};
      let monthEntries = {};
      Object.keys(all).forEach(d => {
        if (d.startsWith(month)) Object.assign(monthEntries, all[d]);
      });
      const format = confirm('Export as JSON? (Cancel for TXT)') ? 'json' : 'txt';
      exportEntries(monthEntries, format, `diary-${month}`);
    });
  });
});

// Theme toggle
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  const current = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
  setTheme(current);
}
// On load, set theme
setTheme(localStorage.getItem('theme') || 'light');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('theme-toggle').addEventListener('change', toggleTheme);

  // Auth modal logic
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const switchAuth = document.getElementById('switch-auth');
  let isSignup = false;

  function showAuthModal(signup = false) {
    isSignup = signup;
    authTitle.textContent = signup ? 'Sign Up' : 'Login';
    authSubmit.textContent = signup ? 'Sign Up' : 'Login';
    document.getElementById('auth-toggle').innerHTML = signup ?
      `Already have an account? <a href="#" id="switch-auth">Login</a>` :
      `Don't have an account? <a href="#" id="switch-auth">Sign up</a>`;
    authModal.style.display = 'flex';
  }
  function hideAuthModal() {
    authModal.style.display = 'none';
  }

  // Show auth modal if not logged in
  firebase.auth().onAuthStateChanged(user => {
    if (!user) showAuthModal(false);
    else hideAuthModal();
  });

  // Switch between login/signup
  authModal.addEventListener('click', e => {
    if (e.target.id === 'switch-auth') {
      showAuthModal(!isSignup);
    }
  });

  // Auth form submit
  authForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if (isSignup) {
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => hideAuthModal())
        .catch(err => alert(err.message));
    } else {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => hideAuthModal())
        .catch(err => alert(err.message));
    }
  });

  // Logout buttons
  document.getElementById('logout-btn').addEventListener('click', () => firebase.auth().signOut());
  document.getElementById('profile-logout').addEventListener('click', () => firebase.auth().signOut());

  // Show user info in profile
  firebase.auth().onAuthStateChanged(user => {
    const info = document.getElementById('profile-info');
    if (user && info) {
      info.innerHTML = `<p><b>Email:</b> ${user.email}</p>`;
    }
  });

  // Add Entry Form Submission
  const addEntryForm = document.getElementById('add-entry-form');
  if (addEntryForm) {
    addEntryForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const user = firebase.auth().currentUser;
      if (!user) {
        alert('You must be logged in to add entries.');
        return;
      }
      const title = document.getElementById('entry-title').value.trim();
      const description = document.getElementById('entry-description').value.trim();
      const time = document.getElementById('entry-time').value;
      const mood = document.getElementById('entry-mood').value;
      const tagsRaw = document.getElementById('entry-tags').value;
      const tags = tagsRaw.split(/[,\s]+/).filter(t => t);
      const date = document.getElementById('main-date-picker').value || new Date().toISOString().slice(0,10);
      const imageInput = document.getElementById('entry-image');
      let imageBase64 = null;
      if (imageInput && imageInput.files && imageInput.files[0]) {
        imageBase64 = await toBase64(imageInput.files[0]);
      }
      const entry = {
        title,
        description,
        mood,
        tags,
        image: imageBase64 || null
      };
      // Save to Firebase RTDB
      firebase.database().ref(`users/${user.uid}/entries/${date}/${time}`).set(entry)
        .then(() => {
          alert('Entry saved!');
          addEntryForm.reset();
          document.getElementById('add-entry-modal').style.display = 'none';
        })
        .catch(err => {
          alert('Error saving entry: ' + err.message);
        });
    });
  }
});

// Helper: Convert file to base64 string
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
