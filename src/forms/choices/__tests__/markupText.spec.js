import Choices, { getMarkupText } from '../index';

import { t } from '@/helpers/util';

/**
 * COREDEV-546: option labels reach the choices helpers as markup, and the text behind it was taken
 * by writing the label into `document.createElement('div').innerHTML`. That element is detached but
 * belongs to the live document, so an `<img src=x onerror>` in a record name was fetched and its
 * handler ran while merely computing a search string or an aria-label. The text is taken from an
 * inert document instead, which never loads anything.
 */
describe('Choices markup text (COREDEV-546)', () => {
  const PAYLOAD = '<img src=x onerror="window.__coredev546 = 1">Evil';

  const innerHTMLSetter = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;

  /** Records every element of the live document that got markup parsed into it during `fn`. */
  const liveParses = fn => {
    const parsedInto = [];
    const createElement = jest.spyOn(document, 'createElement');
    const setter = jest.spyOn(Element.prototype, 'innerHTML', 'set').mockImplementation(function (value) {
      if (this.ownerDocument === document) {
        parsedInto.push({ element: this, value });
      }

      return innerHTMLSetter.call(this, value);
    });

    try {
      fn();
    } finally {
      setter.mockRestore();
    }

    const created = createElement.mock.calls.map(([tag]) => tag);

    createElement.mockRestore();

    return { parsedInto: parsedInto.filter(({ value }) => String(value).includes('<img')), created };
  };

  describe('getMarkupText', () => {
    it('returns the text of the markup without parsing it into the live document', () => {
      let text;
      const { parsedInto, created } = liveParses(() => {
        text = getMarkupText(PAYLOAD);
      });

      expect(text).toBe('Evil');
      expect(parsedInto).toEqual([]);
      expect(created).not.toContain('div');
      expect(created).not.toContain('img');
    });

    it('decodes entities, so an escaped label gives back the text it stands for', () => {
      expect(getMarkupText('&lt;img src=x&gt; &amp; Co')).toBe('<img src=x> & Co');
    });

    it('leaves a plain label as it is', () => {
      expect(getMarkupText('Alpha')).toBe('Alpha');
      expect(getMarkupText('')).toBe('');
    });
  });

  describe('the accessible name of the remove button', () => {
    const classNames = {
      item: 'choices__item',
      button: 'choices__button',
      highlightedState: 'is-highlighted',
      itemSelectable: 'choices__item--selectable',
      placeholder: 'choices__placeholder'
    };

    it('takes the text of an object value label without parsing it into the live document', () => {
      let element;
      const { parsedInto } = liveParses(() => {
        element = Choices.defaults.templates.item.call(
          null,
          classNames,
          { id: 1, value: { id: 'emodel/person@x' }, label: PAYLOAD, active: true, choiceId: 1, groupId: -1 },
          true
        );
      });

      // the item element itself renders its label as markup by design — labels are escaped at their
      // source (EcosSelect.itemTemplate); what must not happen is a second parse just to name it
      expect(parsedInto.filter(parse => parse.element !== element)).toEqual([]);
      expect(element.querySelector('[data-button]').getAttribute('aria-label')).toBe(`${t('select.remove-item')}: 'Evil'`);
    });

    it('names an item by the text of an escaped label', () => {
      const element = Choices.defaults.templates.item.call(
        null,
        classNames,
        { id: 2, value: { id: 'emodel/person@x' }, label: '&lt;img src=x onerror=1&gt;Evil', active: true, choiceId: 2, groupId: -1 },
        true
      );

      expect(element.querySelector('img')).toBeNull();
      expect(element.querySelector('[data-button]').getAttribute('aria-label')).toBe(
        `${t('select.remove-item')}: '<img src=x onerror=1>Evil'`
      );
    });
  });

  describe('the search text of a choice', () => {
    // only the search itself: a real instance re-renders its list on every search, and rendering a
    // label as markup is what the templates do by design (labels are escaped at their source)
    const searchResults = needle => {
      const dispatch = jest.fn();
      const instance = Object.setPrototypeOf(
        {
          _store: {
            searchableChoices: [
              { value: 'v1', label: PAYLOAD },
              { value: 'v2', label: 'Alpha' },
              { value: 'v3', label: 'Smith &amp; Sons' }
            ],
            dispatch
          },
          config: { searchFields: ['label', 'value'] },
          _currentValue: ''
        },
        Choices.prototype
      );

      instance._searchChoices(needle);

      return dispatch.mock.calls[0][0].results.map(({ item }) => item.value);
    };

    it('strips markup without parsing it into the live document', () => {
      let found;
      const { parsedInto, created } = liveParses(() => {
        found = searchResults('Evi');
      });

      expect(found).toEqual(['v1']);
      expect(parsedInto).toEqual([]);
      expect(created).not.toContain('div');
    });

    it('still finds a plain label', () => {
      expect(searchResults('Alp')).toEqual(['v2']);
    });

    it('finds an escaped label by the text the user sees', () => {
      expect(searchResults('Smith & S')).toEqual(['v3']);
    });
  });
});
