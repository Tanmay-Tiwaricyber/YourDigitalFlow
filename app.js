// Your Digital Flow - app.js
// Modular, clea
const firebaseConfig = {
  apiKey: "AIzaSyA0s9vHEkDR0lWEXIsI8TvcHHjX9TQ5xXk",
  authDomain: "connectchat-d3713.firebaseapp.com",
  databaseURL: "https://connectchat-d3713-default-rtdb.firebaseio.com",
  projectId: "connectchat-d3713",
  storageBucket: "connectchat-d3713.firebasestorage.app",
  messagingSenderId: "393420495514",
  appId: "1:393420495514:web:4ff7e73efe3d68172f5d23"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ---- DOM Elements ----
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const timelinePage = document.getElementById('timeline-page');
const addEntryPage = document.getElementById('add-entry-page');
const profilePage = document.getElementById('profile-page');
const navBtns = document.querySelectorAll('.nav-btn');
const openAddEntryBtn = document.getElementById('open-add-entry');
const closeAddEntryBtn = document.getElementById('close-add-entry');
const entryForm = document.getElementById('entry-form');
const entryError = document.getElementById('entry-error');
const moodSelector = document.getElementById('mood-selector');
const timelineList = document.getElementById('timeline-list');
const timelineLoading = document.getElementById('timeline-loading');
const timelineEmpty = document.getElementById('timeline-empty');
const datePicker = document.getElementById('date-picker');
const refreshBtn = document.getElementById('refresh-btn');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search-input');
const filterMood = document.getElementById('filter-mood');
const filterTag = document.getElementById('filter-tag');
const exportJsonBtn = document.getElementById('export-json');
const exportTxtBtn = document.getElementById('export-txt');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const profileEntries = document.getElementById('profile-entries');

// ---- State ----
let currentUser = null;
let currentMood = '';
let currentDate = new Date().toISOString().slice(0,10);
let entriesCache = {};

// ---- Theme ----
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ydf-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(theme);
}
(function initTheme() {
  const saved = localStorage.getItem('ydf-theme') || 'light';
  setTheme(saved);
})();
themeToggleBtn.addEventListener('click', toggleTheme);

// ---- Auth ----
function showAuth(show) {
  authModal.classList.toggle('show', show);
}
authForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = authForm['auth-email'].value;
  const pass = authForm['auth-password'].value;
  authError.textContent = '';
  auth.signInWithEmailAndPassword(email, pass)
    .catch(err => {
      if (err.code === 'auth/user-not-found') {
        auth.createUserWithEmailAndPassword(email, pass)
          .catch(e => authError.textContent = e.message);
      } else {
        authError.textContent = err.message;
      }
    });
});
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    showAuth(false);
    userEmail.textContent = user.email;
    showPage('timeline-page');
    datePicker.value = currentDate;
    loadEntries();
  } else {
    currentUser = null;
    showAuth(true);
  }
});
logoutBtn.addEventListener('click', () => auth.signOut());

// ---- Navigation ----
function showPage(pageId) {
  [timelinePage, addEntryPage, profilePage].forEach(p => p.classList.remove('show'));
  document.getElementById(pageId).classList.add('show');
}
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (page) showPage(page);
  });
});
openAddEntryBtn.addEventListener('click', () => {
  addEntryPage.classList.add('show');
  setTimeout(() => document.getElementById('entry-title').focus(), 200);
});
closeAddEntryBtn.addEventListener('click', () => {
  addEntryPage.classList.remove('show');
  entryForm.reset();
  currentMood = '';
  moodSelector.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  entryError.textContent = '';
});

// ---- Mood Selector ----
moodSelector.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    moodSelector.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentMood = btn.dataset.mood;
  });
});

// ---- Add Entry ----
entryForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!currentMood) {
    entryError.textContent = 'Select a mood.';
    return;
  }
  const title = entryForm['entry-title'].value.trim();
  const desc = entryForm['entry-description'].value.trim();
  const time = entryForm['entry-time'].value;
  const tags = entryForm['entry-tags'].value.split(/[,#\s]+/).filter(Boolean).map(t => t.startsWith('#') ? t : '#' + t);
  if (!title || !desc || !time) {
    entryError.textContent = 'Fill all fields.';
    return;
  }
  entryError.textContent = 'Saving...';
  const entry = { title, description: desc, mood: currentMood, tags };
  const date = datePicker.value || currentDate;
  db.ref(`users/${currentUser.uid}/entries/${date}/${time}`).set(entry)
    .then(() => {
      entryError.textContent = '';
      addEntryPage.classList.remove('show');
      entryForm.reset();
      currentMood = '';
      moodSelector.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      loadEntries();
    })
    .catch(e => entryError.textContent = e.message);
});

