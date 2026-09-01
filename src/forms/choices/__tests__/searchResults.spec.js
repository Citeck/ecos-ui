import Choices from '../index';

/**
 * COREDEV-359: typing in a select rendered only four matches — choices.js caps the rendered search
 * results at `searchResultLimit` (4 by default) — while the dropdown kept the height of the full
 * list, so the truncated list looked like the complete answer padded with empty space.
 */
describe('Choices search results', () => {
  const LABELS = [
    'Open in Background',
    'Open URL',
    'Open Submit Form',
    'Download',
    'Download Card Template',
    'Download by Template',
    'Content Preview Modal',
    'Task Outcome'
  ];

  let element;
  let choices;

  const build = (config = {}) => {
    element = document.createElement('select');
    document.body.appendChild(element);

    choices = new Choices(element, { searchEnabled: true, shouldSort: false, ...config });
    choices.setChoices(
      LABELS.map(label => ({ value: label, label })),
      'value',
      'label',
      true
    );

    return choices;
  };

  /** Runs a search the way a keystroke does, and returns how many choices fuse matched. */
  const search = value => {
    const found = choices._searchChoices(value);

    choices._renderChoices();

    return found;
  };

  const renderedChoices = () => choices.dropdown.element.querySelectorAll('[data-choice]').length;

  afterEach(() => {
    choices.destroy();
    element.remove();
  });

  it('renders every match, not just the first four', () => {
    build();

    const found = search('o');

    expect(found).toBeGreaterThan(4);
    expect(renderedChoices()).toBe(found);
  });

  it('still renders the whole list when nothing is being searched', () => {
    build();

    choices._renderChoices();

    expect(renderedChoices()).toBe(LABELS.length);
  });

  it('honours a limit set explicitly by the caller', () => {
    build({ searchResultLimit: 2 });

    const found = search('o');

    expect(found).toBeGreaterThan(2);
    expect(renderedChoices()).toBe(2);
  });

  it('leaves no min-height on the dropdown to outlive the filtered list', () => {
    build();

    choices.showDropdown();
    choices.recalcDropdownPosition();

    expect(choices.dropdown.element.style.minHeight).toBe('');
  });

  /**
   * COREDEV-359 (follow-up): replacing the option list while a search is running used to show the
   * full list back. `setChoices(..., true)` clears the store, and the `active` flags the filter had
   * set go with it — every option is re-added active, while `_isSearching` and the typed text stay
   * as they were. Callers do this under an open search: EcosSelect's infinite scroll at the bottom
   * of a filtered list, and any refresh going through `setItems`.
   */
  describe('a replace-setChoices under a running search', () => {
    const replaceAll = () =>
      choices.setChoices(
        LABELS.map(label => ({ value: label, label })),
        'value',
        'label',
        true
      );

    it('keeps rendering only the matches', () => {
      build();

      // three of the eight labels — a count the full list cannot be mistaken for
      const found = search('down');
      expect(found).toBe(3);

      replaceAll();

      expect(renderedChoices()).toBe(found);
    });

    it('keeps the store filtered down to the matches', () => {
      build();

      const found = search('down');

      replaceAll();

      expect(choices._store.activeChoices).toHaveLength(found);
    });

    it('leaves the list alone when nothing is being searched', () => {
      build();

      replaceAll();

      expect(renderedChoices()).toBe(LABELS.length);
      expect(choices._store.activeChoices).toHaveLength(LABELS.length);
    });
  });

  it('re-anchors an open dropdown to the list it now shows, and leaves a closed one alone', () => {
    build();

    const recalc = jest.spyOn(choices, 'recalcDropdownPosition').mockImplementation(() => {});

    choices._renderChoices();
    expect(recalc).not.toHaveBeenCalled();

    choices.dropdown.show();
    choices._renderChoices();
    expect(recalc).toHaveBeenCalled();

    recalc.mockRestore();
  });
});
