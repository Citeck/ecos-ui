import Choices from '../index';

/**
 * COREDEV-359 (reopen): filtering a select must be literal, not fuzzy. choices.js 8.0.0 hands the
 * needle to Fuse.js, and with the threshold formio ships (0.3) a version list answers «2026.2.1»
 * with «2026.1.1», «2026.4.1» and «2026.5.1» — every value the user just filtered out. The user
 * reads the dropdown as "what matches what I typed", so a value belongs there only when it actually
 * contains the typed text.
 */
describe('Choices search', () => {
  let select;
  let instance;

  const init = choices => {
    select = document.createElement('select');
    document.body.appendChild(select);

    // the options EcosSelect passes that are relevant to searching
    instance = new Choices(select, {
      searchEnabled: true,
      shouldSort: false,
      fuseOptions: { include: 'score', threshold: 0.3 }
    });

    instance.setChoices(choices, 'value', 'label', true);
  };

  const searchResults = needle => {
    instance._searchChoices(needle);
    return instance._store.activeChoices.filter(choice => !choice.placeholder).map(choice => choice.value);
  };

  afterEach(() => {
    instance.destroy();
    select.remove();
    instance = null;
  });

  describe('a version-like list (the reopen scenario)', () => {
    beforeEach(() => {
      init([
        { value: '2026.1.1', label: '2026.1.1' },
        { value: '2026.4.1', label: '2026.4.1' },
        { value: '2026.5.1', label: '2026.5.1' }
      ]);
    });

    it('«2026» matches every value that contains it', () => {
      expect(searchResults('2026')).toEqual(['2026.1.1', '2026.4.1', '2026.5.1']);
    });

    it('«2026.2» matches nothing — no value contains it', () => {
      expect(searchResults('2026.2')).toEqual([]);
    });

    it('«2026.2.1» matches nothing, not the whole list', () => {
      expect(searchResults('2026.2.1')).toEqual([]);
    });

    /**
     * COREDEV-359 (follow-up): re-setting the option list must not undo the filter. `setChoices` with
     * `replaceChoices` clears the store, and the `active` flags the search had set go with it, so the
     * user saw the full list come back under the text they had typed.
     */
    it('survives a replace-setChoices that re-sets the same list', () => {
      const all = [
        { value: '2026.1.1', label: '2026.1.1' },
        { value: '2026.4.1', label: '2026.4.1' },
        { value: '2026.5.1', label: '2026.5.1' }
      ];

      expect(searchResults('2026.4')).toEqual(['2026.4.1']);

      instance.setChoices(all, 'value', 'label', true);

      expect(instance._isSearching).toBe(true);
      expect(instance._store.activeChoices.map(choice => choice.value)).toEqual(['2026.4.1']);
    });
  });

  describe('a mixed list', () => {
    beforeEach(() => {
      init([
        { value: '2025.12', label: '2025.12' },
        { value: 'UI 2025.12', label: 'UI 2025.12' },
        { value: '2025.1.5', label: '2025.1.5' },
        { value: '2025.13', label: '2025.13' }
      ]);
    });

    it('«2025.12» keeps the values that contain it and drops the near misses', () => {
      expect(searchResults('2025.12')).toEqual(['2025.12', 'UI 2025.12']);
    });

    it('matches case-insensitively', () => {
      expect(searchResults('ui')).toEqual(['UI 2025.12']);
    });

    it('ranks a match at the start of the value above one in the middle', () => {
      instance._searchChoices('2025.12');

      const scoreOf = value => instance._store.activeChoices.find(choice => choice.value === value).score;

      expect(scoreOf('2025.12')).toBeLessThan(scoreOf('UI 2025.12'));
    });
  });

  describe('labels that carry markup', () => {
    beforeEach(() => {
      // itemTemplate wraps every label in the component's template markup
      init([
        { value: 'v1', label: '<span>2026.1.1</span>' },
        { value: 'v2', label: '<span>Договор аренды</span>' }
      ]);
    });

    it('searches the text of the label, not its markup', () => {
      expect(searchResults('span')).toEqual([]);
    });

    it('finds the label text inside the markup', () => {
      expect(searchResults('аренд')).toEqual(['v2']);
    });
  });

  describe('a dot-path search field (formio select builds `value.<searchField>`)', () => {
    beforeEach(() => {
      select = document.createElement('select');
      document.body.appendChild(select);

      instance = new Choices(select, {
        searchEnabled: true,
        shouldSort: false,
        searchFields: ['value.name'],
        fuseOptions: { include: 'score', threshold: 0.3 }
      });

      instance.setChoices(
        [
          { value: { name: 'alpha' }, label: 'A' },
          { value: { name: 'beta' }, label: 'B' }
        ],
        'value',
        'label',
        true
      );
    });

    it('resolves the path into the object value', () => {
      expect(searchResults('bet')).toEqual([{ name: 'beta' }]);
    });
  });

  describe('object values (EcosSelect stores objects for some selects)', () => {
    beforeEach(() => {
      init([
        { value: { id: 'emodel/type@contract' }, label: 'Договор' },
        { value: { id: 'emodel/type@invoice' }, label: 'Счёт' }
      ]);
    });

    it('matches by label without throwing on a non-string value', () => {
      expect(searchResults('Догов')).toEqual([{ id: 'emodel/type@contract' }]);
    });
  });
});
