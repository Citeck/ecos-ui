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
