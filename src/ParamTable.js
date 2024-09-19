import { create, createNS } from './utils.js';

/**
 * Builds the DOM nodes for a single row of a pairs section.
 *
 * @param {Node | undefined} optionalParentNode Parent node to append the row to.
 * @returns {[Node, Node, Node]} Tuple of newly created row, name input, and value input.
 */
function createRow(optionalParentNode) {
  const row = create('div', optionalParentNode);
  row.classList.add('ParamTable__row');

  const nameInput = create('input', row);
  nameInput.spellcheck = false;
  nameInput.dataset['name'] = '';

  var eq = create('span', row);
  eq.textContent = '=';
  eq.className = 'ParamTable__eq';
  eq.title = 'Resize columns';

  const valueInput = create('input', row);
  valueInput.spellcheck = false;

  const deleteButton = create('button', row);
  deleteButton.className = 'delete-button';
  deleteButton.title = 'Delete';
  deleteButton.type = 'button';

  const svg = createNS('http://www.w3.org/2000/svg', 'svg', deleteButton);
  const use = createNS('http://www.w3.org/2000/svg', 'use', svg);
  use.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'xlink:href',
    '../icons/symbol/sheet.svg#close'
  );

  return [row, nameInput, valueInput, toolbar, deleteButton];
}

class ParamTable {
  /**
   *
   * @param {HTMLSection} sectionEl Section to apps all the pair rows to.
   * @param {URLSearchParams} initialParams Name, value pairs.
   * @param {String} placeholderText Placeholder text to use for the "add new" row name input.
   * @param {()=>void} onValueChange Callback when a param name or value changes.
   * @param {()=>void} onRowChange Callback when param row is added or deleted.
   */
  constructor(
    sectionEl,
    initialParams,
    placeholderText,
    onValueChange,
    onRowChange
  ) {
    this.el = sectionEl;
    this.onRowChange = onRowChange;
    this.placeholder = placeholderText;

    const frag = document.createDocumentFragment();

    initialParams.forEach((value, name) => {
      const [, nameInput, valueInput] = createRow(frag);
      nameInput.value = name;
      valueInput.value = value || '';
    });

    const [, nameInput] = createRow(frag);
    nameInput.placeholder = placeholderText;

    this.el.appendChild(frag);
    this._renderDeleteButtons();

    this.el.addEventListener('input', () => {
      this._addNewRowIfNeeded();
      onValueChange();
    });

    this.el.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button && button.classList.contains('delete-button')) {
        e.stopPropagation();
        this._deleteRow(button.closest('.ParamTable__row'));
      }
    });
  }

  /**
   *
   * @param {HTMLElement} row
   */
  _deleteRow(row) {
    const rows = this.el.querySelectorAll('.ParamTable__row');
    if (rows.length === 1) {
      row.querySelectorAll('input').forEach((input) => {
        input.value = '';
      });
    } else {
      row.parentNode.removeChild(row);
      this.onRowChange();
    }

    this._renderPlaceholders();
    this._renderDeleteButtons();
  }

  /**
   * Updates the visibility of the Delete buttons. If there is only an empty row, they (it) are
   * hidden. Otherwise they are all shown in this table.
   */
  _renderDeleteButtons() {
    const rows = this.el.querySelectorAll('.ParamTable__row');

    if (rows.length > 1) {
      const buttons = Array.from(this.el.querySelectorAll('.delete-button'));
      const mostButtons = buttons.slice(0, -1);
      mostButtons.forEach((b) => (b.disabled = false));
      // Last placeholder row cannot be deleted
      buttons.at(-1).disabled = true;
    } else {
      const oneRow = rows[0];
      const hasAnyText = Array.from(oneRow.querySelectorAll('input')).some(
        (input) => input.value.trim()
      );

      const button = oneRow.querySelector('.delete-button');
      button.disabled = !hasAnyText;
    }
  }

  /**
   * Checks a pairs section to see if if has an empty "add new" row or not. Once the user types into
   * this row, this function will fire and check if they have dirtied the "add new" row or not. If so,
   * the styles are removed from that active row, and new, empty, "add new" row is added to the
   * section.
   *
   * @param {HTMLSection} section The pairs section to check and add to.
   */
  _addNewRowIfNeeded() {
    const rows = Array.from(this.el.querySelectorAll('.ParamTable__row'));
    const lastRow = rows[rows.length - 1];
    const [oldNameInput] = lastRow.querySelectorAll('input');

    // If there is a name in this row, it's usable, so "dirty" and we can proceed and will need a new
    // one.
    const hasNameText = oldNameInput.value.trim();
    if (!hasNameText) return;

    // Turn into normal row.
    oldNameInput.placeholder = '';

    // Build the "new" row
    const [newRow, newNameInput] = createRow();
    newNameInput.placeholder = this.placeholder;

    // Animate height when it's added.
    const startH = this.el.offsetHeight;
    this.el.appendChild(newRow);
    const endH = this.el.offsetHeight;
    const anim = this.el.animate(
      {
        height: [`${startH}px`, `${endH}px`],
      },
      {
        duration: 200,
      }
    );

    this._renderPlaceholders();
    this._renderDeleteButtons();

    // Splitter neeeds new height.
    anim.finished.then(() => this.onRowChange());
  }

  /**
   * Updates the placeholder text in the name inputs. Only the last "add new" row will show any text.
   */
  _renderPlaceholders() {
    const nameInputs = Array.from(this.el.querySelectorAll('[data-name]'));
    const lastInput = nameInputs.at(-1);
    const otherInputs = nameInputs.slice(0, -1);

    otherInputs.forEach((input) => (input.placeholder = ''));
    lastInput.placeholder = this.placeholder;
  }

  /**
   * Reads the name value pairs from a section element of the DOM. Call on hash and query sections
   * separately.
   * @param {HTMLElement} element Root element to read pairs from. A section normally.
   * @returns {Array<[string, string]>} Name-value pairs.
   */
  getNameValuePairs() {
    const rows = Array.from(this.el.querySelectorAll('.ParamTable__row'));

    const nameValuePairs = [];
    for (let row of rows) {
      const [nameInput, valueInput] = row.querySelectorAll('input');

      // Skip empty names
      if (!nameInput.value.trim()) continue;

      nameValuePairs.push([nameInput.value.trim(), valueInput.value.trim()]);
    }

    return nameValuePairs;
  }
}

export { ParamTable };
