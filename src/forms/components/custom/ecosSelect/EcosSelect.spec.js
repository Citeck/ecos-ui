import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
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
});
