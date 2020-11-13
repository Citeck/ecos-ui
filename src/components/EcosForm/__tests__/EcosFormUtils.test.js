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
  const debug = true;

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

  describe('isComponentsReadyWaiting method', () => {
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

    it('TEST SIMPLE OK', async () => {
      const _safe = EcosFormUtils.isComponentsReady;
      EcosFormUtils.isComponentsReady = () => true;
      const result = await EcosFormUtils.isComponentsReadyWaiting(formReadyComponents.empty, { debug });
      EcosFormUtils.isComponentsReady = _safe;
      expect(result).toBeTruthy();
    });

    it('TEST SIMPLE FAIL', async () => {
      const _safe = EcosFormUtils.isComponentsReady;
      EcosFormUtils.isComponentsReady = () => false;
      const result = await EcosFormUtils.isComponentsReadyWaiting(formReadyComponents.empty, { debug, attempts: 3 });
      EcosFormUtils.isComponentsReady = _safe;
      expect(result).toBeFalsy();
    });

    it('TEST FORM', async () => {
      spy(1001);
      const form = await Formio.createForm(document.createElement('div'), formDefinition1);
      const result = await EcosFormUtils.isComponentsReadyWaiting(form.components, { debug });

      expect(result).toBeTruthy();
    });
  });

  describe('isComponentsReady method', () => {
    it('TEST OK', () => {
      const result = EcosFormUtils.isComponentsReady(formReadyComponents.allReady, { debug });
      expect(result).toBeTruthy();
    });

    it('TEST FAIL', () => {
      const result = EcosFormUtils.isComponentsReady(formReadyComponents.notAllReady, { debug });
      expect(result).toBeFalsy();
    });
  });
});
