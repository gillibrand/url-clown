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

function createNS(namespace, tagName, parentNode) {
  const el = document.createElementNS(namespace, tagName);
  if (parentNode) {
    parentNode.appendChild(el);
  }
  return el;
}

export { $, create, createNS };
