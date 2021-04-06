import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
import EcosSelectComponent from './EcosSelect';

import { comp1, comp2 } from './fixtures';

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
});
