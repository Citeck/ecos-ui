import fs from 'fs';
import cloneDeep from 'lodash/cloneDeep';
import path from 'path';

import Harness from '../../../test/harness';
import { createDocumentUrl } from '@/helpers/urls';
import EcosSelectComponent from './EcosSelect';
import { basicSectionTest } from '../../../test/builder/helpers';

import { comp1, comp2 } from './fixtures';

basicSectionTest(EcosSelectComponent);

describe('EcosSelect Component', () => {
  it('Should build a Select component', done => {
    Harness.testCreate(EcosSelectComponent, comp1).then(component => {
      Harness.testElements(component, 'select', 1);
      done();
    });
  });

  it('Should preserve the tabindex', done => {
    Harness.testCreate(EcosSelectComponent, comp2).then(component => {
      const element = component.element.getElementsByClassName('choices__list choices__list--single')[0];
      Harness.testElementAttribute(element, 'tabindex', '10');
      done();
    });
  });

  it('Should default to 0 when tabindex is not specified', done => {
    Harness.testCreate(EcosSelectComponent, comp1).then(component => {
      const element = component.element.getElementsByClassName('choices__list choices__list--single')[0];
      Harness.testElementAttribute(element, 'tabindex', '0');
      done();
    });
  });

  it('Should allow to override threshold option of fuzzy search', () => {
    try {
      const c1 = Object.assign(cloneDeep(comp1), { searchThreshold: 0.2 });
      const c2 = Object.assign(cloneDeep(comp1), { searchThreshold: 0.4 });
      const c3 = Object.assign(cloneDeep(comp1), { searchThreshold: 0.8 });
      const comps = [
        Harness.testCreate(EcosSelectComponent, c1),
        Harness.testCreate(EcosSelectComponent, c2),
        Harness.testCreate(EcosSelectComponent, c3)
      ];

      return Promise.all(comps).then(([a, b, c]) => {
        expect(a.choices.config.fuseOptions.threshold).toBe(0.2);
        expect(b.choices.config.fuseOptions.threshold).toBe(0.4);
        expect(c.choices.config.fuseOptions.threshold).toBe(0.8);
      });
    } catch (error) {
      return Promise.reject(error);
    }
  });

  describe('#setValue', () => {
    it('should set component value', done => {
      Harness.testCreate(EcosSelectComponent, comp1).then(component => {
        expect(component.dataValue).toBe('');
        component.setValue('red');
        expect(component.dataValue).toBe('red');
        done();
      });
    });

    it('should reset input value when called with empty value', done => {
      const comp = Object.assign({}, comp1);
      delete comp.placeholder;

      Harness.testCreate(EcosSelectComponent, comp).then(component => {
        expect(component.dataValue).toBe('');
        expect(component.inputs[0].value).toBe('');
        component.setValue('red');
        expect(component.dataValue).toBe('red');
        expect(component.inputs[0].value).toBe('red');
        component.setValue('');
        expect(component.dataValue).toBe('');
        expect(component.inputs[0].value).toBe('');
        done();
      });
    });

    it('Should be unreadable value', done => {
      const comp = Object.assign(cloneDeep(comp2), { unreadable: true });

      Harness.testCreate(EcosSelectComponent, comp, { readOnly: false }).then(component => Harness.testUnreadableField(component, done));
    });
  });

  /**
   * A redraw re-creates the Choices widget from scratch, while `selectOptions`, `currentItems` and `dataValue`
   * survive on the component. When the option list is loaded ASYNCHRONOUSLY (`dataSrc: 'custom'` over a promise,
   * `url`, `resource`) the widget therefore holds no list at all until it comes back — and in that window it must
   * not be treated as the authority on what the component holds, or the value is read back as empty and the next
   * change cycle writes that emptiness into the submission.
   *
   * Every assertion below runs SYNCHRONOUSLY after `redraw()`, because that window is exactly what is being
   * tested: awaiting anything lets the loader answer and closes it.
   */
  describe('redraw over a held value', () => {
    const asyncComp = () =>
      Object.assign(cloneDeep(comp1), {
        dataSrc: 'custom',
        valueProperty: 'value',
        data: { custom: 'values = window.__ecosSelectItems;' }
      });

    beforeEach(() => {
      window.__ecosSelectItems = Promise.resolve(cloneDeep(comp1.data.values));
    });

    /** A built component whose asynchronous option list has arrived and which holds the given value. */
    const withHeldValue = async (value = 'red', overrides) => {
      const component = await Harness.testCreate(EcosSelectComponent, Object.assign(asyncComp(), overrides));
      // A component built as part of a form is flagged by `NestedComponent`; without it `redraw()` is a no-op.
      component.isBuilt = true;
      component.updateItems();
      await component.itemsLoaded;
      component.setValue(value);
      expect(component.getValue()).toEqual(value);
      return component;
    };

    // The unit-level contract of the `getValue()` guard: the state is built directly, without going through a
    // redraw, so the getter is pinned on its own terms. The test below it reaches the same state through one.
    it('should report the held value while the widget holds no list', async () => {
      const component = await withHeldValue();

      // The state a re-created widget is in until its asynchronous list comes back: it knows neither the choices
      // nor the selection, while the component still holds both `selectOptions` and `dataValue`.
      component.choices.clearStore();

      expect(component.selectOptions.length).toBeGreaterThan(0);
      expect(component.getValue()).toBe('red');
    });

    /**
     * The same state, reached through a real `redraw()` — only the loading window around it is simulated, since
     * `dataSrc: 'custom'` never sets `loading` at all. In production the window belongs to `dataSrc: 'url'` and
     * `'resource'`: `loadItems` sets `loading` before the request goes out, so a redraw landing inside it leaves
     * `setValue` at its own `this.loading` early return and the re-created widget stays empty; `rejectItems` then
     * clears `loading` WITHOUT calling `setItems`, so nothing ever puts the list back — and from that moment the
     * widget answers for a value it does not hold, with no `loading` flag left to shield it.
     */
    it('should report the held value after a redraw mid-reload whose reload then fails', async () => {
      const component = await withHeldValue();

      component.loading = true;
      component.redraw();
      // The re-created widget carries nothing but its placeholder.
      expect(component.choices._store.choices.filter(choice => !choice.placeholder)).toHaveLength(0);

      component.loading = false;

      expect(component.selectOptions.length).toBeGreaterThan(0);
      expect(component.getValue()).toBe('red');
    });

    // End-to-end regression tests for the original bug, pinned to what a caller observes rather than to either
    // half of the fix: `restoreValue` runs `setValue` synchronously inside `redraw()`, so with both guards in
    // place the widget is already repopulated by the time these read it, and either guard alone keeps them green.
    // They go red only when the fix is removed altogether — which is exactly the regression they exist to catch.
    it('should keep reporting the held value after a redraw', async () => {
      const component = await withHeldValue();

      component.redraw();

      expect(component.getValue()).toBe('red');
    });

    it('should not let the change cycle that follows a redraw erase the held value', async () => {
      const component = await withHeldValue();

      component.redraw();
      component.updateValue();

      expect(component.dataValue).toBe('red');
    });

    // The two tests below pin the `setValue` half: they read the widget's own selection, which only the
    // repopulation in `setValue` can restore — `getValue`'s fallback cannot fake it.
    it('should restore the selected item in the re-created widget', async () => {
      const component = await withHeldValue();

      component.redraw();

      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['red']);
    });

    it('should restore every selected item of a multi-value select in the re-created widget', async () => {
      const component = await withHeldValue(['red', 'green'], { multiple: true });

      component.redraw();

      expect(component.getValue()).toEqual(['red', 'green']);
      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['red', 'green']);
    });

    it('should still report an empty selection once the widget holds the list again', async () => {
      const component = await withHeldValue();

      component.choices.removeActiveItems();

      // The widget is populated, so it IS the authority: nothing is selected in it any more.
      expect(component.getValue()).toBe('');
    });
  });

  /**
   * COREDEV-359 (follow-up): the component listens for a scroll to the bottom of the option list and
   * treats it as "load more" — it sets `scrollLoading`, which re-sets the widget with the FULL option
   * list plus a "Loading..." row, and asks for the next page. Under a client-side search there is no
   * next page: the matches are all in the store already, so the only thing the load did was replace
   * the filtered list with everything while the typed text stayed in the input.
   */
  describe('infinite scroll under a running search', () => {
    // jsdom lays nothing out, so the "scrolled to the bottom" arithmetic has to be given its numbers.
    const scrolledToBottom = element => {
      Object.defineProperty(element, 'scrollTop', { configurable: true, value: 100 });
      Object.defineProperty(element, 'clientHeight', { configurable: true, value: 100 });
      Object.defineProperty(element, 'scrollHeight', { configurable: true, value: 200 });
    };

    // scoped to the list: choices.js marks the original `<select>` with `data-choice` too
    const renderedChoices = component => component.scrollList.querySelectorAll('[data-choice]').length;

    it('should keep showing the matches when the user scrolls to the bottom of them', async () => {
      const component = await Harness.testCreate(EcosSelectComponent, cloneDeep(comp1));
      const { choices } = component;

      // what a keystroke leaves behind: the text in the input and the store filtered by it
      choices.input.element.value = 'r';
      const found = choices._searchChoices('r');

      // Red, Green, Purple, Orange — fewer than the seven the component was given
      expect(found).toBe(4);
      expect(renderedChoices(component)).toBe(found);

      scrolledToBottom(component.scrollList);
      component.scrollList.dispatchEvent(new Event('scroll'));

      expect(component.scrollLoading).toBe(false);
      expect(renderedChoices(component)).toBe(found);
    });

    it('should still load more when no search is running', async () => {
      const component = await Harness.testCreate(EcosSelectComponent, cloneDeep(comp1));

      scrolledToBottom(component.scrollList);
      component.scrollList.dispatchEvent(new Event('scroll'));

      expect(component.scrollLoading).toBe(true);
    });
  });

  /**
   * A multi-value chip has no layout of its own: the vendored choices.js base makes it an
   * `inline-block` with `word-break: break-all` and no width cap, so a label wider than the field
   * pushes the remove button onto a second line and the pill doubles in height (COREDEV-14). The
   * one-row layout that fixes it lives in `components/override/select/select.scss` and is written
   * against this markup — the label ellipsizes because it is a direct `<span>` child of the chip,
   * the button holds its width because it carries `.choices__button`. Neither selector is produced
   * by this repository: the chip comes from the choices.js default `item` template (wrapped in
   * `forms/choices/index.js`) and the label wrapper from the component's `template` option. When
   * either stops matching, the CSS silently stops applying and the chips wrap again, which no
   * layout-less renderer can observe — so what is pinned here is the markup the stylesheet needs.
   */
  describe('multiple value chips', () => {
    const CHIP = '.choices__list--multiple .choices__item';
    const LABEL = `${CHIP} > span`;
    const REMOVE = `${CHIP} .choices__button`;

    const withChips = () =>
      Harness.testCreate(EcosSelectComponent, Object.assign(cloneDeep(comp1), { multiple: true })).then(component => {
        component.setValue(['red', 'blue']);
        return component;
      });

    it('should render one chip per selected value', async () => {
      const component = await withChips();

      expect(component.element.querySelectorAll(CHIP)).toHaveLength(2);
    });

    it('should carry the label in a direct span of the chip, which is what the ellipsis rule targets', async () => {
      const component = await withChips();

      expect(Array.from(component.element.querySelectorAll(LABEL), span => span.textContent)).toEqual(['Red', 'Blue']);
    });

    it('should keep the remove control inside the chip, which is what the one-row rule holds in place', async () => {
      const component = await withChips();

      expect(component.element.querySelectorAll(REMOVE)).toHaveLength(2);
    });

    it('should lay the chip out on a single row in the stylesheet', () => {
      const styles = fs.readFileSync(path.resolve(__dirname, '../../override/select/select.scss'), 'utf8');
      // The declarations that keep label and button on one line; `> span` gets `%ellipsis` extended
      // onto it, so it is the selector rather than the properties that is asserted there.
      const chipRule = styles.slice(styles.indexOf('.choices__list--multiple'));

      expect(chipRule).toContain('display: inline-flex');
      expect(chipRule).toContain('white-space: nowrap');
      expect(chipRule).toContain('> span');
    });

    it('should keep the remove control a hover-only overlay in the stylesheet, like SelectOrgstruct', () => {
      const styles = fs.readFileSync(path.resolve(__dirname, '../../override/select/select.scss'), 'utf8');
      const chipRule = styles.slice(styles.indexOf('.choices__list--multiple'));

      // the ✕ holds no inline space and only shows on chip hover (QA round of COREDEV-14)
      expect(chipRule).toContain('position: absolute');
      expect(chipRule).toContain('visibility: hidden');
      expect(chipRule).toContain(':hover .choices__button');
    });
  });
});

