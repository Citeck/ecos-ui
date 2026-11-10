import Formio from 'formiojs/Formio';
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

  describe('value reconciliation after asynchronous options', () => {
    const components = [];
    const requests = [];
    let transport;

    beforeEach(() => {
      jest.useFakeTimers();
      // Only the network is replaced: updateItems/loadItems and the Choices store run normally.
      transport = jest.spyOn(Formio, 'makeRequest').mockImplementation(() => {
        const request = {};
        const promise = new Promise((resolve, reject) => {
          request.resolve = resolve;
          request.reject = reject;
        });
        requests.push(request);
        return promise;
      });
    });

    afterEach(async () => {
      components.forEach(component => component.triggerUpdate.cancel());
      requests.forEach(request => request.resolve(cloneDeep(comp1.data.values)));
      // Drain processItems/resolveItems before destroying their widgets or restoring the transport.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      components.forEach(component => {
        component.triggerUpdate.cancel();
        component.triggerRedraw.cancel();
        component.destroy(true);
      });
      // Drain the private triggerChange debounce and animation callbacks with listeners detached.
      jest.runOnlyPendingTimers();
      jest.clearAllTimers();
      jest.useRealTimers();
      components.length = 0;
      requests.length = 0;
      transport.mockRestore();
    });

    const create = async (overrides = {}, options = {}) => {
      const component = await Harness.testCreate(EcosSelectComponent, { ...cloneDeep(comp1), ...overrides }, options);
      components.push(component);
      component.triggerUpdate.cancel();
      if (component.scrollList) {
        // jsdom omits this browser API used by the real infinite-scroll animation callback.
        component.scrollList.scrollTo = (x, y) => {
          component.scrollList.scrollLeft = x;
          component.scrollList.scrollTop = y;
        };
      }
      return component;
    };

    const reload = (component, search = '') => {
      component.component.dataSrc = 'url';
      component.component.valueProperty = 'value';
      component.component.data.url = '/select-test-options';
      const before = requests.length;
      const completed = new Promise(resolve => component.updateItems(search, true, resolve));
      expect(requests).toHaveLength(before + 1);
      expect(component.loading).toBe(true);
      return async (items = cloneDeep(comp1.data.values)) => {
        requests[before].resolve(items);
        await completed;
        expect(component.loading).toBe(false);
      };
    };

    const expectSelection = (component, value, labels = []) => {
      const values = Array.isArray(value) ? value : value ? [value] : [];
      expect(component.dataValue).toEqual(value);
      expect(component.getValue()).toEqual(value);
      expect(component.choices._store.activeItems.filter(item => !item.placeholder).map(item => item.value)).toEqual(values);
      expect(
        Array.from(component.selectInput.selectedOptions, option => option.value).filter(value => value !== comp1.placeholder)
      ).toEqual(values);
      const selectedLabels = component.choices.itemList.element.querySelectorAll('[data-item]:not(.choices__placeholder) > span');
      expect(Array.from(selectedLabels, label => label.textContent)).toEqual(labels);
      component.updateValue();
      expect(component.dataValue).toEqual(value);
    };

    it('should not resurrect a single selection cleared while loadItems is pending', async () => {
      const component = await create();
      component.setValue('red');
      expectSelection(component, 'red', ['Red']);
      const finish = reload(component);
      component.setValue('');
      expect(component.dataValue).toBe('');
      expect(component.getValue()).toBe('');
      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['red']);

      await finish();

      expectSelection(component, '');
    });

    it('should converge on repeated single clears during and after loading', async () => {
      const component = await create();
      component.setValue('red');
      const finish = reload(component);
      component.setValue('');
      component.setValue('');
      await finish();
      expectSelection(component, '');
      component.setValue('');
      component.setValue('');
      expectSelection(component, '');
    });

    it('should use the latest nonempty single replacement and its loaded label', async () => {
      const component = await create();
      component.setValue('red');
      const finish = reload(component);
      component.setValue('green');
      component.setValue('blue');
      await finish();
      expectSelection(component, 'blue', ['Blue']);
      component.setValue('blue');
      expectSelection(component, 'blue', ['Blue']);
    });

    it.each([
      [[], []],
      [
        ['blue', 'yellow'],
        ['Blue', 'Yellow']
      ]
    ])('should reconcile a multiple selection to %j without stale or duplicate chips', async (value, labels) => {
      const component = await create({ multiple: true });
      component.setValue(['red', 'green']);
      expectSelection(component, ['red', 'green'], ['Red', 'Green']);
      const finish = reload(component);
      component.setValue(value);
      component.setValue(value);
      await finish();
      expectSelection(component, value, labels);
      component.setValue(value);
      expectSelection(component, value, labels);
      expect(component.element.querySelectorAll('.choices__list--multiple [data-item]')).toHaveLength(value.length);
    });

    it('should preserve an EDIT saved value and load its label on the initial async request', async () => {
      const component = await create(
        {
          dataSrc: 'url',
          valueProperty: 'value',
          data: { url: '/select-test-options' },
          calculateValue: 'value = data.source || "";',
          allowCalculateOverride: true
        },
        { formMode: 'EDIT' }
      );
      expect(requests).toHaveLength(1);
      expect(component.loading).toBe(true);
      // The saved submission arrives before its option list, as it does on an EDIT form.
      component.setValue('red');
      component.calculateValue({ source: '' });
      expect(component.dataValue).toBe('red');
      requests[0].resolve([{ value: 'red', label: 'Saved Red' }]);
      await component.itemsLoaded;
      expectSelection(component, 'red', ['Saved Red']);
    });

    it('should keep calculating after a calculated clear during loading, but respect a manual override', async () => {
      const component = await create(
        { calculateValue: 'value = data.source || "";', allowCalculateOverride: true },
        { formMode: 'CREATE' }
      );
      component.calculateValue({ source: 'red' });
      expectSelection(component, 'red', ['Red']);
      const finish = reload(component);
      component.calculateValue({ source: '' });
      expect(component.calculatedValue).toBe('');
      expect(component.dataValue).toBe('');
      await finish();
      expectSelection(component, '');
      component.calculateValue({ source: 'blue' });
      expectSelection(component, 'blue', ['Blue']);
      component.setValue('green');
      component.updateValue();
      component.calculateValue({ source: 'yellow' });
      expectSelection(component, 'green', ['Green']);
      expect(component.calculatedValue).toBe('blue');
    });

    it('should preserve an initial Choices preset selection when no Formio default is provided', async () => {
      const component = await create({
        placeholder: '',
        defaultValue: '',
        customOptions: {
          choices: [{ value: 'blue', label: 'Blue', selected: true }]
        }
      });

      // A widget-level preset used to become the form value through the ordinary readback cycle.
      expect(component.getValue()).toBe('blue');
      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['blue']);
      expect(component.choices.itemList.element.querySelector('[data-item]').textContent).toContain('Blue');
      component.updateValue();
      expect(component.dataValue).toBe('blue');
    });

    const preset = {
      placeholder: '',
      defaultValue: '',
      customOptions: {
        choices: [{ value: 'blue', label: '<span>Blue</span>', selected: true }]
      }
    };
    const remote = {
      dataSrc: 'url',
      valueProperty: 'value',
      data: { url: '/select-test-options' }
    };
    const settleRequests = async component => {
      requests.forEach(request => request.resolve(cloneDeep(comp1.data.values)));
      await component.itemsLoaded;
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };
    const redraw = component => {
      component.isBuilt = true;
      component.triggerUpdate.cancel();
      component.redraw();
      component.triggerUpdate.cancel();
    };

    it.each([false, true])('should preserve an initial async Choices preset, including redraw=%s without a clear', async shouldRedraw => {
      const component = await create({ ...preset, ...remote });
      expect(requests).toHaveLength(1);
      expect(component.loading).toBe(true);
      expect(component.dataValue).toBe('');
      expect(component.getValue()).toBe('');
      component.setValue('');
      component.setValue(null);
      if (shouldRedraw) {
        redraw(component);
        expect(requests).toHaveLength(2);
        expect(component.loading).toBe(true);
      }
      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['blue']);
      await settleRequests(component);
      expect(component.dataValue).toBe('');
      expect(component.getValue()).toBe('blue');
      expect(Array.from(component.selectInput.selectedOptions, option => option.value)).toEqual(['blue']);
      expect(component.choices.itemList.element.querySelector('[data-item]').textContent).toContain('Blue');
      component.updateValue();
      expectSelection(component, 'blue', ['Blue']);
    });

    it('should preserve a synchronous widget-only preset across redraw before readback', async () => {
      const component = await create(preset);
      expect(component.dataValue).toBe('');
      component.setValue('');
      redraw(component);
      expect(component.dataValue).toBe('');
      expect(component.getValue()).toBe('blue');
      component.updateValue();
      expectSelection(component, 'blue', ['Blue']);
    });

    it.each([false, true])('should clear an adopted preset with deferred=%s', async deferred => {
      const component = await create(preset);
      component.updateValue();
      expectSelection(component, 'blue', ['Blue']);
      const finish = deferred ? reload(component) : null;
      component.setValue('');
      if (finish) {
        await finish();
      }
      expectSelection(component, '');
    });

    it.each([
      [false, false],
      [false, true],
      [true, false],
      [true, true]
    ])('should apply the latest clear/replacement command with multiple=%s and finalClear=%s', async (multiple, finalClear) => {
      const component = await create({ multiple });
      const empty = multiple ? [] : '';
      const replacement = multiple ? ['blue', 'yellow'] : 'blue';
      component.setValue(multiple ? ['red', 'green'] : 'red');
      const finish = reload(component);
      component.setValue(empty);
      component.restoreValue();
      component.setValue(replacement);
      if (finalClear) {
        component.setValue(empty);
        component.restoreValue();
        component.setValue(empty);
      }
      await finish();
      expectSelection(component, finalClear ? empty : replacement, finalClear ? [] : multiple ? ['Blue', 'Yellow'] : ['Blue']);
    });

    it.each([false, true])('should retain repeated null clears across undefined and empty restores with multiple=%s', async multiple => {
      const component = await create({ multiple });
      const empty = multiple ? [] : '';
      component.setValue(multiple ? ['red', 'green'] : 'red');
      const finish = reload(component);
      expect(component.setValue(null)).toBe(true);
      expect(component.setValue(undefined)).toBe(false);
      expect(component.dataValue).toEqual(empty);
      component.setValue(null);
      component.setValue('');
      component.restoreValue();
      await finish();
      expectSelection(component, empty);
      expect(component.setValue(null)).toBe(false);
      expectSelection(component, empty);
    });

    it.each(['empty', 'replacement', 'default'])(
      'should consume a deferred clear after applying %s, not clear a later widget-only preset',
      async outcome => {
        const component = await create({ defaultValue: outcome === 'default' ? 'green' : '' });
        component.setValue('red');
        const finish = reload(component);
        component.setValue('');
        if (outcome === 'replacement') {
          component.setValue('blue');
        }
        await finish();
        expectSelection(
          component,
          outcome === 'empty' ? '' : outcome === 'default' ? 'green' : 'blue',
          outcome === 'empty' ? [] : outcome === 'default' ? ['Green'] : ['Blue']
        );

        // Read back a user removal without issuing another setValue that could consume an obsolete latch.
        component.choices.removeActiveItems();
        component.updateValue();
        expect(component.dataValue).toBe('');
        component.component.defaultValue = '';
        component.component.customOptions = cloneDeep(preset.customOptions);
        component.component.placeholder = '';
        redraw(component);
        await settleRequests(component);
        expect(component.dataValue).toBe('');
        expect(component.getValue()).toBe('blue');
        component.updateValue();
        expectSelection(component, 'blue', ['Blue']);
      }
    );

    it.each([false, true])('should retain a pending clear through redraw with multiple=%s', async multiple => {
      const component = await create({ ...preset, multiple });
      component.setValue(multiple ? ['red', 'green'] : 'red');
      reload(component);
      component.setValue(multiple ? [] : '');
      redraw(component);
      expect(component.loading).toBe(true);
      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['blue']);
      await settleRequests(component);
      expectSelection(component, multiple ? [] : '');
    });

    it('should reconcile a clear during the initial lazy value lookup', async () => {
      const component = await create({ ...preset, ...remote, lazyLoad: true, searchField: 'value' });
      expect(requests).toHaveLength(0);
      component.setValue('red');
      expect(requests).toHaveLength(1);
      expect(component.loading).toBe(true);
      component.setValue('');
      component.setValue(undefined);
      component.restoreValue();
      await settleRequests(component);
      expectSelection(component, '');
    });

    it.each(['clear', 'replacement', 'reload'])('should retain unapplied intent after rejection until explicit %s repair', async repair => {
      const component = await create();
      component.setValue('red');
      const finish = reload(component);
      component.setValue('');
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        requests[requests.length - 1].reject(new Error('controlled transport rejection'));
        await finish();
        expect(warning).toHaveBeenCalledWith('Unable to load resources for favoriteColor');
      } finally {
        warning.mockRestore();
      }
      expect(component.dataValue).toBe('');
      expect(component.getValue()).toBe('red');
      if (repair === 'reload') {
        await reload(component)();
        expectSelection(component, '');
      } else {
        component.setValue(repair === 'replacement' ? 'blue' : '');
        expectSelection(component, repair === 'replacement' ? 'blue' : '', repair === 'replacement' ? ['Blue'] : []);
        await reload(component)();
        expectSelection(component, repair === 'replacement' ? 'blue' : '', repair === 'replacement' ? ['Blue'] : []);
      }
    });

    it('should not consume a clear before an input exists', async () => {
      const component = new EcosSelectComponent({ ...cloneDeep(comp1), ...cloneDeep(preset) });
      components.push(component);
      component.loadItems('/select-test-options');
      component.setValue('red');
      component.setValue('');
      const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        requests[0].reject(new Error('controlled prebuild rejection'));
        await component.itemsLoaded;
      } finally {
        warning.mockRestore();
      }
      expect(component.selectInput).toBeFalsy();
      component.setValue('');
      component.build();
      component.triggerUpdate.cancel();
      expectSelection(component, '');
    });

    it('should consume a deferred clear after native input synchronization', async () => {
      const component = await create({ widget: 'html5', placeholder: '' });
      component.updateItems();
      component.setValue('red');
      const finish = reload(component);
      component.setValue('');
      await finish();
      expect(component.getValue()).toBe('');
      component.component.widget = 'choicesjs';
      component.component.customOptions = cloneDeep(preset.customOptions);
      redraw(component);
      await settleRequests(component);
      expect(component.dataValue).toBe('');
      expect(component.getValue()).toBe('blue');
      component.updateValue();
      expectSelection(component, 'blue', ['Blue']);
    });

    it('should retain a pending clear across the empty-first-page bypass for explicit repair', async () => {
      const component = await create({ ...preset, data: { values: [] } });
      component.setValue('blue');
      // No loaded options exist yet; select the custom choice through the real widget.
      component.choices.setChoiceByValue('blue');
      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['blue']);
      expect(component.currentItems).toEqual([]);
      const finish = reload(component);
      component.setValue('');
      await finish([]);
      expect(component.dataValue).toBe('');
      expect(component.choices._store.activeItems.map(item => item.value)).toEqual(['blue']);
      component.setValue('');
      expectSelection(component, '');
      await reload(component)();
    });

    it('should retain the existing truthy default after a clear on successful load', async () => {
      const component = await create({ defaultValue: 'green' });
      component.setValue('red');
      const finish = reload(component);
      component.setValue('');
      await finish();
      expectSelection(component, 'green', ['Green']);
    });

    it('should retain the existing empty-array policy instead of reapplying a multiple default', async () => {
      const component = await create({ multiple: true, defaultValue: ['green'] });
      component.setValue(['red']);
      const finish = reload(component);
      component.setValue([]);
      await finish();
      expectSelection(component, []);
    });

    it('should clear active items on an ordinary empty response after a previous nonempty page', async () => {
      const component = await create();
      component.setValue('red');
      const finish = reload(component);
      component.setValue('');
      await finish([]);
      expectSelection(component, '');
      expect(component.currentItems).toEqual([]);
      expect(component.selectOptions).toEqual([]);
    });

    it('should still reset a nonempty value absent from the response', async () => {
      const component = await create();
      component.setValue('red');
      const finish = reload(component);
      await finish([{ value: 'blue', label: 'Blue' }]);
      expectSelection(component, '');
    });

    it('should reconcile a clear on a server-search response too', async () => {
      const component = await create({ searchField: 'label' });
      component.setValue('red');
      const finish = reload(component, 'r');
      component.setValue('');
      await finish();
      expectSelection(component, '');
    });

    it('should reconcile an html5 clear without restoring the old native selection', async () => {
      const component = await create({ widget: 'html5', placeholder: '' });
      component.updateItems();
      component.setValue('red');
      expect(component.getValue()).toBe('red');
      const finish = reload(component);
      component.setValue('');
      await finish();
      expect(component.dataValue).toBe('');
      expect(component.getValue()).toBe('');
      expect(component.selectOptions.find(option => option.value === 'red').element.selected).toBe(false);
      component.updateValue();
      expect(component.dataValue).toBe('');
    });

    it('should leave the empty-first-page early return outside ordinary reconciliation', async () => {
      const component = await create({ data: { values: [] } });
      let itemsLoaded = false;
      component.itemsLoaded.then(() => {
        itemsLoaded = true;
      });
      const finish = reload(component);
      await finish([]);
      expect(component.currentItems).toEqual([]);
      expect(component.selectOptions).toEqual([]);
      expect(itemsLoaded).toBe(false);
      // A subsequent ordinary page settles the initial dataReady promise; leave none pending in cleanup.
      const finishNextPage = reload(component);
      await finishNextPage();
      await component.itemsLoaded;
      expect(itemsLoaded).toBe(true);
    });

    it('should characterize duplicate-scroll-page bypass and allow a later explicit clear to repair the widget', async () => {
      const component = await create();
      component.setValue('red');
      component.scrollLoading = true;
      const finish = reload(component);
      component.setValue('');
      await finish();
      expect(component.scrollLoading).toBe(false);
      expect(component.dataValue).toBe('');
      // This early return intentionally does not reach the ordinary setItems reconciliation.
      expect(component.getValue()).toBe('red');
      component.setValue('');
      expectSelection(component, '');
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
