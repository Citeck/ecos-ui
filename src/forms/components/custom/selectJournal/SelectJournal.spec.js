import { basicSectionTest } from '../../../test/builder/helpers';
import Harness from '../../../test/harness';

import SelectJournalComponent from './SelectJournal';
import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp2';

basicSectionTest(SelectJournalComponent);

describe('SelectJournal Component', () => {
  it('Should build a SelectJournal component', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(() => {
      done();
    });
  });

  it('Should be correctId with no default journalId', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(async component => {
      component.root.data = { ...component.root.data, var1: '1', var2: '2', var3: '3' };
      const wrapper = await component.react.wrapper;
      expect(wrapper.props.props.journalId).toBe('');
      done();
    });
  });

  it('Should be correctId with templateJournalId', done => {
    Harness.testCreate(SelectJournalComponent, comp2).then(async component => {
      component.root.data = { ...component.root.data, var1: '1', var2: '2', var3: '3' };
      const wrapper = await component.react.wrapper;
      expect(wrapper.props.props.journalId).toBe('template-1-2-1-3');
      done();
    });
  });

  it('redraw should cancel delayedSettingProps', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(component => {
      const cancelSpy = jest.spyOn(component.delayedSettingProps, 'cancel');
      component.redraw();
      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
      done();
    });
  });

  it('switchToViewOnlyMode should be no-op when readOnly and not in inline editing', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(component => {
      component.options.readOnly = true;
      component._isInlineEditingMode = false;

      const proto = Object.getPrototypeOf(Object.getPrototypeOf(component));
      const superSpy = jest.spyOn(proto, 'switchToViewOnlyMode');

      component.switchToViewOnlyMode();

      expect(superSpy).not.toHaveBeenCalled();
      superSpy.mockRestore();
      done();
    });
  });

  it('switchToViewOnlyMode should proceed when in inline editing mode even if readOnly', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(component => {
      component._isInlineEditingMode = true;
      component.options.readOnly = true;

      const proto = Object.getPrototypeOf(Object.getPrototypeOf(component));
      const superSpy = jest.spyOn(proto, 'switchToViewOnlyMode').mockImplementation(() => {});

      component.switchToViewOnlyMode();

      expect(superSpy).toHaveBeenCalled();
      superSpy.mockRestore();
      done();
    });
  });

  it('refreshElementHasValueClasses should add formio-component__view-only-table class when viewMode is TABLE', done => {
    Harness.testCreate(SelectJournalComponent, comp1).then(component => {
      component.element = document.createElement('div');
      component.component.source = { viewMode: 'table' };

      component.refreshElementHasValueClasses();

      expect(component.element.classList.contains('formio-component__view-only-table')).toBe(true);
      done();
    });
  });

  describe('customJournalId', () => {
    it('Should have empty customJournalId in default schema', () => {
      expect(SelectJournalComponent.schema().customJournalId).toBe('');
    });

    it('Should resolve journalId from customJournalId expression using form data', done => {
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        customJournalId: 'value = data._parentType === "deal" ? "deals-journal" : "project-journal";'
      }).then(component => {
        component.root.data = { ...component.root.data, _parentType: 'deal' };
        expect(component.journalId).toBe('deals-journal');

        component.root.data = { ...component.root.data, _parentType: 'project' };
        expect(component.journalId).toBe('project-journal');
        done();
      });
    });

    it('Should fall back to static journalId when customJournalId returns empty', done => {
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        journalId: 'static-journal',
        customJournalId: 'value = data._parentType === "deal" ? "deals-journal" : "";'
      }).then(component => {
        component.root.data = { ...component.root.data, _parentType: 'deal' };
        expect(component.journalId).toBe('deals-journal');

        // The data the expression depends on is gone: the field keeps working on the static journal
        // instead of reporting a missing journal id.
        component.root.data = { ...component.root.data, _parentType: undefined };
        expect(component.journalId).toBe('static-journal');
        done();
      });
    });

    it('Should not report a broken customJournalId to the console and should fall back to static journalId', done => {
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        journalId: 'static-journal',
        // What a half-typed expression looks like in the component editor
        customJournalId: 'var typeMap = { "marketing": "country-iso3166"'
      }).then(component => {
        // formio's `evaluate` is what logs the failed compile, so the guard has to keep the broken
        // source away from it entirely
        const evaluateSpy = jest.spyOn(component, 'evaluate');

        expect(component.journalId).toBe('static-journal');
        // Read again: the parse verdict is cached per source, so neither read reaches formio
        expect(component.journalId).toBe('static-journal');

        expect(evaluateSpy).not.toHaveBeenCalled();
        evaluateSpy.mockRestore();
        done();
      });
    });

    it('checkConditions should push new journalId via setReactProps when customJournalId changes', done => {
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        customJournalId: 'value = data._parentType === "deal" ? "deals-journal" : "";'
      }).then(component => {
        const setReactPropsSpy = jest.spyOn(component, 'setReactProps').mockImplementation(() => {});
        const cancelSpy = jest.spyOn(component.delayedSettingProps, 'cancel').mockImplementation(() => {});

        component.root.data = { ...component.root.data, _parentType: 'deal' };
        component.checkConditions(component.root.data);

        expect(cancelSpy).toHaveBeenCalled();
        // First result of the expression: the child keeps the value the record was opened with
        expect(setReactPropsSpy).toHaveBeenCalledWith({ journalId: 'deals-journal', keepValueOnJournalIdChange: true });
        expect(component.customJournalIdValue).toBe('deals-journal');

        setReactPropsSpy.mockClear();
        cancelSpy.mockClear();

        // Same data → no further push
        component.checkConditions(component.root.data);
        expect(setReactPropsSpy).not.toHaveBeenCalled();

        // Change data → pushed again, and now the switch clears the value
        component.root.data = { ...component.root.data, _parentType: 'project' };
        component.checkConditions(component.root.data);
        expect(setReactPropsSpy).toHaveBeenCalledWith({ journalId: '', keepValueOnJournalIdChange: false });

        setReactPropsSpy.mockRestore();
        cancelSpy.mockRestore();
        done();
      });
    });

    it('getInitialReactProps should skip the type-level journal lookup only while the expression resolves', async () => {
      const component = await Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        journalId: 'static-journal',
        customJournalId: 'value = data.kind ? "dyn-journal" : "";'
      });
      const getJournalIdSpy = jest.spyOn(component, 'getJournalId').mockResolvedValue('journal-from-type');

      // expression resolves → its result owns the journal, no type-level lookup is made
      component.root.data = { ...component.root.data, kind: 'x' };
      expect((await component.getInitialReactProps()).journalId).toBe('dyn-journal');
      expect(getJournalIdSpy).not.toHaveBeenCalled();

      // expression empty → the static journalId goes through the pre-existing type-level lookup
      component.root.data = { ...component.root.data, kind: undefined };
      expect((await component.getInitialReactProps()).journalId).toBe('static-journal');
      expect(getJournalIdSpy).toHaveBeenCalledWith('static-journal');

      getJournalIdSpy.mockRestore();
    });

    it('Should not mistake a later switch for the first resolution when the expression first returns the id in play', done => {
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        journalId: 'deals-journal',
        customJournalId: 'value = data.kind === "deal" ? "deals-journal" : (data.kind === "proj" ? "projects-journal" : "");'
      }).then(component => {
        const setReactPropsSpy = jest.spyOn(component, 'setReactProps').mockImplementation(() => {});

        // build-time pass: no data, so the static journalId is what the child gets
        component.checkConditions(component.root.data);
        setReactPropsSpy.mockClear();

        // the record's data arrives and the expression returns exactly the id already in play —
        // nothing to push, but the expression *has* resolved
        component.root.data = { ...component.root.data, kind: 'deal' };
        component.checkConditions(component.root.data);
        expect(setReactPropsSpy).not.toHaveBeenCalled();

        // ... so this switch is a user-driven one and must clear the value picked from deals-journal
        component.root.data = { ...component.root.data, kind: 'proj' };
        component.checkConditions(component.root.data);
        expect(setReactPropsSpy).toHaveBeenCalledWith({ journalId: 'projects-journal', keepValueOnJournalIdChange: false });

        setReactPropsSpy.mockRestore();
        done();
      });
    });

    it('Should carry keepValueOnJournalIdChange on every props push, not only the one checkConditions makes', done => {
      // `setReactProps` merges into whatever the child already has, so a `true` left over from the
      // first resolution would swallow the reset on a journalId pushed through `delayedSettingProps`
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        journalId: 'static-journal',
        customJournalId: 'value = data.kind ? "dyn-journal" : "";'
      }).then(component => {
        const setReactPropsSpy = jest.spyOn(component, 'setReactProps').mockImplementation(() => {});

        component.root.data = { ...component.root.data, kind: 'x' };
        component.checkConditions(component.root.data);
        expect(setReactPropsSpy).toHaveBeenCalledWith({ journalId: 'dyn-journal', keepValueOnJournalIdChange: true });

        setReactPropsSpy.mockClear();

        // the debounced path pushes the journalId too, and must reset the flag while doing so
        component.root.data = { ...component.root.data, kind: undefined };
        component.delayedSettingProps({});
        component.delayedSettingProps.flush();

        expect(setReactPropsSpy).toHaveBeenCalledWith(
          expect.objectContaining({ journalId: 'static-journal', keepValueOnJournalIdChange: false })
        );

        setReactPropsSpy.mockRestore();
        done();
      });
    });

    it('checkConditions should not touch React when customJournalId is empty', done => {
      Harness.testCreate(SelectJournalComponent, comp1).then(component => {
        const setReactPropsSpy = jest.spyOn(component, 'setReactProps').mockImplementation(() => {});

        component.checkConditions(component.root.data);

        expect(setReactPropsSpy).not.toHaveBeenCalled();
        setReactPropsSpy.mockRestore();
        done();
      });
    });
  });
});
