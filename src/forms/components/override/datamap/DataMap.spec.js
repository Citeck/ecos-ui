import assert from 'power-assert';

import { basicSectionTest } from '../../../test/builder/helpers';
import Harness from '../../../test/harness';

import DataMapComponent from './DataMap';
import comp1 from './fixtures/comp1';

basicSectionTest(DataMapComponent);

describe('DataMap Component', () => {
  it('Should build a data map component', done => {
    Harness.testCreate(DataMapComponent, comp1).then(component => {
      done();
    });
  });

  it('Should get and set values within the datamap.', done => {
    Harness.testCreate(DataMapComponent, comp1).then(component => {
      Harness.testSetGet(component, {
        one: 'One',
        two: 'Two',
        three: 'Three'
      });
      done();
    });
  });

  it('Should correctly render key-value pair {"111": "Value"}', done => {
    Harness.testCreate(DataMapComponent, comp1).then(component => {
      component.setValue({
        111: 'Value'
      });

      const value = component.getValue();
      assert.deepEqual(
        value,
        {
          111: 'Value'
        },
        'Component did not set the value correctly'
      );

      done();
    });
  });

  it('addRow should set valueChangedByUser to true', done => {
    Harness.testCreate(DataMapComponent, comp1).then(component => {
      assert.ok(!component.valueChangedByUser, 'valueChangedByUser should be falsy initially');
      component.addRow();
      assert.strictEqual(component.valueChangedByUser, true);
      done();
    });
  });

  it('removeRow should set valueChangedByUser to true', done => {
    Harness.testCreate(DataMapComponent, comp1).then(component => {
      component.addRow();
      component.valueChangedByUser = false;
      const key = Object.keys(component.dataValue).pop();
      component.removeRow(key);
      assert.strictEqual(component.valueChangedByUser, true);
      done();
    });
  });

  it('calculateValue should return false when valueChangedByUser is true', done => {
    Harness.testCreate(DataMapComponent, comp1).then(component => {
      component.valueChangedByUser = true;
      const result = component.calculateValue({}, {});
      assert.strictEqual(result, false);
      done();
    });
  });

  it('calculateValue should delegate to super when valueChangedByUser is false', done => {
    Harness.testCreate(DataMapComponent, {
      ...comp1,
      calculateValue: "value = {test: 'calculated'}"
    }).then(component => {
      component.valueChangedByUser = false;
      const result = component.calculateValue(component.root.data, {});
      // super.calculateValue returns true when a calculated value expression is set and changes the value
      assert.ok(result !== false || result === undefined, 'should not short-circuit with false');
      done();
    });
  });
});
