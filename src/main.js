import { startDrag } from './dnd.js';

function $(id) {
  return document.getElementById(id);
}

/**
 * Convenience to create an element.
 *
 * @param {string} Tag name.
 * @param {undefined | HTMLElement} Parent element to add new element to.
 * @returns {HTMLElement} New element.
 */
function create(tagName, parentNode) {
  const el = document.createElement(tagName);
  if (parentNode) {
    parentNode.appendChild(el);
  }
  return el;
}

/**
 * Builds the DOM nodes for a single row of a pairs section.
 *
 * @param {Node | undefined} parentNode Parent node to append the row to.
 * @returns {[Node, Node, Node]} Tuple of newly created row, name input, and value input.
 */
function buildRow(parentNode) {
  const row = create('div', parentNode);
  row.classList.add('pairs__row');

  const nameInput = create('input', row);
  nameInput.spellcheck = false;

  var eq = create('span', row);
  eq.textContent = '=';
  eq.classList.add('pairs__eq');
  eq.title = 'Resize columns';

  const valueInput = create('input', row);
  valueInput.spellcheck = false;

  return [row, nameInput, valueInput];
}

/**
 *
 * @param {HTMLSection} sectionEl Section to apps all the pair rows to.
 * @param {Array<[string, string]>} params Name, value pairs.
 * @param {String} newLabel Placeholder text to use for the "add new" row name input.
 */
function buildPairs(sectionEl, params, newLabel) {
  const frag = document.createDocumentFragment();

  params.forEach((value, name) => {
    const [, nameInput, valueInput] = buildRow(frag);
    nameInput.value = name;
    valueInput.value = value || '';
  });

  const [, nameInput] = buildRow(frag);
  nameInput.placeholder = newLabel;

  sectionEl.appendChild(frag);
}

/** Global for the active tab when we start. Sloppy convenience to use later. */
let activeTab;

/**
 * Checks a pairs section to see if if has an empty "add new" row or not. Once the user types into
 * this row, this function will fire and check if they have dirtied the "add new" row or not. If so,
 * the styles are removed from that active row, and new, empty, "add new" row is added to the
 * section.
 *
 * @param {HTMLSection} section The pairs section to check and add to.
 */
function addNewRowIfNeeded(section) {
  const rows = Array.from(section.querySelectorAll('.pairs__row'));
  const lastRow = rows[rows.length - 1];
  const [oldNameInput] = lastRow.querySelectorAll('input');

  // If there is a name in this row, it's usable, so "dirty" and we can proceed and will need a new
  // one.
  const hasNameText = oldNameInput.value.trim();
  if (!hasNameText) return;

  // Turn into normal row.
  const placeholder = oldNameInput.placeholder;
  oldNameInput.placeholder = '';

  // Build the "new" row
  const [newRow, newNameInput] = buildRow();
  newNameInput.placeholder = placeholder;

  // Animate height when it's added.
  const startH = section.offsetHeight;
  section.appendChild(newRow);
  const endH = section.offsetHeight;
  const anim = section.animate(
    {
      height: [`${startH}px`, `${endH}px`],
    },
    {
      duration: 200,
    }
  );

  // Splitter neeeds new height.
  anim.finished.then(positionSplitter);
}

/**
 * Regex to look for empty values in a param string. If they are empty we will delete them for a
 * cleaner look that is functionally identical.
 */
const EmptyValueRe = /(=(?=&))|(=$)/g;

/**
 * Converts name-value pairs into a param string.
 *
 * @param {Array<[string, string]>} nameValuePairs Name, value pairs. Values can be empty strings
 * @returns {string} String like "foo=bar&baz=splat"
 */
function asParamString(nameValuePairs) {
  const string = new URLSearchParams(nameValuePairs).toString();
  return string.replaceAll(EmptyValueRe, '');
}

/**
 * Reads the name value pairs from a section element of the DOM. Call on hash and query sections
 * separately.
 * @param {HTMLElement} element Root element to read pairs from. A section normally.
 * @returns {Array<[string, string]>} Name-value pairs.
 */
function getNameValuePairs(element) {
  const rows = Array.from(element.querySelectorAll('.pairs__row'));

  const nameValuePairs = [];
  for (let row of rows) {
    const [nameInput, valueInput] = row.querySelectorAll('input');

    // Skip empty names
    if (!nameInput.value.trim()) continue;

    nameValuePairs.push([nameInput.value.trim(), valueInput.value.trim()]);
  }

  return nameValuePairs;
}

