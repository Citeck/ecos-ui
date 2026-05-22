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

    it('Should not fall back to static journalId on a real form when customJournalId returns empty', done => {
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        journalId: 'static-journal',
        customJournalId: 'value = "";'
      }).then(component => {
        expect(component.journalId).toBe('');
        done();
      });
    });

    it('Should fall back to static journalId in builder mode when customJournalId returns empty', done => {
      Harness.testCreate(SelectJournalComponent, {
        ...comp1,
        journalId: 'static-journal',
        customJournalId: 'value = "";'
      }).then(component => {
        component.options.builder = true;
        expect(component.journalId).toBe('static-journal');

        component.options.builder = false;
        component.options.preview = true;
        expect(component.journalId).toBe('static-journal');

        component.options.preview = false;
        component.options.editInFormBuilder = true;
        expect(component.journalId).toBe('static-journal');
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
        expect(setReactPropsSpy).toHaveBeenCalledWith({ journalId: 'deals-journal' });
        expect(component.customJournalIdValue).toBe('deals-journal');

        setReactPropsSpy.mockClear();
        cancelSpy.mockClear();

        // Same data → no further push
        component.checkConditions(component.root.data);
        expect(setReactPropsSpy).not.toHaveBeenCalled();

        // Change data → pushed again
        component.root.data = { ...component.root.data, _parentType: 'project' };
        component.checkConditions(component.root.data);
        expect(setReactPropsSpy).toHaveBeenCalledWith({ journalId: '' });

        setReactPropsSpy.mockRestore();
        cancelSpy.mockRestore();
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
