import { SourcesId } from '@citeck/constants';
import cloneDeep from 'lodash/cloneDeep';

import { basicSectionTest } from '../../../test/builder/helpers';
import Harness from '../../../test/harness';

import SelectOrgstructComponent from './SelectOrgstruct';
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

  it('Should be empty if data was deleted (multiple disabled)', done => {
    Harness.testCreate(SelectOrgstructComponent, comp1, { readOnly: false }).then(component => {
      expect(component.getValue()).toEqual(component.emptyValue);
      component.setValue('test');

      component.on('componentChange', () => {
        expect(component.getValue()).toEqual(`${SourcesId.PERSON}@test`);

        component.off('componentChange');
        component.on('componentChange', () => {
          expect(component.getValue()).toEqual(component.emptyValue);

          done();
        });

        component.setValue(null);
      });
    });
  });

  it('Should be empty if data was deleted (multiple enabled)', done => {
    Harness.testCreate(SelectOrgstructComponent, { ...comp1, multiple: true }, { readOnly: false }).then(component => {
      expect(component.getValue()).toEqual(component.emptyValue);
      component.setValue(['test']);

      component.on('componentChange', () => {
        expect(component.getValue()).toEqual([`${SourcesId.PERSON}@test`]);

        component.off('componentChange');
        component.on('componentChange', () => {
          expect(component.getValue()).toEqual(component.emptyValue);

          done();
        });

        component.setValue(null);
      });
    });
  });

  it('Should re-render when dynamic customRootGroupName changes via checkConditions (EMTC-689)', done => {
    const dynamicComp = {
      ...cloneDeep(comp1),
      customRootGroupName: "value = (data.cdPdApprovers_ad || {}).pdApGroup || '_no_authority_';"
    };

    Harness.testCreate(SelectOrgstructComponent, dynamicComp, { readOnly: false }).then(component => {
      expect(component._lastRootGroup).toBe('_no_authority_');
      const refreshSpy = jest.spyOn(component, 'refreshDOM');

      component.checkConditions({
        cdPdApprovers_ad: { pdApGroup: 'pdApprovers_NonICFF_CD' }
      });
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(component._lastRootGroup).toBe('pdApprovers_NonICFF_CD');

      component.checkConditions({
        cdPdApprovers_ad: { pdApGroup: 'pdApprovers_NonICFF_CD' }
      });
      expect(refreshSpy).toHaveBeenCalledTimes(1);

      done();
    });
  });
});