/**
 * Uses the values in the form to update the URL of the active tab, then closes the popup.
 */
function updateActiveTabUrl() {
  const queryPairs = getNameValuePairs($('query'));
  const hashPairs = getNameValuePairs($('hash'));

  const url = new URL(activeTab.url);

  // The Path
  url.pathname = encodeURI($('pathname').value.trim());

  // The Query params
  const queryString = asParamString(queryPairs);
  if (queryString) {
    url.search = '?' + queryString;
  }

  // The Hash params
  //
  // If there is a single hash "name" without a = value, then assume it's a traditional single hash
  // value, as opposed to name value pairs. In that case, we don't escape the hash, just use as is.
  const isTraditionalHash = hashPairs.length === 1 && !hashPairs[0][1];
  const hashString = isTraditionalHash
    ? hashPairs[0][0]
    : asParamString(hashPairs);

  if (hashString) {
    url.hash = '#' + hashString;
  }

  const urlString = url.toString();
  if (urlString !== activeTab.url) {
    chrome.tabs.update(activeTab.id, { url: urlString });
  }

  window.close();
}

function getFirstColWidthPx() {
  return parseInt(
    window.getComputedStyle(document.body).getPropertyValue('--first-col-width')
  );
}

function setFirstColWidthPx(widthPx) {
  document.body.style.setProperty('--first-col-width', widthPx + 'px');
}

const savedWidthPx = localStorage.getItem('widthPx');
if (savedWidthPx > 0) {
  console.debug('>>> restored col width', savedWidthPx);
  setFirstColWidthPx(savedWidthPx);
}

/**
 * Checks if the element mousedowned on is an equals sign divider. If so, starts a DnD operation
 * that resizes the columns.
 *
 * @param {MouseEvent} e mousedown even that start a drag.
 */
function tryStartDrag(e) {
  if (!e.target.classList.contains('splitter')) return;

  const startWidthPx = getFirstColWidthPx();
  document.body.classList.add('is-dragging');
  e.target.classList.add('is-dragging');

  const splitter = $('splitter');

  startDrag(
    e,

    function onMove(diffX) {
      // const widthPx = Math.max(100, Math.min(600, startWidthPx + diffX));
      const widthPx = startWidthPx + diffX;
      setFirstColWidthPx(widthPx);
      splitter.style.translate = `${diffX}px`;
    },

    function onEnd() {
      e.target.classList.remove('is-dragging');
      document.body.classList.remove('is-dragging');

      const widthPx = getFirstColWidthPx();
      localStorage.setItem('widthPx', widthPx);
      positionSplitter();
    },

    150,
    window.innerWidth - 150
  );
}

function positionSplitter() {
  const splitter = $('splitter');
  const eqs = document.querySelectorAll('.pairs__eq');

  const eq1 = eqs[0];
  const rect1 = eq1.getBoundingClientRect();

  const eq2 = eqs[eqs.length - 1];
  const rect2 = eq2.getBoundingClientRect();

  Object.assign(splitter.style, {
    translate: 'none',
    top: rect1.top + 'px',
    left: rect1.left + 'px',
    height: rect2.bottom - rect1.top + 'px',
    width: rect1.width + 'px',
  });
}

document.addEventListener('DOMContentLoaded', function onStartup() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    activeTab = tab;
    const url = new URL(tab.url);

    $('pathname').value = decodeURI(url.pathname);

    const queryParams = new URLSearchParams(url.search);
    buildPairs($('query'), queryParams, 'Add query param');

    const hashParams = new URLSearchParams(url.hash.slice(1));
    buildPairs($('hash'), hashParams, 'Add hash param');

    positionSplitter();
    $('splitter').addEventListener('mousedown', tryStartDrag);
  });

  $('form').addEventListener('input', function onInput(e) {
    $('ok').disabled = false;

    const section = e.target.closest('section');

    if (section) {
      addNewRowIfNeeded(section);
    }
  });

  $('form').addEventListener('submit', function onSubmit(e) {
    e.preventDefault();
    $('ok').disabled = true;
    updateActiveTabUrl();
  });

  $('cancel').addEventListener('click', function onCance() {
    window.close();
  });
});
