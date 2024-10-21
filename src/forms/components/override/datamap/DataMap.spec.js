import Harness from '../../../test/harness';
import DataMapComponent from './DataMap';
import comp1 from './fixtures/comp1';
import { basicSectionTest } from '../../../test/builder/helpers';
import assert from 'power-assert';

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
        '111': 'Value'
      });

      const value = component.getValue();
      assert.deepEqual(
        value,
        {
          '111': 'Value'
        },
        'Component did not set the value correctly'
      );

      done();
    });
  });
});
