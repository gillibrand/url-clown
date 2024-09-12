/**
 * Starts a drag and drop operation in response to a mousedown.
 *
 * @param {MouseEvent} e A mousedown event. Required for the original client coords.
 * @param {(diffX: number, diffY: number) => void} onMove Called each time the mouse moves during a
 * drag operation. Passed the x and y offset from the original click position.
 * @param {() => void | undefined} onEnd Called when drag completes, successfully or not.
 * @param {number} minX Min X position can drag to.
 * @param {number} maxX Max X position can drag to.
 */
function startDrag(e, onDrag, onEnd, minX, maxX) {
  document.body.addEventListener('mousemove', onMove);
  document.body.addEventListener('mouseup', onMouseUp);
  window.addEventListener('beforeunload', cleanUp);

  let startX = e.clientX;
  let startY = e.clientY;

  let isClean = false;

  /**
   * Cleans up all event listeners. Must be called at the end of any drag.
   */
  function cleanUp() {
    // avoid double calls
    if (isClean) return;
    isClean = true;
    document.body.removeEventListener('mousemove', onMove);
    document.body.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('beforeunload', cleanUp);

    if (onEnd) onEnd();
  }

  /**
   * Called on each mousemove during a drag.
   * @param {MouseEvent} e
   */
  function onMove(e) {
    if (!e.buttons) {
      cleanUp();
      return;
    }

    // XXX: This restricts how far we can drag and thus how small we can make columns. Feels too
    // specific to that case, plus too many params now.
    const diffX = Math.min(maxX, Math.max(minX, e.clientX)) - startX;
    const diffY = e.clientY - startY;

    onDrag(diffX, diffY);
  }

  /**
   * Called on mouseup, which  normally ends a drag.
   * @param {MouseEvent} e mouseup event.
   */
  function onMouseUp(e) {
    cleanUp();
  }
}

export { startDrag };
