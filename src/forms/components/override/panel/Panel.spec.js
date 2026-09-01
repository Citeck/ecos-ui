import { flattenComponents } from 'formiojs/utils/formUtils';
import fs from 'fs';
import path from 'path';

import Harness from '../../../test/harness';
import PanelComponent from './Panel';
import panelEditForm from './Panel.form';
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';

basicSectionTest(PanelComponent);

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

  // Formio builds the panel root element itself ('mb-2 card border panel panel-<theme>') instead of
  // going through Base.createElement, so a panel never gets the `formio-component-panel` class every
  // other component has. A stylesheet that assumes it silently stops applying — which is how the gap
  // above a panel header disappeared (COREDEV-403).
  it('view-mode panel gap selector should match a rendered panel', done => {
    const viewModeStyles = fs.readFileSync(path.resolve(__dirname, '../../../view-mode.scss'), 'utf8');
    const selector = viewModeStyles.match(/\$titled-panel:\s*'([^']+)'/);

    expect(selector).not.toBeNull();

    Harness.testCreate(PanelComponent, comp1).then(component => {
      expect(component.element.matches(selector[1])).toBe(true);
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
