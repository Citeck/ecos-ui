import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
import SelectOrgstructComponent from './SelectOrgstruct';

import comp1 from './fixtures/comp1';

describe('SelectOrgstruct Component', () => {
  it('Should build a SelectOrgstruct component', done => {
    Harness.testCreate(SelectOrgstructComponent, comp1).then(() => {
      done();
    });
  });

  it('Should be unreadable value', done => {
    const comp = Object.assign(cloneDeep(comp1), { unreadable: true });

    Harness.testCreate(SelectOrgstructComponent, comp, { readOnly: false }).then(component => Harness.testUnreadableField(component, done));
  });
});
