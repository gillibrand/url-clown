import { $ } from './utils.js';

// Load saved options
chrome.storage.sync.get('clownHeadMode').then((options) => {
  const initialMode = options.clownHeadMode || 'color';
  renderClownHeadMode(initialMode);

  // Page is initially hidden while loading the async options.
  document.body.classList.remove('page-loading');
});

$('color-section').addEventListener('click', (e) => {
  if (e.target.nodeName !== 'INPUT') return;

  const mode = e.target.value;
  if (!mode) return;

  renderClownHeadMode(mode);
  saveClownHeadMode(mode);
});

/**
 * Maps the mode value to classes to use on the preview.
 */
const ClownHeadModeClasses = {
  color: 'clown-preview--color',
  grayscale: 'clown-preview--grayscale',
  hidden: 'clown-preview--hidden',
};

/**
 * Saves the mode in storage.
 *
 * @param {'color'|'grayscale'|'hidden'} newClownHeadMode New mode to save.
 */
function saveClownHeadMode(newClownHeadMode) {
  chrome.storage.sync.set({ clownHeadMode: newClownHeadMode });
}

/**
 * Updates the dom for the current head mode, including radios and the preview.
 *
 * @param {'color'|'grayscale'|'hidden'} newClownHeadMode New mode to set on the head preview.
 */
function renderClownHeadMode(newClownHeadMode) {
  const clown = $('clown-preview');

  const radio = document.querySelector(`[value="${newClownHeadMode}"]`);
  if (radio) radio.checked = true;

  for (let [mode, className] of Object.entries(ClownHeadModeClasses)) {
    if (mode === newClownHeadMode) {
      clown.classList.add(className);
    } else {
      clown.classList.remove(className);
    }
  }
}
