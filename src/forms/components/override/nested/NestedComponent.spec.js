import each from 'lodash/each';
import _map from 'lodash/map';

import Harness from '../../../test/harness';
import NestedComponent from './NestedComponent';
import { basicSectionTest } from '../../../test/builder/helpers';
import { comp1 } from './fixtures';

basicSectionTest(NestedComponent);

describe('NestedComponent class', () => {
  let component = null;
  it('Should create a new NestedComponent class', done => {
    Harness.testCreate(NestedComponent, comp1).then(_component => {
      component = _component;
      Harness.testElements(component, 'input[name="data[firstName]"]', 1);
      Harness.testElements(component, 'input[name="data[lastName]"]', 1);
      done();
    });
  });

  it('Should be able to add new components', () => {
    component.addComponent({
      type: 'email',
      key: 'email',
      input: true
    });
    Harness.testElements(component, 'input[name="data[firstName]"]', 1);
  });

  it('Should be able to set data within the components.', () => {
    const value = {
      firstName: 'Joe',
      lastName: 'Smith',
      email: 'joe@example.com'
    };
    component.setValue(value);
    expect(component.getValue()).toEqual(value);
    each(component.components, component => {
      expect(component.getValue()).toBe(value[component.component.key]);
    });
  });

  it('Should create nested visibility elements.', done => {
    Harness.testCreate(NestedComponent, {
      components: [
        {
          type: 'checkbox',
          key: 'showPanel',
          label: 'Show Panel',
          input: true
        },
        {
          type: 'panel',
          key: 'parent',
          title: 'Parent Panel',
          conditional: {
            json: { var: 'data.showPanel' }
          },
          components: [
            {
              type: 'checkbox',
              key: 'showChild',
              label: 'Child 1',
              input: true,
              conditional: {
                json: { var: 'data.showChild' }
              }
            },
            {
              type: 'checkbox',
              key: 'forceParent',
              label: 'Child 2',
              input: true,
              conditional: {
                json: { var: 'data.forceParent' }
              }
            }
          ]
        }
      ]
    }).then(comp => {
      // Make sure we built the components tree.
      expect(comp.components.length).toBe(2);
      expect(comp.components[1].components.length).toBe(2);
      const data = {
        showPanel: true,
        showChild: false,
        forceParent: false
      };

      comp.setValue(data);
      comp.checkConditions(data);
      expect(comp.components[1]._visible).toBe(true);
      expect(comp.components[1].components[0]._visible).toBe(false);
      expect(comp.components[1].components[1]._visible).toBe(false);

      data.showChild = true;
      comp.setValue(data);
      comp.checkConditions(data);
      expect(comp.components[1]._visible).toBe(true);
      expect(comp.components[1].components[0]._visible).toBe(true);
      expect(comp.components[1].components[1]._visible).toBe(false);

      data.showPanel = false;
      comp.setValue(data);
      comp.checkConditions(data);
      expect(comp.components[1]._visible).toBe(false);
      expect(comp.components[1].components[0]._visible).toBe(true);
      expect(comp.components[1].components[1]._visible).toBe(false);
      done();
    });
  });

  describe('set/get visible', () => {
    it('should set/get visible flag on instance and child components', done => {
      Harness.testCreate(NestedComponent, comp1)
        .then(nested => {
          expect(nested.visible).toBe(true);
          nested.components.forEach(cmp => {
            expect(cmp.parentVisible).toBe(true);
          });

          nested.visible = false;

          expect(nested.visible).toBe(false);

          nested.components.forEach(cmp => {
            expect(cmp.parentVisible).toBe(false);
          });

          nested.visible = true;

          nested.components.forEach(cmp => {
            expect(cmp.parentVisible).toBe(true);
          });

          done();
        }, done)
        .catch(done);
    });
  });

  describe('set/get parentVisible', () => {
    it('should set/get parentVisible flag on instance and child components', done => {
      Harness.testCreate(NestedComponent, comp1)
        .then(nested => {
          expect(nested.parentVisible).toBe(true);

          nested.components.forEach(cmp => {
            expect(cmp.parentVisible).toBe(true);
          });

          nested.parentVisible = false;

          expect(nested.parentVisible).toBe(false);

          nested.components.forEach(cmp => {
            expect(cmp.parentVisible).toBe(false);
          });

          nested.parentVisible = true;

          expect(nested.parentVisible).toBe(true);

          nested.components.forEach(cmp => {
            expect(cmp.parentVisible).toBe(true);
          });

          done();
        }, done)
        .catch(done);
    });
  });

  describe('get schema', () => {
    it("components array shouldn't have duplicates", done => {
      Harness.testCreate(NestedComponent, comp1)
        .then(nested => {
          const child = nested.components[0];
          nested.components = [...nested.components, child, child, child];
          expect(nested.components).toHaveLength(5);
          expect(nested.schema.components).toHaveLength(2);
          expect(_map(nested.schema.components, 'key')).toEqual(['firstName', 'lastName']);
          done();
        }, done)
        .catch(done);
    });
  });
});
