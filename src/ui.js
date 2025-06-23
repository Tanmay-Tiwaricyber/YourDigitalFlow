// UI rendering module
// Handles rendering of calendar, editor, search, settings, and theming
import { signIn, signUp, signInWithGoogle, signOutUser, resetPassword, onAuthStateChanged } from './auth.js';
import { getEntry, saveEntry, getAllEntries, deleteEntry, getPreferences, savePreferences } from './firestore.js';
import { compressImage, generateId } from './utils.js';

export function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="auth-panel"></div>
    <div id="dashboard" style="display:none"></div>
  `;
  renderAuthPanel();
  onAuthStateChanged(user => {
    if (user) {
      document.getElementById('auth-panel').style.display = 'none';
      document.getElementById('dashboard').style.display = '';
      renderDashboard(user);
    } else {
      document.getElementById('auth-panel').style.display = '';
      document.getElementById('dashboard').style.display = 'none';
    }
  });
}

function renderAuthPanel() {
  const el = document.getElementById('auth-panel');
  el.innerHTML = `
    <h2>Sign In</h2>
    <form id="login-form">
      <input type="email" id="login-email" placeholder="Email" required />
      <input type="password" id="login-password" placeholder="Password" required />
      <button type="submit">Sign In</button>
      <button type="button" id="google-btn">Google</button>
    </form>
    <p><a href="#" id="show-signup">Create account</a> | <a href="#" id="show-reset">Forgot password?</a></p>
    <div id="signup-panel" style="display:none">
      <h2>Sign Up</h2>
      <form id="signup-form">
        <input type="email" id="signup-email" placeholder="Email" required />
        <input type="password" id="signup-password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
        <button type="button" id="cancel-signup">Cancel</button>
      </form>
    </div>
    <div id="reset-panel" style="display:none">
      <h2>Reset Password</h2>
      <form id="reset-form">
        <input type="email" id="reset-email" placeholder="Email" required />
        <button type="submit">Send Reset Email</button>
        <button type="button" id="cancel-reset">Cancel</button>
      </form>
    </div>
    <div id="auth-error" style="color:red"></div>
  `;
  // Event listeners for auth
  el.querySelector('#login-form').onsubmit = async e => {
    e.preventDefault();
    try {
      await signIn(el.querySelector('#login-email').value, el.querySelector('#login-password').value);
    } catch (err) {
      showAuthError(err.message);
    }
  };
  el.querySelector('#google-btn').onclick = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      showAuthError(err.message);
    }
  };
  el.querySelector('#show-signup').onclick = e => {
    e.preventDefault();
    el.querySelector('#signup-panel').style.display = '';
  };
  el.querySelector('#cancel-signup').onclick = e => {
    e.preventDefault();
    el.querySelector('#signup-panel').style.display = 'none';
  };
  el.querySelector('#signup-form').onsubmit = async e => {
    e.preventDefault();
    try {
      await signUp(el.querySelector('#signup-email').value, el.querySelector('#signup-password').value);
      el.querySelector('#signup-panel').style.display = 'none';
    } catch (err) {
      showAuthError(err.message);
    }
  };
  el.querySelector('#show-reset').onclick = e => {
    e.preventDefault();
    el.querySelector('#reset-panel').style.display = '';
  };
  el.querySelector('#cancel-reset').onclick = e => {
    e.preventDefault();
    el.querySelector('#reset-panel').style.display = 'none';
  };
  el.querySelector('#reset-form').onsubmit = async e => {
    e.preventDefault();
    try {
      await resetPassword(el.querySelector('#reset-email').value);
      el.querySelector('#reset-panel').style.display = 'none';
      showAuthError('Reset email sent.');
    } catch (err) {
      showAuthError(err.message);
    }
  };
}

function showAuthError(msg) {
  document.getElementById('auth-error').textContent = msg;
}

function renderDashboard(user) {
  const el = document.getElementById('dashboard');
  el.innerHTML = `
    <header>
      <h2>Welcome, ${user.email}</h2>
      <button id="signout-btn">Sign Out</button>
      <button id="export-btn">Export Year</button>
      <button id="settings-btn">Settings</button>
    </header>
    <main>
      <div id="search-bar">
        <input id="search-input" placeholder="Search entries..." />
        <input id="tag-filter" placeholder="Filter by tag" />
      </div>
      <div id="calendar"></div>
      <div id="entry-editor"></div>
      <div id="settings-panel" style="display:none"></div>
    </main>
  `;
  el.querySelector('#signout-btn').onclick = () => signOutUser();
  el.querySelector('#export-btn').onclick = () => exportYear(user);
  el.querySelector('#settings-btn').onclick = () => toggleSettings(user);
  el.querySelector('#search-input').oninput = () => renderCalendar(user);
  el.querySelector('#tag-filter').oninput = () => renderCalendar(user);
  renderCalendar(user);
}

function renderCalendar(user) {
  const calendarEl = document.getElementById('calendar');
  const search = document.getElementById('search-input')?.value?.toLowerCase() || '';
  const tag = document.getElementById('tag-filter')?.value?.toLowerCase() || '';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  let html = `<div class="calendar-grid">
    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>`;
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    html += `<button class="calendar-day" data-day="${d}">${d}</button>`;
  }
  html += '</div>';
  calendarEl.innerHTML = html;
  getAllEntries(user.uid).then(entries => {
    // Filter by search/tag
    let filtered = entries;
    if (search) filtered = filtered.filter(e => (e.content||'').toLowerCase().includes(search));
    if (tag) filtered = filtered.filter(e => (e.tags||[]).some(t => t.toLowerCase().includes(tag)));
    const entryDates = filtered.map(e => e.date);
    document.querySelectorAll('.calendar-day').forEach(btn => {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(btn.dataset.day).padStart(2,'0')}`;
      if (entryDates.includes(dateStr)) btn.classList.add('has-entry');
      btn.onclick = () => renderEntryEditor(user, dateStr, entries.find(e => e.date === dateStr));
    });
  });
}

