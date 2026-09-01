import { renderHook, act } from '@testing-library/react';

import additionalContextService from '../AdditionalContextService';
import useAutocomplete from '../hooks/useAutocomplete';

import { ADDITIONAL_CONTEXT_TYPES } from '@/components/ai/AIAssistant/constants';

jest.mock('../AdditionalContextService', () => ({
  __esModule: true,
  default: {
    searchRecordsByDisp: jest.fn()
  }
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

const CURRENT_RECORD = {
  recordRef: 'emodel/contract@current',
  displayName: 'Contract No. 42',
  type: 'emodel/type@contract'
};

const QUERY = 'contr';

const setup = ({
  currentRecord = CURRENT_RECORD,
  searchResults = [],
  contextRecords = [],
  contextDocuments = [],
  documents = [],
  autoContextArtifacts,
  // Makes getAdditionalContext(CURRENT_RECORD) — the handler's first await — hang forever,
  // to inspect the state between switching the list on and the first dependency answering.
  holdCurrentRecord = false
} = {}) => {
  additionalContextService.searchRecordsByDisp.mockResolvedValue(searchResults);

  const getAdditionalContext = jest.fn(async type => {
    if (type === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {
      if (holdCurrentRecord) {
        return new Promise(() => {});
      }
      return currentRecord;
    }
    if (type === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) {
      return documents;
    }
    return null;
  });

  // Built once rather than per render, the way the real caller passes it: it comes from state in
  // `useAdditionalContext`, so its identity only changes when the context itself does.
  const additionalContext = { records: contextRecords, documents: contextDocuments };

  return renderHook(() =>
    useAutocomplete({
      getAdditionalContext,
      additionalContext,
      // Left out entirely when the caller did not pass it, so the hook's own default is exercised.
      ...(autoContextArtifacts !== undefined ? { autoContextArtifacts } : {})
    })
  );
};

/** Types `@<query>` into the input, which is what loads the current record and runs the search. */
const typeMention = async (result, query = QUERY, element = null) => {
  const value = `@${query}`;
  await act(async () => {
    await result.current.handleAutocompleteInputChange(value, value.length, element);
  });
};

/**
 * Stub of the input field element: jsdom does no layout, so the real getBoundingClientRect
 * returns zeros and the rectangle has to be supplied by hand.
 */
const fieldAt = ({ top, bottom, left = 20 }) => ({
  getBoundingClientRect: () => ({ top, bottom, left, right: left + 600, width: 600, height: bottom - top })
});

const optionRefs = options => options.map(option => option.data && option.data.recordRef);

describe('useAutocomplete: building the @ option list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists the current record exactly once when the search returns it too (D-B-18)', async () => {
    const { result } = setup({
      searchResults: [
        { recordRef: 'emodel/contract@current', displayName: 'Contract No. 42' },
        { recordRef: 'emodel/contract@other', displayName: 'Contract No. 43' }
      ]
    });

    await typeMention(result);
    const options = result.current.filteredAutocompleteOptions;

    expect(optionRefs(options).filter(ref => ref === 'emodel/contract@current')).toHaveLength(1);
    expect(optionRefs(options)).toEqual(['emodel/contract@current', 'emodel/contract@other']);
    // The single entry is the current-record one, so selecting it toggles the context flag
    // instead of adding the record a second time.
    expect(options[0].type).toBe(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
    expect(options[1].type).toBe('search_result');
  });

  it('keeps every search result other than the current record', async () => {
    const { result } = setup({
      searchResults: [
        { recordRef: 'emodel/contract@a', displayName: 'Contract A' },
        { recordRef: 'emodel/contract@b', displayName: 'Contract B' },
        { recordRef: 'emodel/contract@c', displayName: 'Contract C' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual([
      'emodel/contract@current',
      'emodel/contract@a',
      'emodel/contract@b',
      'emodel/contract@c'
    ]);
  });

  it('hides a record already added to the context, both as current record and as a search result', async () => {
    const { result } = setup({
      contextRecords: [{ recordRef: 'emodel/contract@current' }],
      searchResults: [
        { recordRef: 'emodel/contract@current', displayName: 'Contract No. 42' },
        { recordRef: 'emodel/contract@other', displayName: 'Contract No. 43' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@other']);
  });

  it('hides a record already in the context even when the context stores it without the app prefix', async () => {
    const { result } = setup({
      contextRecords: [{ recordRef: 'contract@current' }],
      searchResults: [{ recordRef: 'emodel/contract@current', displayName: 'Contract No. 42' }]
    });

    await typeMention(result);

    expect(result.current.filteredAutocompleteOptions).toEqual([]);
  });

  it('collapses duplicates inside the search results themselves', async () => {
    const { result } = setup({
      searchResults: [
        { recordRef: 'emodel/contract@a', displayName: 'Contract A' },
        { recordRef: 'emodel/contract@a', displayName: 'Contract A' },
        { recordRef: 'contract@a', displayName: 'Contract A' },
        { recordRef: 'emodel/contract@b', displayName: 'Contract B' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual([
      'emodel/contract@current',
      'emodel/contract@a',
      'emodel/contract@b'
    ]);
  });

  it('builds no current-record entry when there is no current record', async () => {
    const { result } = setup({ currentRecord: null });

    await typeMention(result);

    // Without a current record there is no type to search by, so the list is empty rather than
    // carrying a stray "current record" row.
    expect(additionalContextService.searchRecordsByDisp).not.toHaveBeenCalled();
    expect(result.current.filteredAutocompleteOptions).toEqual([]);
  });

  it('builds the list from search results alone when the current record does not match the query', async () => {
    const { result } = setup({
      currentRecord: { ...CURRENT_RECORD, displayName: 'Договор № 42' },
      searchResults: [
        { recordRef: 'emodel/contract@current', displayName: 'Contract No. 42' },
        { recordRef: 'emodel/contract@other', displayName: 'Contract No. 43' }
      ]
    });

    await typeMention(result);
    const options = result.current.filteredAutocompleteOptions;

    // The current record is filtered out by the query, so its single appearance comes from the
    // search results — still exactly one row for it.
    expect(optionRefs(options)).toEqual(['emodel/contract@current', 'emodel/contract@other']);
    expect(options.every(option => option.type === 'search_result')).toBe(true);
  });

  it('treats reference formats that differ by the app prefix as one record', async () => {
    const { result } = setup({
      searchResults: [
        { recordRef: 'contract@current', displayName: 'Contract No. 42' },
        { recordRef: 'contract@other', displayName: 'Contract No. 43' }
      ]
    });

    await typeMention(result);
    const options = result.current.filteredAutocompleteOptions;

    expect(optionRefs(options)).toEqual(['emodel/contract@current', 'contract@other']);
    expect(options[0].type).toBe(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD);
  });

  it('still lists documents alongside records', async () => {
    const { result } = setup({
      searchResults: [{ recordRef: 'emodel/contract@other', displayName: 'Contract No. 43' }],
      documents: [{ recordRef: 'emodel/doc@1', displayName: 'Contract scan' }]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual([
      'emodel/contract@current',
      'emodel/contract@other',
      'emodel/doc@1'
    ]);
  });
});

describe('useAutocomplete: deduplication against auto-context chips (D-405-1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not offer a record already shown as an auto-context chip', async () => {
    const { result } = setup({
      autoContextArtifacts: [{ ref: 'emodel/contract@other' }],
      searchResults: [
        { recordRef: 'emodel/contract@other', displayName: 'Contract No. 43' },
        { recordRef: 'emodel/contract@third', displayName: 'Contract No. 44' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/contract@third']);
  });

  it('does not offer the current record when it is an auto-context chip', async () => {
    const { result } = setup({
      autoContextArtifacts: [{ ref: 'emodel/contract@current' }],
      searchResults: [{ recordRef: 'emodel/contract@other', displayName: 'Contract No. 43' }]
    });

    await typeMention(result);
    const options = result.current.filteredAutocompleteOptions;

    expect(optionRefs(options)).toEqual(['emodel/contract@other']);
    expect(options.every(option => option.type === 'search_result')).toBe(true);
  });

  it('compares references ignoring the app prefix', async () => {
    const { result } = setup({
      autoContextArtifacts: [{ ref: 'contract@1a2b' }],
      searchResults: [{ recordRef: 'emodel/contract@1a2b', displayName: 'Contract No. 43' }]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current']);
  });

  it('does not hide records of different apps that share a local id', async () => {
    const { result } = setup({
      autoContextArtifacts: [{ ref: 'alfresco/contract@1a2b' }],
      searchResults: [{ recordRef: 'emodel/contract@1a2b', displayName: 'Contract No. 43' }]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/contract@1a2b']);
  });

  it('keeps a record that is in no context collection at all', async () => {
    const { result } = setup({
      autoContextArtifacts: [{ ref: 'emodel/contract@elsewhere' }],
      contextRecords: [{ recordRef: 'emodel/contract@manual' }],
      searchResults: [{ recordRef: 'emodel/contract@free', displayName: 'Contract No. 43' }]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/contract@free']);
  });

  it('does not fail when auto-context is not passed at all', async () => {
    const { result } = setup({
      searchResults: [{ recordRef: 'emodel/contract@other', displayName: 'Contract No. 43' }]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/contract@other']);
  });

  it('hides a document already shown as an auto-context chip', async () => {
    const { result } = setup({
      autoContextArtifacts: [{ ref: 'emodel/doc@1' }],
      documents: [
        { recordRef: 'emodel/doc@1', displayName: 'Contract scan' },
        { recordRef: 'emodel/doc@2', displayName: 'Contract annex' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/doc@2']);
  });

  it('hides a context document stored under a reference with another app prefix (test 36)', async () => {
    const { result } = setup({
      contextDocuments: [{ recordRef: 'doc@1' }],
      documents: [
        { recordRef: 'emodel/doc@1', displayName: 'Contract scan' },
        { recordRef: 'emodel/doc@2', displayName: 'Contract annex' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/doc@2']);
  });

  // The documents are loaded for the current record and `loadDocumentsData` falls the parent
  // reference back to it, so the current record can be listed among its own documents. Offered
  // twice, it would be added to two different context collections by the two rows (D-405-1).
  it('does not offer the current record again as one of its own documents', async () => {
    const { result } = setup({
      documents: [
        { recordRef: 'emodel/contract@current', displayName: 'Contract No. 42' },
        { recordRef: 'emodel/doc@2', displayName: 'Contract annex' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/doc@2']);
  });

  it('does not offer a document that is already listed as a search result', async () => {
    const { result } = setup({
      searchResults: [{ recordRef: 'emodel/doc@1', displayName: 'Contract scan' }],
      documents: [
        { recordRef: 'emodel/doc@1', displayName: 'Contract scan' },
        { recordRef: 'emodel/doc@2', displayName: 'Contract annex' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/doc@1', 'emodel/doc@2']);
  });

  // Same entity, two spellings: the guard has to compare with isSameRecordRef like the others.
  it('does not offer a document already listed under another app prefix', async () => {
    const { result } = setup({
      searchResults: [{ recordRef: 'doc@1', displayName: 'Contract scan' }],
      documents: [
        { recordRef: 'emodel/doc@1', displayName: 'Contract scan' },
        { recordRef: 'emodel/doc@2', displayName: 'Contract annex' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'doc@1', 'emodel/doc@2']);
  });

  // Two documents naming the same record are one entry, whichever of them comes first.
  it('lists a duplicated document only once', async () => {
    const { result } = setup({
      documents: [
        { recordRef: 'emodel/doc@1', displayName: 'Contract scan' },
        { recordRef: 'emodel/doc@1', displayName: 'Contract scan' }
      ]
    });

    await typeMention(result);

    expect(optionRefs(result.current.filteredAutocompleteOptions)).toEqual(['emodel/contract@current', 'emodel/doc@1']);
  });

  // The list is read both while rendering and inside the key handler; recomputing it per reading
  // repeated the whole options × context sweep and let the two readings disagree.
  it('keeps one array identity while its inputs do not change', async () => {
    const { result, rerender } = setup({
      documents: [{ recordRef: 'emodel/doc@1', displayName: 'Contract scan' }]
    });

    await typeMention(result);

    const first = result.current.filteredAutocompleteOptions;
    rerender();

    expect(result.current.filteredAutocompleteOptions).toBe(first);
  });
});

describe('useAutocomplete: Escape must not reach the panel handler (D-405-5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const keyEvent = key => ({ key, stopPropagation: jest.fn(), preventDefault: jest.fn() });

  const SOME_OPTIONS = [
    { type: 'search_result', label: 'Contract No. 43', data: { recordRef: 'emodel/contract@other' } },
    { type: 'search_result', label: 'Contract No. 44', data: { recordRef: 'emodel/contract@third' } }
  ];

  it('stops Escape from bubbling while the list is open, and hides the list (test 11)', async () => {
    const { result } = setup();
    await typeMention(result);
    expect(result.current.showAutocomplete).toBe(true);

    const event = keyEvent('Escape');
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(event, SOME_OPTIONS);
    });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(handled).toBe(true);
    expect(result.current.showAutocomplete).toBe(false);
  });

  it('leaves the event alone when the list is closed (test 12)', () => {
    const { result } = setup();

    const event = keyEvent('Escape');
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(event, SOME_OPTIONS);
    });

    // With the list closed the panel handler on `document` is the one that should react.
    expect(event.stopPropagation).not.toHaveBeenCalled();
    expect(handled).toBe(false);
  });

  it('does not stop propagation for navigation keys (test 13)', async () => {
    const { result } = setup();
    await typeMention(result);

    const down = keyEvent('ArrowDown');
    const up = keyEvent('ArrowUp');
    const enter = keyEvent('Enter');
    let downHandled, upHandled, enterHandled;
    act(() => {
      downHandled = result.current.handleAutocompleteKeyDown(down, SOME_OPTIONS);
    });
    act(() => {
      upHandled = result.current.handleAutocompleteKeyDown(up, SOME_OPTIONS);
    });
    act(() => {
      enterHandled = result.current.handleAutocompleteKeyDown(enter, SOME_OPTIONS);
    });

    // The keys are still handled as before...
    expect(downHandled).toBe(true);
    expect(upHandled).toBe(true);
    // Down from «nothing picked» lands on the first variant, Up from the first wraps to the last —
    // so the pair leaves the last one current, and that is what Enter takes (D-B-23).
    expect(enterHandled).toEqual(SOME_OPTIONS[SOME_OPTIONS.length - 1]);
    // ...but none of them needs to be kept away from the document handler.
    expect(down.stopPropagation).not.toHaveBeenCalled();
    expect(up.stopPropagation).not.toHaveBeenCalled();
    expect(enter.stopPropagation).not.toHaveBeenCalled();
    expect(result.current.showAutocomplete).toBe(true);
  });

  it('stops Escape while the spinner stands in for the list (test 14)', async () => {
    const { result } = setup();
    // The search never answers, so the list is on screen showing the "searching" row and no
    // options — the case the empty-options branch below exists for.
    additionalContextService.searchRecordsByDisp.mockReturnValue(new Promise(() => {}));
    await act(async () => {
      result.current.handleAutocompleteInputChange(`@${QUERY}`, QUERY.length + 1, null);
    });
    expect(result.current.isSearchIndicatorVisible).toBe(true);

    const event = keyEvent('Escape');
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(event, []);
    });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(handled).toBe(true);
    expect(result.current.showAutocomplete).toBe(false);
  });

  // `showAutocomplete` stays true after an `@` whose query matches nothing, but AIAssistantChat
  // renders no list in that state. Consuming Escape there spends the press on nothing visible: the
  // panel stays open and the key reads as dead.
  it('lets Escape through to the panel when the open list draws nothing (test 14a)', async () => {
    const { result } = setup({ currentRecord: null });
    await typeMention(result);
    expect(result.current.showAutocomplete).toBe(true);
    expect(result.current.filteredAutocompleteOptions).toEqual([]);
    expect(result.current.isAutocompleteListVisible([])).toBe(false);

    const event = keyEvent('Escape');
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(event, []);
    });

    expect(event.stopPropagation).not.toHaveBeenCalled();
    expect(handled).toBe(false);
  });

  // Same state, the other key: an `@` inside an ordinary email address opens the list, which then
  // matches nothing — and Enter has to send the message rather than be swallowed by an invisible
  // selection.
  it('lets Enter send a message whose text merely contains an address (test 14b)', async () => {
    const { result } = setup({ currentRecord: null });
    await act(async () => {
      await result.current.handleAutocompleteInputChange('напиши на a@b.com', 'напиши на a@b.com'.length, null);
    });

    const event = keyEvent('Enter');
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(event, []);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(handled).toBe(false);
  });
});

describe('useAutocomplete: list position relative to the input field (D-405-4)', () => {
  // Constants from useAutocomplete.js.
  const GAP = 8;
  const MAX_HEIGHT = 200;

  const originalInnerHeight = window.innerHeight;
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom defaults to 768×1024; pin both so the tests do not depend on the environment.
    window.innerHeight = 768;
    window.innerWidth = 1024;
  });

  afterEach(() => {
    window.innerHeight = originalInnerHeight;
    window.innerWidth = originalInnerWidth;
  });

  it('puts the list above the input field, anchored by its bottom edge (test 15)', async () => {
    const { result } = setup();
    // The field sits at the bottom edge of the window, as in the real panel.
    await typeMention(result, QUERY, fieldAt({ top: 700, bottom: 760 }));

    const position = result.current.autocompletePosition;
    expect(position.top).toBeUndefined();
    expect(position.bottom).toBe(window.innerHeight - 700 + GAP);
    expect(position.maxHeight).toBe(MAX_HEIGHT);
    // The list's actual bottom screen coordinate is above the field's top.
    expect(window.innerHeight - position.bottom).toBeLessThan(700);
  });

  it('cuts the list height down to the free space above the field (test 16)', async () => {
    window.innerHeight = 300;
    const { result } = setup();
    // A field in the middle of a low window: 150px above it, less than the 200px style cap.
    await typeMention(result, QUERY, fieldAt({ top: 150, bottom: 210 }));

    const position = result.current.autocompletePosition;
    expect(position.maxHeight).toBe(150 - GAP);
    // Both actual screen coordinates stay inside the window: a positive maxHeight alone is
    // compatible with a fully invisible list, so the coordinates are what gets checked.
    const listBottom = window.innerHeight - position.bottom;
    const listTop = listBottom - position.maxHeight;
    expect(listTop).toBeGreaterThanOrEqual(0);
    expect(listBottom).toBeLessThanOrEqual(window.innerHeight);
  });

  it('follows the cursor horizontally and stays inside the right edge (test 17)', async () => {
    const { result } = setup();
    // `@contr` is 6 characters before the cursor: left = rect.left + padding + 6 * charWidth.
    await typeMention(result, QUERY, fieldAt({ top: 700, bottom: 760, left: 20 }));
    expect(result.current.autocompletePosition.left).toBe(20 + 12 + 6 * 8);

    // A field close to the right edge: the same formula would land past the window, so it is
    // capped at innerWidth - 300 as before.
    await typeMention(result, QUERY, fieldAt({ top: 700, bottom: 760, left: 900 }));
    expect(result.current.autocompletePosition.left).toBe(window.innerWidth - 300);
  });

  // `ChatInput` sets the field's height from its `scrollHeight` in an effect, so on the keystroke
  // that wraps the text to a new line the rectangle read inside the change handler still describes
  // the field one line shorter. Anchored to that stale top edge, the list ends up over the field's
  // new first line — the very defect the bottom anchoring was introduced for — and stays there for
  // as long as the user stops typing.
  it('re-measures the position after the field has grown (test 15a)', async () => {
    const { result } = setup();

    let measurements = 0;
    const growingField = {
      getBoundingClientRect: () => {
        measurements += 1;
        // First read: the field is still one line high. Every later read sees the grown field,
        // exactly as the browser would once ChatInput's resize effect has run.
        const top = measurements === 1 ? 700 : 680;
        return { top, bottom: 760, left: 20, right: 620, width: 600, height: 760 - top };
      }
    };

    await typeMention(result, QUERY, growingField);

    expect(measurements).toBeGreaterThan(1);
    expect(result.current.autocompletePosition.bottom).toBe(window.innerHeight - 680 + GAP);
    // The list's bottom edge is above the field's grown top edge, not 20px into it.
    expect(window.innerHeight - result.current.autocompletePosition.bottom).toBeLessThanOrEqual(680);
  });

  it('computes the position before the first await (test 32)', async () => {
    const { result } = setup({ holdCurrentRecord: true });

    // The handler is intentionally not awaited: its first dependency never answers, and the
    // assertion is about the frame between switching the list on and that answer arriving.
    const value = `@${QUERY}`;
    await act(async () => {
      result.current.handleAutocompleteInputChange(value, value.length, fieldAt({ top: 700, bottom: 760 }));
    });

    // The list is already on — and its position is already computed from the passed element,
    // not left over from a previous input.
    expect(result.current.showAutocomplete).toBe(true);
    const position = result.current.autocompletePosition;
    expect(position.top).toBeUndefined();
    expect(position.bottom).toBe(window.innerHeight - 700 + GAP);
    expect(position.maxHeight).toBe(MAX_HEIGHT);
  });

  it('flips the list under the field when the space above is below the threshold (test 35)', async () => {
    const { result } = setup();
    // A field at the very top of the window: 60px above it is less than AUTOCOMPLETE_MIN_HEIGHT.
    await typeMention(result, QUERY, fieldAt({ top: 60, bottom: 120 }));

    const position = result.current.autocompletePosition;
    expect(position.bottom).toBeUndefined();
    expect(position.top).toBe(120 + GAP);
    // The list stays entirely inside the window.
    expect(position.top).toBeGreaterThanOrEqual(0);
    expect(position.top + position.maxHeight).toBeLessThanOrEqual(window.innerHeight);
    expect(position.maxHeight).toBe(Math.min(window.innerHeight - 120 - GAP, MAX_HEIGHT));
  });
});

describe('useAutocomplete: the list follows the panel off the screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Same wiring as `setup`, but with the panel visibility as a rerenderable prop: the whole point
  // is what happens when it flips.
  const setupWithVisibility = (isPanelVisible = true) => {
    additionalContextService.searchRecordsByDisp.mockResolvedValue([]);

    const getAdditionalContext = jest.fn(async type => {
      if (type === ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD) {
        return CURRENT_RECORD;
      }
      if (type === ADDITIONAL_CONTEXT_TYPES.DOCUMENTS) {
        return [];
      }
      return null;
    });

    return renderHook(props => useAutocomplete({ getAdditionalContext, additionalContext: { records: [], documents: [] }, ...props }), {
      initialProps: { isPanelVisible }
    });
  };

  it('closes an open list when the panel is minimized', async () => {
    const { result, rerender } = setupWithVisibility();
    await typeMention(result);
    expect(result.current.showAutocomplete).toBe(true);

    // The panel is minimized: it stays mounted, so nothing unmounts the list — only this closes it.
    act(() => {
      rerender({ isPanelVisible: false });
    });

    expect(result.current.showAutocomplete).toBe(false);
  });

  it('does not bring the list back when the panel is restored', async () => {
    const { result, rerender } = setupWithVisibility();
    await typeMention(result);

    act(() => {
      rerender({ isPanelVisible: false });
    });
    act(() => {
      rerender({ isPanelVisible: true });
    });

    // Restoring the panel is not a mention: the list reopens only when the user types `@` again,
    // and any other answer would put it back at the rectangle measured before the minimize.
    expect(result.current.showAutocomplete).toBe(false);
  });

  // The hide-on-minimize effect above runs only after paint, so there is a frame where
  // `showAutocomplete` is still true with the panel already gone. The list must not be drawn on
  // that frame either — `isAutocompleteListVisible` is the render condition in `AIAssistantChat`,
  // and it has to say "no" from the panel visibility alone, before the effect resets the state.
  it('reports the list as not drawn while the panel is invisible, even with the state still open', async () => {
    const { result } = setupWithVisibility(false);
    // The mount effect ran with the list already closed, so it changes nothing; typing a mention
    // now reproduces the gap state: `showAutocomplete` true, panel invisible, effect not re-run.
    await typeMention(result);
    expect(result.current.showAutocomplete).toBe(true);

    const options = result.current.filteredAutocompleteOptions;
    expect(options.length).toBeGreaterThan(0);
    expect(result.current.isAutocompleteListVisible(options)).toBe(false);
  });

  it('leaves an open list alone while the panel stays visible', async () => {
    const { result, rerender } = setupWithVisibility();
    await typeMention(result);

    // An unrelated re-render of the panel must not be mistaken for it going away.
    act(() => {
      rerender({ isPanelVisible: true });
    });

    expect(result.current.showAutocomplete).toBe(true);
  });
});

// D-B-23, case B11. The list opens on every `@`, so «picked» has to be something the user does —
// otherwise Enter can only ever mean «insert a mention», and a message that merely names somebody
// cannot be sent while the list is up.
describe('useAutocomplete: nothing is picked until the user picks it (D-B-23)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const keyEvent = key => ({ key, stopPropagation: jest.fn(), preventDefault: jest.fn() });

  const OPTIONS = [
    { type: 'search_result', label: 'Contract No. 43', data: { recordRef: 'emodel/contract@other' } },
    { type: 'search_result', label: 'Contract No. 44', data: { recordRef: 'emodel/contract@third' } }
  ];

  const openList = async result => {
    await typeMention(result);
    expect(result.current.showAutocomplete).toBe(true);
  };

  it('opens the list with no variant current', async () => {
    const { result } = setup();
    await openList(result);

    expect(result.current.selectedAutocompleteIndex).toBe(-1);
  });

  it('lets Enter through to the form while nothing is picked', async () => {
    const { result } = setup();
    await openList(result);

    const enter = keyEvent('Enter');
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(enter, OPTIONS);
    });

    // `false` is what tells `AIAssistantChat` the key is none of the list's business.
    expect(handled).toBe(false);
    expect(enter.preventDefault).not.toHaveBeenCalled();
  });

  it('inserts the mention once a variant has been chosen with the arrow keys', async () => {
    const { result } = setup();
    await openList(result);

    act(() => {
      result.current.handleAutocompleteKeyDown(keyEvent('ArrowDown'), OPTIONS);
    });
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(keyEvent('Enter'), OPTIONS);
    });

    expect(handled).toEqual(OPTIONS[0]);
  });

  // One press, no arrow keys — the reason Tab keeps a meaning of its own here.
  it('completes the first match on Tab while nothing is picked', async () => {
    const { result } = setup();
    await openList(result);

    const tab = keyEvent('Tab');
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(tab, OPTIONS);
    });

    expect(handled).toEqual(OPTIONS[0]);
    expect(tab.preventDefault).toHaveBeenCalled();
  });

  it('picks the last variant when the first move is Up', async () => {
    const { result } = setup();
    await openList(result);

    act(() => {
      result.current.handleAutocompleteKeyDown(keyEvent('ArrowUp'), OPTIONS);
    });
    let handled;
    act(() => {
      handled = result.current.handleAutocompleteKeyDown(keyEvent('Enter'), OPTIONS);
    });

    expect(handled).toEqual(OPTIONS[OPTIONS.length - 1]);
  });

  it('forgets the choice when the query is typed on', async () => {
    const { result } = setup({ searchResults: OPTIONS.map(option => option.data) });
    await openList(result);

    act(() => {
      result.current.handleAutocompleteKeyDown(keyEvent('ArrowDown'), OPTIONS);
    });
    expect(result.current.selectedAutocompleteIndex).toBe(0);

    await typeMention(result, 'contra');

    expect(result.current.selectedAutocompleteIndex).toBe(-1);
  });

  // The second half of D-B-23: while the search is running the list shows a spinner and no
  // variants, and Enter used to be swallowed there — dead for as long as the search took.
  describe('while the search is still running', () => {
    const openSpinner = async result => {
      additionalContextService.searchRecordsByDisp.mockReturnValue(new Promise(() => {}));
      await act(async () => {
        result.current.handleAutocompleteInputChange(`@${QUERY}`, QUERY.length + 1, null);
      });
      expect(result.current.isSearchIndicatorVisible).toBe(true);
    };

    it('lets Enter through', async () => {
      const { result } = setup();
      await openSpinner(result);

      const enter = keyEvent('Enter');
      let handled;
      act(() => {
        handled = result.current.handleAutocompleteKeyDown(enter, []);
      });

      expect(handled).toBe(false);
      expect(enter.preventDefault).not.toHaveBeenCalled();
    });

    // Tab still has nothing to complete, and letting it through would carry the focus out of a
    // half-typed mention.
    it('still swallows Tab', async () => {
      const { result } = setup();
      await openSpinner(result);

      const tab = keyEvent('Tab');
      let handled;
      act(() => {
        handled = result.current.handleAutocompleteKeyDown(tab, []);
      });

      expect(handled).toBe(true);
      expect(tab.preventDefault).toHaveBeenCalled();
    });

    // Escape belongs to the list as before: one press closes it, the next closes the panel.
    it('still consumes Escape', async () => {
      const { result } = setup();
      await openSpinner(result);

      const escape = keyEvent('Escape');
      let handled;
      act(() => {
        handled = result.current.handleAutocompleteKeyDown(escape, []);
      });

      expect(handled).toBe(true);
      expect(escape.stopPropagation).toHaveBeenCalled();
      expect(result.current.showAutocomplete).toBe(false);
    });
  });
});

// Found by the stand acceptance of D-B-23, 2026-08-12: with `Enter` no longer swallowed by the
// list, the message was sent correctly but nothing took the list down — it went on hanging over
// the answer, anchored to an input that had already been emptied. `AIAssistantChat` now hides it on
// every send; the hook's own contract is asserted here.
describe('useAutocomplete: hideAutocomplete leaves nothing behind', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('closes the list and forgets the query, the results and the choice', async () => {
    const { result } = setup({
      searchResults: [{ recordRef: 'emodel/contract@a', displayName: 'Contract A' }],
      documents: [{ recordRef: 'emodel/doc@1', displayName: 'Scan' }]
    });

    await typeMention(result);
    act(() => {
      result.current.handleAutocompleteKeyDown({ key: 'ArrowDown', preventDefault: jest.fn(), stopPropagation: jest.fn() }, [
        { type: 'search_result', data: { recordRef: 'emodel/contract@a' } }
      ]);
    });
    expect(result.current.showAutocomplete).toBe(true);

    act(() => {
      result.current.hideAutocomplete();
    });

    expect(result.current.showAutocomplete).toBe(false);
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.availableDocuments).toEqual([]);
    expect(result.current.selectedAutocompleteIndex).toBe(-1);
    // The current record survives in the memo — it is not list state, and nothing renders it while
    // `showAutocomplete` is false. What must not survive is anything the query fetched.
    expect(result.current.filteredAutocompleteOptions.every(option => option.type !== 'search_result')).toBe(true);
  });
});