/**
 * The record "Properties" widget shows a form in view mode: formio builds a `dd` and
 * `setupValueElement` fills it with `innerHTML`, because a record-ref value becomes a link. The
 * label inside is data — a record's display name, an option's label — and it went into that
 * markup raw, so `<img onerror>` in a name ran for everyone who opened the card. COREDEV-546
 */
describe('EcosSelect view-mode value (COREDEV-546)', () => {
  const PAYLOAD = '<img src=x onerror="window.__coredev546 = 1">';
  const REF = 'emodel/person@evil';
  const OTHER_REF = 'emodel/person@other';

  const viewComp = extra =>
    Object.assign(cloneDeep(comp1), {
      template: '',
      data: {
        values: [
          { label: PAYLOAD, value: REF },
          { label: 'Other <b>name</b>', value: OTHER_REF },
          { label: PAYLOAD, value: 'plain' }
        ]
      },
      ...extra
    });

  const render = (comp, value) =>
    Harness.testCreate(EcosSelectComponent, comp, { readOnly: true, viewAsHtml: true }).then(component => {
      component.dataValue = value;

      const element = document.createElement('dd');

      component.setupValueElement(element);

      return element;
    });

  it('renders the label of a record-ref value as text inside the document link', () => {
    return render(viewComp(), REF).then(element => {
      const links = element.querySelectorAll('a');

      expect(element.querySelector('img')).toBeNull();
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute('href')).toBe(createDocumentUrl(REF));
      expect(links[0].textContent).toBe(PAYLOAD);
    });
  });

  it('renders the label of a plain value as text', () => {
    return render(viewComp(), 'plain').then(element => {
      expect(element.querySelector('img')).toBeNull();
      expect(element.querySelector('a')).toBeNull();
      expect(element.textContent).toBe(PAYLOAD);
    });
  });

  // A stored value that matches no item (url/custom source without a valueProperty, or a value the
  // list no longer has) is shown as it is: `asString` returns it bare, and it is still written as HTML
  it('renders a bare stored value that matches no item as text', () => {
    return render(viewComp({ dataSrc: 'url', valueProperty: '', data: { url: '' } }), PAYLOAD).then(element => {
      expect(element.querySelector('img')).toBeNull();
      expect(element.textContent).toBe(PAYLOAD);
    });
  });

  it('keeps a quote in a record ref inside the href', () => {
    const ref = "emodel/person@x' onmouseover='window.__coredev546 = 1";

    return render(viewComp({ data: { values: [{ label: 'Name', value: ref }] } }), ref).then(element => {
      const link = element.querySelector('a');

      expect(link.getAttribute('onmouseover')).toBeNull();
      expect(link.getAttribute('href')).toBe(createDocumentUrl(ref));
    });
  });

  it('still renders several values as a list of links', () => {
    return render(viewComp({ multiple: true }), [REF, OTHER_REF]).then(element => {
      const links = element.querySelectorAll('a');

      expect(element.querySelector('img')).toBeNull();
      expect(element.querySelector('b')).toBeNull();
      expect(links).toHaveLength(2);
      expect(links[0].textContent).toBe(PAYLOAD);
      expect(links[1].textContent).toBe('Other <b>name</b>');
      expect(links[1].getAttribute('href')).toBe(createDocumentUrl(OTHER_REF));
      expect(element.querySelectorAll('br')).toHaveLength(1);
    });
  });

  // `component.template` is written by the form's author and is markup on purpose.
  it('still renders the markup of the component template', () => {
    return render(viewComp({ template: '<span class="tpl">{{ item.label }}</span>' }), OTHER_REF).then(element => {
      const link = element.querySelector('a');

      expect(link.getAttribute('href')).toBe(createDocumentUrl(OTHER_REF));
      expect(link.querySelector('span.tpl')).not.toBeNull();
    });
  });
});