function renderEntryEditor(user, date, entry) {
  const editorEl = document.getElementById('entry-editor');
  entry = entry || { date, content: '', tags: [], mood: '', media: [] };
  editorEl.innerHTML = `
    <h3>Entry for ${date}</h3>
    <form id="entry-form">
      <textarea id="entry-content" rows="6" placeholder="Write your day...">${entry.content || ''}</textarea>
      <input id="entry-tags" placeholder="Tags (comma separated)" value="${entry.tags ? entry.tags.join(',') : ''}" />
      <select id="entry-mood">
        <option value="">Mood</option>
        <option value="happy" ${entry.mood==='happy'?'selected':''}>Happy</option>
        <option value="sad" ${entry.mood==='sad'?'selected':''}>Sad</option>
        <option value="neutral" ${entry.mood==='neutral'?'selected':''}>Neutral</option>
        <option value="excited" ${entry.mood==='excited'?'selected':''}>Excited</option>
        <option value="angry" ${entry.mood==='angry'?'selected':''}>Angry</option>
      </select>
      <div id="media-list">
        ${(entry.media||[]).map((m,i)=>`<img src="${m.dataURI}" alt="img${i}" style="max-width:80px;max-height:80px;" />`).join('')}
      </div>
      <input type="file" id="entry-media" accept="image/*" multiple ${entry.media&&entry.media.length>=2?'disabled':''} />
      <button type="submit">Save</button>
      ${entry.content||entry.media.length||entry.tags.length?'<button type="button" id="delete-entry">Delete</button>':''}
    </form>
    <div id="entry-status"></div>
  `;
  // Handle form submit
  editorEl.querySelector('#entry-form').onsubmit = async e => {
    e.preventDefault();
    const content = editorEl.querySelector('#entry-content').value;
    const tags = editorEl.querySelector('#entry-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
    const mood = editorEl.querySelector('#entry-mood').value;
    let media = entry.media || [];
    const files = editorEl.querySelector('#entry-media').files;
    if (files && files.length) {
      for (let i = 0; i < Math.min(2-media.length, files.length); i++) {
        const dataURI = await compressImage(files[i]);
        media.push({ id: generateId(), name: files[i].name, dataURI });
      }
    }
    // Enforce 2 images max
    media = media.slice(0,2);
    // Enforce 1 MiB doc size
    const docSize = new Blob([JSON.stringify({date,content,tags,mood,media})]).size;
    if (docSize > 1024*1024) {
      editorEl.querySelector('#entry-status').textContent = 'Entry too large (max 1 MiB). Reduce images or text.';
      return;
    }
    await saveEntry(user.uid, { date, content, tags, mood, media });
    editorEl.querySelector('#entry-status').textContent = 'Saved!';
    renderCalendar(user);
  };
  // Handle delete
  const delBtn = editorEl.querySelector('#delete-entry');
  if (delBtn) delBtn.onclick = async () => {
    await deleteEntry(user.uid, date);
    editorEl.innerHTML = '';
    renderCalendar(user);
  };
}

function exportYear(user) {
  getAllEntries(user.uid).then(entries => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `your-digital-flow-${new Date().getFullYear()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function toggleSettings(user) {
  const panel = document.getElementById('settings-panel');
  if (panel.style.display === 'none') {
    renderSettings(user);
    panel.style.display = '';
  } else {
    panel.style.display = 'none';
  }
}

function renderSettings(user) {
  getPreferences(user.uid).then(prefs => {
    const panel = document.getElementById('settings-panel');
    panel.innerHTML = `
      <h3>Settings</h3>
      <label>
        <input type="checkbox" id="theme-toggle" ${prefs.theme==='dark'?'checked':''} /> Dark Theme
      </label>
      <label>
        <input type="checkbox" id="reminder-toggle" ${prefs.reminder?'checked':''} /> Daily Email Reminder (stub)
      </label>
      <button id="save-prefs">Save</button>
    `;
    panel.querySelector('#save-prefs').onclick = async () => {
      const theme = panel.querySelector('#theme-toggle').checked ? 'dark' : 'light';
      const reminder = panel.querySelector('#reminder-toggle').checked;
      await savePreferences(user.uid, { theme, reminder });
      applyTheme(theme);
      panel.style.display = 'none';
    };
    panel.querySelector('#theme-toggle').onchange = e => applyTheme(e.target.checked ? 'dark' : 'light');
  });
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.style.setProperty('--primary-bg', '#181a20');
    root.style.setProperty('--primary-text', '#eee');
    root.style.setProperty('--accent', '#90caf9');
  } else {
    root.style.setProperty('--primary-bg', '#fff');
    root.style.setProperty('--primary-text', '#222');
    root.style.setProperty('--accent', '#4f8cff');
  }
}
