/**
 * Monaco scroll/highlight helper for click-to-source navigation (Task CTS-4).
 *
 * Click-to-source (see plan kaoto-visual-editing-flag, track CTS): clicking a canvas node in OFF mode
 * → normalized `pathId` (CTS-2) → YAML line (CTS-1) → Monaco reveal of that line + highlight.
 *
 * Isolates the Monaco API (`revealLineInCenter`, `deltaDecorations`, `Range`) in one place in order to:
 *   - reuse and test it without rendering KaotoModeler;
 *   - keep a single set of active decorations (a repeated reveal clears the previous highlight).
 *
 * The decoration is whole-line, with CSS class `kaoto-modeler__active-line` (see KaotoModeler.scss).
 *
 * @returns {{ attach: function, reveal: function, clear: function }}
 */
export const ACTIVE_LINE_CLASS = 'kaoto-modeler__active-line';

export function createLineRevealer() {
  let editor = null;
  let monacoApi = null;
  // Ids of the current decorations — deltaDecorations(prev, next) clears prev and returns the new ones.
  let decorations = [];

  const clear = () => {
    if (editor && decorations.length) {
      decorations = editor.deltaDecorations(decorations, []);
    } else {
      decorations = [];
    }
  };

  return {
    /**
     * Attach the Monaco instance (called from the editor's `onMount`).
     * @param {object} ed Monaco editor instance
     * @param {object} api global monaco API (for `Range`)
     */
    attach(ed, api) {
      editor = ed;
      monacoApi = api;
      decorations = [];
    },

    /**
     * Scrolls the editor to the line (centering it) and highlights it, clearing the previous highlight.
     * @param {number} line 1-based line number
     */
    reveal(line) {
      if (!editor || !monacoApi || !Number.isFinite(line) || line < 1) {
        return;
      }
      editor.revealLineInCenter(line);
      const range = new monacoApi.Range(line, 1, line, 1);
      decorations = editor.deltaDecorations(decorations, [
        {
          range,
          options: {
            isWholeLine: true,
            className: ACTIVE_LINE_CLASS,
            // separate class for highlighting in the gutter (line number) — optional, but helps it stand out
            linesDecorationsClassName: ACTIVE_LINE_CLASS
          }
        }
      ]);
    },

    /** Remove the active highlight (without scrolling). */
    clear
  };
}
