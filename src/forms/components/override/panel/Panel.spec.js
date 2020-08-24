import { flattenComponents } from 'formiojs/utils/formUtils';

import Harness from '../../../test/harness';
import PanelComponent from './Panel';
import panelEditForm from './Panel.form';

import comp1 from './fixtures/comp1';

describe('Panel Component', () => {
  it('Should build a panel component', done => {
    Harness.testCreate(PanelComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="text"]', 2);
      done();
    });
  });

  it('Panel should have correct classes', done => {
    Harness.testCreate(PanelComponent, comp1).then(component => {
      const panelClass = component.element.getAttribute('class');
      expect(panelClass.indexOf('card border')).not.toBe(-1);
      expect(panelClass.indexOf('panel panel-default')).not.toBe(-1);
      expect(component.element.childNodes[0].getAttribute('class').indexOf('card-header bg-default panel-heading')).not.toBe(-1);
      expect(component.element.childNodes[0].childNodes[0].getAttribute('class').indexOf('card-title panel-title')).not.toBe(-1);
      expect(component.element.childNodes[1].getAttribute('class').indexOf('card-body panel-body')).not.toBe(-1);
      done();
    });
  });

  describe('Edit Form', () => {
    it('should include components for important settings', () => {
      const components = flattenComponents(panelEditForm().components);
      const keys = Object.keys(components).map(path => components[path].key);
      const settings = ['breadcrumb', 'breadcrumbClickable'];

      expect(settings.every(s => keys.includes(s))).toBe(true);
    });
  });
});
