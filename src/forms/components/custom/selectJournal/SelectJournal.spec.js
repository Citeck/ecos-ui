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
});
