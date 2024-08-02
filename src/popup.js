function $(id) {
  return document.getElementById(id);
}

/** Convenience to create an element. */
function create(tagName, parentNode) {
  const el = document.createElement(tagName);
  if (parentNode) {
    parentNode.appendChild(el);
  }
  return el;
}

function buildRow(parentNode) {
  const row = create('div', parentNode);
  row.classList.add('pairs__row');

  const nameInput = create('input', row);
  create('span', row).textContent = '=';
  const valueInput = create('input', row);

  return [row, nameInput, valueInput];
}

function renderSection(params, sectionEl, newLabel) {
  const frag = document.createDocumentFragment();

  params.forEach((value, name) => {
    const [, nameInput, valueInput] = buildRow(frag);
    nameInput.value = name;
    valueInput.value = value || '';
  });

  const [newRow, nameInput] = buildRow(frag);
  newRow.classList.add('is-new');
  nameInput.placeholder = newLabel;

  sectionEl.appendChild(frag);
}

let activeTab;

function addNewRowIfNeeded(section) {
  const rows = Array.from(section.querySelectorAll('.pairs__row'));
  const lastRow = rows[rows.length - 1];
  const [oldNameInput] = lastRow.querySelectorAll('input');

  const hasNameText = oldNameInput.value.trim();
  if (!hasNameText) return;

  lastRow.classList.remove('is-new');
  const placeholder = oldNameInput.placeholder;
  oldNameInput.placeholder = '';

  const [newRow, newNameInput] = buildRow();
  newRow.classList.add('is-new');
  newNameInput.placeholder = placeholder;

  // Now animate height when it's added.
  const startH = section.offsetHeight;
  section.appendChild(newRow);
  const endH = section.offsetHeight;
  section.animate(
    {
      height: [`${startH}px`, `${endH}px`],
    },
    {
      duration: 200,
    }
  );
}

const EmptyValueRe = /(=(?=&))|(=$)/g;

function asParamString(nameValuePairs) {
  const string = new URLSearchParams(nameValuePairs).toString();
  return string.replaceAll(EmptyValueRe, '');
}

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

function updateActiveTabUrl() {
  const queryPairs = getNameValuePairs($('query'));
  const hashPairs = getNameValuePairs($('hash'));

  const url = new URL(activeTab.url);

  url.pathname = encodeURI($('pathname').value.trim());

  const queryString = asParamString(queryPairs);
  if (queryString) {
    url.search = '?' + queryString;
  }

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

document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    activeTab = tab;
    const url = new URL(tab.url);

    $('pathname').value = decodeURI(url.pathname);

    const queryParams = new URLSearchParams(url.search);
    renderSection(queryParams, $('query'), 'Add query param');

    const hashParams = new URLSearchParams(url.hash.slice(1));
    renderSection(hashParams, $('hash'), 'Add hash param');
  });

  $('form').addEventListener('input', (e) => {
    $('ok').disabled = false;

    const section = e.target.closest('section');

    if (section) {
      addNewRowIfNeeded(section);
    }
  });

  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    $('ok').disabled = true;
    updateActiveTabUrl();
  });

  $('cancel').addEventListener('click', () => {
    window.close();
  });
});