/**
 * The same labels in edit mode: they went to the Choices widget and to the `<option>`s raw, and
 * every one of those renders its label as markup — the dropdown choices, the selected item, the
 * `title` of a choice. A record name like `<img onerror>` ran as soon as the form was opened for
 * editing. Labels are escaped once, in `itemTemplate`, so they render as text everywhere.
 * COREDEV-546
 */
describe('EcosSelect edit-mode option labels (COREDEV-546)', () => {
  const PAYLOAD = '<img src=x onerror="window.__coredev546 = 1">Evil';

  const editComp = extra =>
    Object.assign(cloneDeep(comp1), {
      template: '',
      placeholder: '',
      data: {
        values: [
          { label: PAYLOAD, value: 'evil' },
          { label: 'Alpha', value: 'alpha' },
          { label: 'Smith & Sons', value: 'smith' }
        ]
      },
      ...extra
    });

  const create = comp => Harness.testCreate(EcosSelectComponent, comp);

  /** everything the widget rendered, including the original `<select>` and its `<option>`s */
  const rendered = component => component.choices.containerOuter.element;

  const choiceOf = (component, value) => rendered(component).querySelector(`.choices__list--dropdown [data-choice][data-value="${value}"]`);

  const expectNoInjectedMarkup = root => {
    expect(root.querySelector('img, script')).toBeNull();
    root.querySelectorAll('*').forEach(element => {
      Array.from(element.attributes).forEach(attribute => expect(attribute.name).not.toMatch(/^on/i));
    });
  };

  it('renders a markup label of a dropdown choice as text', async () => {
    const component = await create(editComp());
    const choice = choiceOf(component, 'evil');

    expectNoInjectedMarkup(rendered(component));
    expect(choice.textContent.trim()).toBe(PAYLOAD);
    expect(choice.getAttribute('title')).toBe(PAYLOAD);
  });

  it('renders a markup label of the selected item as text', async () => {
    const component = await create(editComp());

    component.setValue('evil');

    const item = rendered(component).querySelector('.choices__list--single [data-item]');

    expectNoInjectedMarkup(rendered(component));
    expect(item.firstChild.textContent.trim()).toBe(PAYLOAD);
  });

  it('keeps a quote of a label inside the title of its choice', async () => {
    const label = 'x" onmouseover="window.__coredev546 = 1';
    const component = await create(editComp({ data: { values: [{ label, value: 'quote' }] } }));
    const choice = choiceOf(component, 'quote');

    expect(choice.getAttribute('onmouseover')).toBeNull();
    expect(choice.getAttribute('title')).toBe(label);
  });

  it('parses no label into the live document to build the title of a choice', async () => {
    const createElement = jest.spyOn(document, 'createElement');

    try {
      await create(editComp({ template: '<b>{{ item.label }}</b>' }));

      // the only live-document elements the widget needs are its own containers, never a holder
      // to parse a label into — the author template output with the payload must not get one
      const holders = createElement.mock.results
        .map(({ value }) => value)
        .filter(element => element instanceof HTMLElement && element.querySelector('img'));

      expect(holders.filter(element => !element.closest('.choices')).map(element => element.outerHTML)).toEqual([]);
    } finally {
      createElement.mockRestore();
    }
  });

  it('renders the markup of the component template, sanitized', async () => {
    const component = await create(editComp({ template: '<b class="tpl">{{ item.label }}</b>' }));
    const choice = choiceOf(component, 'evil');

    expect(choice.querySelector('b.tpl')).not.toBeNull();
    expectNoInjectedMarkup(rendered(component));
    expect(choice.querySelector('b.tpl').textContent).toBe(PAYLOAD);
    expect(choice.getAttribute('title')).toBe(PAYLOAD);
  });

  it('still renders, finds and selects a plain label', async () => {
    const component = await create(editComp());
    const { choices } = component;

    expect(choiceOf(component, 'alpha').textContent.trim()).toBe('Alpha');
    expect(choiceOf(component, 'alpha').getAttribute('title')).toBe('Alpha');

    choices.input.element.value = 'Alp';
    expect(choices._searchChoices('Alp')).toBe(1);
    expect(choices._store.activeChoices.filter(choice => !choice.placeholder).map(choice => choice.value)).toEqual(['alpha']);

    component.setValue('alpha');

    expect(component.dataValue).toBe('alpha');
    expect(rendered(component).querySelector('.choices__list--single [data-item]').firstChild.textContent.trim()).toBe('Alpha');
  });

  it('finds a label with an ampersand by its text', async () => {
    const component = await create(editComp());

    expect(choiceOf(component, 'smith').textContent.trim()).toBe('Smith & Sons');
    expect(component.choices._searchChoices('Smith & S')).toBe(1);
  });

  it('writes the label of an html5 option as text', async () => {
    const component = await create(editComp({ widget: 'html5' }));

    // the html5 widget fills its `<select>` on a debounced update; run it now
    component.updateItems();

    const options = Array.from(component.selectInput.querySelectorAll('option'));
    // (the component's own options carry no value attribute — find it by its text)
    const evil = options.find(option => option.textContent.includes('Evil'));

    expect(component.selectInput.querySelector('img')).toBeNull();
    expect(evil.textContent).toBe(PAYLOAD);
  });
});
