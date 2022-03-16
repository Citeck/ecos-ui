import _merge from 'lodash/merge';

import Harness from '../../../test/harness';
import BaseComponent from './Base';
import { extractLabel } from '../../../../helpers/util';

import { comp1, comp2, comp3, multipleWithDraggableRows } from './fixtures';

let draggableRowsComponent;
const draggableRowsComponentData = ['one', 'two', 'three'];

describe('Base Component', () => {
  it('Should build a base component', done => {
    Harness.testCreate(BaseComponent, comp1).then(component => {
      const inputs = Harness.testElements(component, 'input[type="text"]', 1);
      for (let i = 0; i < inputs.length; i++) {
        expect(inputs[i].name).toBe(`data[${comp1.key}]`);
      }
      done();
    });
  });

  it('Should build a base component with ML fields', done => {
    Harness.testCreate(BaseComponent, comp3).then(component => {
      const inputs = Harness.testElements(component, 'input[type="text"]', 1);

      for (let i = 0; i < inputs.length; i++) {
        expect(inputs[i].name).toBe(`data[${comp3.key}]`);
        expect(inputs[i].placeholder).toBe(comp3.placeholder.ru);
      }

      expect(component.label).toBe(comp3.label.en);
      expect(component.element.querySelector('.help-block').innerHTML).toBe(comp3.description.en);

      component.tooltip.show();
      expect(component.tooltip.popperInstance.popper.querySelector('.tooltip-inner').innerHTML).toBe(comp3.tooltip.ru);

      done();
    });
  });

  it('Should return string value of ML fields', done => {
    Harness.testCreate(BaseComponent, comp3).then(component => {
      expect(component.component.placeholderByLocale).toBe(comp3.placeholder.ru);
      expect(component.component.labelByLocale).toBe(comp3.label.en);
      expect(component.component.descriptionByLocale).toBe(comp3.description.en);
      expect(component.component.tooltipByLocale).toBe(comp3.tooltip.ru);

      done();
    });
  });

  it('Should provide required validation', done => {
    Harness.testCreate(
      BaseComponent,
      _merge({}, comp1, {
        validate: { required: true }
      })
    ).then(component =>
      Harness.testComponent(
        component,
        {
          bad: {
            value: '',
            field: 'firstName',
            error: extractLabel('required')
          },
          good: {
            value: 'te'
          }
        },
        done
      )
    );
  });

  it('Should provide minLength validation', done => {
    Harness.testCreate(
      BaseComponent,
      _merge({}, comp1, {
        validate: { minLength: 2 }
      })
    ).then(component =>
      Harness.testComponent(
        component,
        {
          bad: {
            value: 't',
            field: 'firstName',
            error: extractLabel('minLength')
          },
          good: {
            value: 'te'
          }
        },
        done
      )
    );
  });

  it('Should provide maxLength validation', done => {
    Harness.testCreate(
      BaseComponent,
      _merge({}, comp1, {
        validate: { maxLength: 5 }
      })
    ).then(component =>
      Harness.testComponent(
        component,
        {
          bad: {
            value: 'testte',
            field: 'firstName',
            error: extractLabel('maxLength')
          },
          good: {
            value: 'te'
          }
        },
        done
      )
    );
  });

  it('Should provide custom validation', done => {
    Harness.testCreate(
      BaseComponent,
      _merge({}, comp1, {
        validate: {
          custom: 'valid = (input !== "Joe") ? true : "You cannot be Joe"'
        }
      })
    ).then(component =>
      Harness.testComponent(
        component,
        {
          bad: {
            value: 'Joe',
            field: 'firstName',
            error: 'You cannot be Joe'
          },
          good: {
            value: 'Tom'
          }
        },
        done
      )
    );
  });

  it('Should provide json validation', done => {
    Harness.testCreate(
      BaseComponent,
      _merge({}, comp1, {
        validate: {
          json: {
            if: [
              {
                '===': [{ var: 'data.firstName' }, 'Joe']
              },
              true,
              'You must be Joe'
            ]
          }
        }
      })
    ).then(component =>
      Harness.testComponent(
        component,
        {
          bad: {
            value: 'Tom',
            field: 'firstName',
            error: 'You must be Joe'
          },
          good: {
            value: 'Joe'
          }
        },
        done
      )
    );
  });

  it('Should allow for multiple values', done => {
    Harness.testCreate(BaseComponent, comp2).then(component => {
      Harness.testElements(component, 'table', 1);
      Harness.testElements(component, 'table tr', 2);
      Harness.testElements(component, 'table tr:first-child td', 2);
      Harness.testElements(component, 'table tr:first-child td:first-child input[name="data[names]"]', 1);
      Harness.testElements(component, 'table tr:first-child td:last-child .glyphicon-remove-circle', 1);
      done();
    });
  });

  it("Shouldn't allow read value", done => {
    Harness.testCreate(BaseComponent, _merge({}, comp1, { unreadable: true }), { readOnly: false }).then(component =>
      Harness.testUnreadableField(component, done)
    );
  });

  describe('Draggable Rows Functionality', () => {
    it('Should populate Drag Info for each row', done => {
      Harness.testCreate(BaseComponent, multipleWithDraggableRows).then(component => {
        component.setValue(draggableRowsComponentData);
        draggableRowsComponent = component;
        draggableRowsComponentData.forEach((value, index) => {
          expect(!!component.tbody.children[index].dragInfo).toBe(true);
          expect(component.tbody.children[index].dragInfo.index).toEqual(index);
        });
        done();
      });
    });

    it('Should switch data values according to how rows are dragged', done => {
      draggableRowsComponent.setValue(draggableRowsComponentData);
      //fake dropping last element at first position
      draggableRowsComponent.onRowDrop(
        draggableRowsComponent.tbody.children[2],
        draggableRowsComponent.tbody,
        draggableRowsComponent.tbody,
        draggableRowsComponent.tbody.children[0]
      );
      expect(draggableRowsComponent.dataValue[0]).toEqual(draggableRowsComponentData[2]);
      expect(draggableRowsComponent.dataValue[1]).toEqual(draggableRowsComponentData[0]);
      expect(draggableRowsComponent.dataValue[2]).toEqual(draggableRowsComponentData[1]);
      done();
    });

    it('Should allow dragging row to last position', done => {
      draggableRowsComponent.setValue(draggableRowsComponentData);
      //fake dropping first element at last position
      draggableRowsComponent.onRowDrop(
        draggableRowsComponent.tbody.children[0],
        draggableRowsComponent.tbody,
        draggableRowsComponent.tbody,
        undefined
      );
      expect(draggableRowsComponent.dataValue[0]).toEqual(draggableRowsComponentData[1]);
      expect(draggableRowsComponent.dataValue[1]).toEqual(draggableRowsComponentData[2]);
      expect(draggableRowsComponent.dataValue[2]).toEqual(draggableRowsComponentData[0]);
      done();
    });
  });

  describe('shouldSkipValidation', () => {
    it('should return true if component is hidden', done => {
      Harness.testCreate(BaseComponent, comp1)
        .then(cmp => {
          cmp.visible = false;
          cmp.checkCondition = () => true;
          expect(cmp.visible).toBe(false);
          expect(cmp.checkCondition()).toBe(true);
          expect(cmp.shouldSkipValidation()).toBe(true);
          done();
        }, done)
        .catch(done);
    });

    it('should return true if component is conditionally hidden', done => {
      Harness.testCreate(BaseComponent, comp1)
        .then(cmp => {
          cmp.visible = true;
          cmp.checkCondition = () => false;
          expect(cmp.visible).toBe(true);
          expect(cmp.checkCondition()).toBe(false);
          expect(cmp.shouldSkipValidation()).toBe(true);
          done();
        }, done)
        .catch(done);
    });

    it('should return false if not hidden', done => {
      Harness.testCreate(BaseComponent, comp1)
        .then(cmp => {
          cmp.visible = true;
          cmp.checkCondition = () => true;
          expect(cmp.visible).toBe(true);
          expect(cmp.checkCondition()).toBe(true);
          expect(cmp.shouldSkipValidation()).toBe(false);
          done();
        }, done)
        .catch(done);
    });
  });
});
