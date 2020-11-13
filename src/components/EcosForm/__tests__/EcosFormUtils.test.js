import Formio from 'formiojs/Formio';

import EcosFormUtils from '../EcosFormUtils';
import formDefinition1 from '../__mocks__/formDef.mock';
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
    const spy = time => {
      jest.spyOn(global, 'fetch').mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () =>
            new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  id: 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
                  attributes: {
                    '.disp': 'Договор №1244'
                  }
                });
              }, time);
            })
        });
      });
    };

    const debug = false;

    it('TEST OK', async () => {
      spy(1000);
      const form = await Formio.createForm(document.createElement('div'), formDefinition1);
      const result = await EcosFormUtils.isComponentsReady(form, { debug });

      expect(result).toBeTruthy();
    });

    it('TEST FAIL', async () => {
      spy(2000);
      const form = await Formio.createForm(document.createElement('div'), formDefinition1);
      const result = await EcosFormUtils.isComponentsReady(form, { debug, attempts: 1 });

      expect(result).toBeFalsy();
    });
  });
});