// ---- Timeline ----
datePicker.addEventListener('change', () => {
  currentDate = datePicker.value;
  loadEntries();
});
refreshBtn.addEventListener('click', loadEntries);
function loadEntries() {
  timelineLoading.style.display = 'block';
  timelineList.innerHTML = '';
  timelineEmpty.style.display = 'none';
  const date = datePicker.value || currentDate;
  db.ref(`users/${currentUser.uid}/entries/${date}`).once('value')
    .then(snap => {
      const data = snap.val();
      entriesCache[date] = data || {};
      renderTimeline(data);
    })
    .catch(() => {
      timelineLoading.style.display = 'none';
      timelineEmpty.style.display = 'block';
    });
}
function renderTimeline(data) {
  timelineLoading.style.display = 'none';
  timelineList.innerHTML = '';
  if (!data) {
    timelineEmpty.style.display = 'block';
    return;
  }
  timelineEmpty.style.display = 'none';
  const times = Object.keys(data).sort();
  times.forEach((time, idx) => {
    const e = data[time];
    const card = document.createElement('div');
    card.className = 'timeline-card timeline-item';
    card.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="card-time">${time}</div>
        <div class="card-title">${e.title} <span class="card-mood">${e.mood.split(' ')[0]}</span></div>
        <div class="card-desc">${e.description}</div>
        <div class="tags">${(e.tags||[]).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    `;
    if (idx !== times.length - 1) {
      card.classList.add('timeline-connector');
    }
    timelineList.appendChild(card);
  });
}

// ---- Pull to Refresh (Mobile) ----
let touchStartY = 0;
let isPulling = false;
timelinePage.addEventListener('touchstart', e => {
  if (timelinePage.scrollTop === 0) touchStartY = e.touches[0].clientY;
});
timelinePage.addEventListener('touchmove', e => {
  if (timelinePage.scrollTop === 0 && e.touches[0].clientY - touchStartY > 60 && !isPulling) {
    isPulling = true;
    loadEntries();
    setTimeout(() => { isPulling = false; }, 1000);
  }
});

// ---- Profile/Settings ----
function loadProfileEntries() {
  profileEntries.innerHTML = '<div class="loading">Loading...</div>';
  db.ref(`users/${currentUser.uid}/entries`).once('value')
    .then(snap => {
      const all = snap.val() || {};
      let list = [];
      Object.entries(all).forEach(([date, entries]) => {
        Object.entries(entries).forEach(([time, e]) => {
          list.push({ date, time, ...e });
        });
      });
      renderProfileEntries(list);
    });
}
function renderProfileEntries(list) {
  profileEntries.innerHTML = '';
  if (!list.length) {
    profileEntries.innerHTML = '<div class="empty">No entries found.</div>';
    return;
  }
  list.forEach(e => {
    const card = document.createElement('div');
    card.className = 'timeline-card';
    card.innerHTML = `
      <div class="card-time">${e.date} ${e.time}</div>
      <div class="card-title">${e.title} <span class="card-mood">${e.mood.split(' ')[0]}</span></div>
      <div class="card-desc">${e.description}</div>
      <div class="tags">${(e.tags||[]).map(t => `<span class="tag">${t}</span>`).join('')}</div>
    `;
    profileEntries.appendChild(card);
  });
}
profilePage.addEventListener('show', loadProfileEntries);
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.page === 'profile-page') loadProfileEntries();
  });
});

// ---- Search, Filter, Export ----
function filterProfileEntries() {
  db.ref(`users/${currentUser.uid}/entries`).once('value')
    .then(snap => {
      const all = snap.val() || {};
      let list = [];
      Object.entries(all).forEach(([date, entries]) => {
        Object.entries(entries).forEach(([time, e]) => {
          list.push({ date, time, ...e });
        });
      });
      const q = searchInput.value.toLowerCase();
      const mood = filterMood.value;
      const tag = filterTag.value.trim();
      list = list.filter(e =>
        (!q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)) &&
        (!mood || e.mood === mood) &&
        (!tag || (e.tags||[]).some(t => t.toLowerCase().includes(tag.toLowerCase())))
      );
      renderProfileEntries(list);
    });
}
searchInput.addEventListener('input', filterProfileEntries);
filterMood.addEventListener('change', filterProfileEntries);
filterTag.addEventListener('input', filterProfileEntries);

function exportEntries(format) {
  db.ref(`users/${currentUser.uid}/entries`).once('value')
    .then(snap => {
      const all = snap.val() || {};
      let list = [];
      Object.entries(all).forEach(([date, entries]) => {
        Object.entries(entries).forEach(([time, e]) => {
          list.push({ date, time, ...e });
        });
      });
      let content = '';
      let mime = '';
      if (format === 'json') {
        content = JSON.stringify(list, null, 2);
        mime = 'application/json';
      } else {
        content = list.map(e => `${e.date} ${e.time}\n${e.title} [${e.mood}]\n${e.description}\nTags: ${(e.tags||[]).join(', ')}\n---`).join('\n\n');
        mime = 'text/plain';
      }
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ydf-entries.${format}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
}
exportJsonBtn.addEventListener('click', () => exportEntries('json'));
exportTxtBtn.addEventListener('click', () => exportEntries('txt'));

// ---- Utility: Show/Hide Loading/Empty ----
function showLoading(show) {
  timelineLoading.style.display = show ? 'block' : 'none';
}
function showEmpty(show) {
  timelineEmpty.style.display = show ? 'block' : 'none';
}

// ---- Initial ----
document.addEventListener('DOMContentLoaded', () => {
  datePicker.value = currentDate;
});
