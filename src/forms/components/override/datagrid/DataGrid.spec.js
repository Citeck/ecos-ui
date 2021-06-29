import Harness from '../../../test/harness';
import DataGridComponent from './DataGrid';
import { basicSectionTest } from '../../../test/builder/helpers';

import { comp1, comp2, withDefValue, withRowGroupsAndDefValue } from './fixtures';

basicSectionTest(DataGridComponent);

describe('DataGrid Component', function() {
  it('Should build a data grid component', done => {
    Harness.testCreate(DataGridComponent, comp1).then(component => {
      Harness.testElements(component, 'input[type="text"]', 3);
      done();
    });
  });

  it('Should get and set values within the grid.', done => {
    Harness.testCreate(DataGridComponent, comp1).then(component => {
      Harness.testSetGet(component, [
        {
          make: 'Jeep',
          model: 'Wrangler',
          year: 1997
        },
        {
          make: 'Chevy',
          model: 'Tahoe',
          year: 2014
        }
      ]);
      done();
    });
  });

  it('Should be able to add another row.', done => {
    Harness.testCreate(DataGridComponent, comp1).then(component => {
      Harness.testSetGet(component, [
        {
          make: 'Jeep',
          model: 'Wrangler',
          year: 1997
        }
      ]);
      component.addValue();
      expect(component.getValue()).toEqual([
        {
          make: 'Jeep',
          model: 'Wrangler',
          year: 1997
        },
        {
          make: '',
          model: '',
          year: ''
        }
      ]);
      done();
    });
  });

  it('Should allow provide default value', function(done) {
    try {
      Harness.testCreate(DataGridComponent, withDefValue)
        .then(datagrid => {
          expect(datagrid.getValue()).toEqual([{ name: 'Alex', age: 1 }, { name: 'Bob', age: 2 }, { name: 'Conny', age: 3 }]);
          done();
        }, done)
        .catch(done);
    } catch (err) {
      done(err);
    }
  });

  it('Should allow provide default value in row-groups model', function(done) {
    try {
      Harness.testCreate(DataGridComponent, withRowGroupsAndDefValue)
        .then(datagrid => {
          expect(datagrid.getValue()).toEqual([
            { name: 'Alex', age: 1 },
            { name: 'Bob', age: 2 },
            { name: 'Conny', age: 3 },
            { name: '', age: '' },
            { name: '', age: '' }
          ]);
          done();
        }, done)
        .catch(done);
    } catch (err) {
      done(err);
    }
  });

  it('Should display the correct field names (by locale) in the header', done => {
    Harness.testCreate(DataGridComponent, comp1).then(component => {
      Harness.testElement(component, 'thead tr th:nth-child(1)', true);
      Harness.testInnerHtml(component, 'thead tr th:nth-child(1)', component.component.components[0].labelByLocale);

      Harness.testElement(component, 'thead tr th:nth-child(2)', true);
      Harness.testInnerHtml(component, 'thead tr th:nth-child(2)', component.component.components[1].labelByLocale);

      Harness.testElement(component, 'thead tr th:nth-child(3)', true);
      Harness.testInnerHtml(component, 'thead tr th:nth-child(3)', component.component.components[2].labelByLocale);
      done();
    });
  });

  it('Should display the correct label (by locale)', done => {
    Harness.testCreate(DataGridComponent, comp1).then(component => {
      Harness.testElement(component, '.formio-component-cars label.control-label', true);
      Harness.testInnerHtml(component, '.formio-component-cars label.control-label', component.label);
      done();
    });
  });
});

describe('DataGrid Panels', () => {
  it('Should build a data grid component', done => {
    Harness.testCreate(DataGridComponent, comp2).then(component => {
      done();
    });
  });

  it('Should be able to set the values of one panel in the DataGrid.', done => {
    Harness.testCreate(DataGridComponent, comp2).then(component => {
      Harness.testSetGet(component, [
        {
          firstName: 'Joe',
          lastName: 'Smith'
        }
      ]);

      // Now add a new row.
      component.addValue();
      expect(component.getValue()).toEqual([
        {
          firstName: 'Joe',
          lastName: 'Smith'
        },
        {
          firstName: '',
          lastName: ''
        }
      ]);
      done();
    });
  });
});
