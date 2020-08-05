import EcosFormUtils from '../EcosFormUtils';
import {
  simpleCase,
  simpleCaseOptimized,
  emptyObjectsCase,
  emptyObjectsCaseOptimized,
  ecosSelectCase,
  ecosSelectCaseOptimized,
  datetimeCase,
  datetimeCaseOptimized,
  asyncDataCase,
  asyncDataCaseOptimized,
  datamapCase,
  datamapCaseOptimized,
  selectJournalCase,
  selectJournalCaseOptimized,
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
      }
    ];

    runTests(tests, EcosFormUtils.optimizeFormSchema);
  });
});
