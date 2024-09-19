import { startDrag } from './dnd.js';
import { ParamTable } from './ParamTable.js';
import { $ } from './utils.js';

/** Global for the active tab when we start. Sloppy convenience to use later. */
let activeTab;

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
 * Uses the values in the form to update the URL of the active tab, then closes the popup.
 */
function updateActiveTabUrl() {
  const queryPairs = queryTable.getNameValuePairs($('query'));
  const hashPairs = hashTable.getNameValuePairs($('hash'));

  const url = new URL(activeTab.url);

  // The Path
  url.pathname = encodeURI($('pathname').value.trim());

  // The Query params
  const queryString = asParamString(queryPairs);
  url.search = queryString ? '?' + queryString : '';

  // The Hash params
  //
  // If there is a single hash "name" without a = value, then assume it's a traditional single hash
  // value, as opposed to name value pairs. In that case, we don't escape the hash, just use as is.
  const isTraditionalHash = hashPairs.length === 1 && !hashPairs[0][1];
  const hashString = isTraditionalHash
    ? hashPairs[0][0]
    : asParamString(hashPairs);

  url.hash = hashString ? '#' + hashString : '';

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

/**
 * Updates the height an position of the splitter to cover the "=" column of both param tables.
 */
function positionSplitter() {
  const splitter = $('splitter');
  const eqs = document.querySelectorAll('.ParamTable__eq');

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

let queryTable;
let hashTable;

document.addEventListener('DOMContentLoaded', function onStartup() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    activeTab = tab;
    const url = new URL(tab.url);

    $('pathname').value = decodeURI(url.pathname);

    function onValueChange() {
      $('ok').disabled = false;
    }

    function onRowChange() {
      $('ok').disabled = false;
      positionSplitter();
    }

    const queryParams = new URLSearchParams(url.search);
    queryTable = new ParamTable(
      $('query'),
      queryParams,
      'Add query param',
      onValueChange,
      onRowChange
    );

    const hashParams = new URLSearchParams(url.hash.slice(1));
    hashTable = new ParamTable(
      $('hash'),
      hashParams,
      'Add hash param',
      onValueChange,
      onRowChange
    );

    positionSplitter();
    $('splitter').addEventListener('mousedown', tryStartDrag);
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
