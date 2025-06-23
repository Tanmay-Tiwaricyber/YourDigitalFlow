// Entry point: import modules and initialize app
import '../js/firebase-config.js';
import { renderApp } from '../../src/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});
