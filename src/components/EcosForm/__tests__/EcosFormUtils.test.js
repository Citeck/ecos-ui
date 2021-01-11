import EcosFormUtils from '../EcosFormUtils';
import {
  asyncDataCase,
  asyncDataCaseOptimized,
  columnsCase,
  columnsCaseOptimized,
  dataGridAssocCaseOptimized,
  datamapCase,
  datamapCaseOptimized,
  datetimeCase,
  datetimeCaseOptimized,
  ecosSelectCase,
  ecosSelectCaseOptimized,
  emptyObjectsCase,
  emptyObjectsCaseOptimized,
  formReadyComponents,
  selectJournalCase,
  selectJournalCaseOptimized,
  simpleCase,
  simpleCaseOptimized,
  tableFormCase,
  tableFormCaseOptimized
} from '../__mocks__/EcosFormUtils.mock';

function runTests(tests, method) {
  tests.forEach(item => {
    it(item.title, () => {
      expect(method(item.input)).toEqual(item.output);
    });
  });
}

describe('EcosFormUtils', () => {
  describe('optimizeFormSchema method', () => {
    const tests = [
      {
        title: `Simple case: omit default attributes for TextField and Button components`,
        input: simpleCase,
        output: simpleCaseOptimized
      },
      {
        title: `Remove some empty objects attributes`,
        input: emptyObjectsCase,
        output: emptyObjectsCaseOptimized
      },
      {
        title: `optimize EcosSelect component`,
        input: ecosSelectCase,
        output: ecosSelectCaseOptimized
      },
      {
        title: `optimize DateTime component`,
        input: datetimeCase,
        output: datetimeCaseOptimized
      },
      {
        title: `optimize AsyncData component`,
        input: asyncDataCase,
        output: asyncDataCaseOptimized
      },
      {
        title: `optimize DataMap component`,
        input: datamapCase,
        output: datamapCaseOptimized
      },
      {
        title: `optimize SelectJournal component`,
        input: selectJournalCase,
        output: selectJournalCaseOptimized
      },
      {
        title: `optimize TableForm component`,
        input: tableFormCase,
        output: tableFormCaseOptimized
      },
      {
        title: `optimize Columns an Column components`,
        input: columnsCase,
        output: columnsCaseOptimized
      },
      {
        title: `leave "multiple" attribute when optimize DataGridAssoc component`,
        input: dataGridAssocCaseOptimized,
        output: dataGridAssocCaseOptimized
      }
    ];

    runTests(tests, EcosFormUtils.optimizeFormSchema);
  });

  describe('isComponentsReady method', () => {
    it('should be true if there is no "isReadyToSubmit" method', () => {
      const result = EcosFormUtils.isComponentsReady(formReadyComponents.simple, {});
      expect(result).toBeTruthy();
    });

    it('should be true if "isReadyToSubmit" returns true', () => {
      const result = EcosFormUtils.isComponentsReady(formReadyComponents.isReady, {});
      expect(result).toBeTruthy();
    });

    it('should be true if nested "isReadyToSubmit" returns true', () => {
      const result = EcosFormUtils.isComponentsReady(formReadyComponents.isReadyNested, {});
      expect(result).toBeTruthy();
    });

    it('should be false if "isReadyToSubmit" returns false', () => {
      const result = EcosFormUtils.isComponentsReady(formReadyComponents.isNotReady, {});
      expect(result).toBeFalsy();
    });

    it('should be false if nested "isReadyToSubmit" returns false', () => {
      const result = EcosFormUtils.isComponentsReady(formReadyComponents.isNotReadyNested, {});
      expect(result).toBeFalsy();
    });
  });

  describe('isComponentsReadyWaiting method', () => {
    let spy;
    afterEach(() => {
      spy && spy.mockClear();
    });

    it('simple positive case', async () => {
      spy = jest.spyOn(EcosFormUtils, 'isComponentsReady').mockImplementation(() => true);
      const result = await EcosFormUtils.isComponentsReadyWaiting([], { interval: 1 });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('positive case with 3 attempts', async () => {
      let isReadyResult = false;
      spy = jest.spyOn(EcosFormUtils, 'isComponentsReady').mockImplementation(() => isReadyResult);
      setTimeout(() => {
        isReadyResult = true;
      }, 20);

      const result = await EcosFormUtils.isComponentsReadyWaiting([], { attempts: 3, interval: 10 });

      expect(result).toBeTruthy();
    });

    it('negative case', async () => {
      spy = jest.spyOn(EcosFormUtils, 'isComponentsReady').mockImplementation(() => false);
      const result = await EcosFormUtils.isComponentsReadyWaiting([], { attempts: 3, interval: 1 });

      expect(spy).toHaveBeenCalledTimes(3);
      expect(result).toBeFalsy();
    });
  });
});
