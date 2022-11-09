import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
import SelectOrgstructComponent from './SelectOrgstruct';
import { basicSectionTest } from '../../../test/builder/helpers';
import comp1 from './fixtures/comp1';

console.error = jest.fn();

basicSectionTest(SelectOrgstructComponent);

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

  it('set-get value test', done => {
    Harness.testCreate(SelectOrgstructComponent, comp1).then(component => {
      Harness.testSetGet(component, 'workspace://SpacesStore/record@record-1');

      component.setValue('workspace://SpacesStore/record@record-2');

      component.on('componentChange', () => {
        expect(component.getValue()).toEqual('workspace://SpacesStore/record@record-2');

        done();
      });
    });
  });
});
