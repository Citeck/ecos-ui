import Records from '../../Records';
import EcosFormUtils from '../EcosFormUtils/EcosFormUtils';
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
  ecosSelectCaseWithoutDataSrc,
  ecosSelectCaseWithoutDataSrcOptimized,
  emptyObjectsCase,
  emptyObjectsCaseOptimized,
  formReadyComponents,
  selectJournalCase,
  selectJournalCaseOptimized,
  simpleCase,
  simpleCaseOptimized,
  tableFormCase,
  tableFormCaseOptimized
} from '../__fixtures__/EcosFormUtils.fixtures';

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
        title: `leave "data.url" attribute when optimize EcosSelect component without dataSrc attribute`,
        input: ecosSelectCaseWithoutDataSrc,
        output: ecosSelectCaseWithoutDataSrcOptimized
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

  describe('getForm method', () => {
    const spy = [];

    afterEach(() => {
      spy.forEach(item => {
        item && item.mockClear();
      });
    });

    it('error if record not found', () => {
      return EcosFormUtils.getForm().catch(e => {
        expect(e).toEqual('variable-not-found');
      });
    });

    it('record is string, without formKey', () => {
      const recordId = 'record-id';
      const load = async attrs => ({ ...attrs, id: recordId });
      const get = id => ({
        id,
        getBaseRecord: () => ({ id, load }),
        get,
        load
      });

      spy.push(jest.spyOn(Records, 'get').mockImplementation(get));
      spy.push(jest.spyOn(EcosFormUtils, 'isFormId').mockImplementation(() => true));
      spy.push(jest.spyOn(EcosFormUtils, 'getFormById').mockImplementation(() => ({ id: recordId })));

      return EcosFormUtils.getForm(recordId).then(result => {
        expect(result.id).toBe(recordId);
      });
    });
  });

  describe('getAttrsFromTemplate method', () => {
    it('should return an empty array when no matches found', () => {
      const result = EcosFormUtils.getAttrsFromTemplate('No template here');
      expect(result).toEqual([]);
    });

    it('should extract attributes from strings with templates', () => {
      const str = 'Hello ${name} and ${?disp}';
      const result = EcosFormUtils.getAttrsFromTemplate(str);
      expect(result).toEqual(['name', '?disp']);
    });

    it('should trim whitespace from extracted attribute names', () => {
      const str = 'Hello ${fullName} and ${ email }';
      const result = EcosFormUtils.getAttrsFromTemplate(str);
      expect(result).toEqual(['fullName', 'email']);
    });

    it('should extract multiple unique attributes from a string', () => {
      const str = 'User: ${user?id}, Display Name: ${_disp}, Settings: ${model.attributes[]}';
      const result = EcosFormUtils.getAttrsFromTemplate(str);
      expect(result).toEqual(['user?id', '_disp', 'model.attributes[]']);
    });

    it('should return an empty array when input string is null', () => {
      const result = EcosFormUtils.getAttrsFromTemplate(null);
      expect(result).toEqual([]);
    });

    it('should return an empty array when input string is empty', () => {
      const result = EcosFormUtils.getAttrsFromTemplate('');
      expect(result).toEqual([]);
    });

    it('Arguments with special characters - returns the list without deleting the special characters', () => {
      const result = EcosFormUtils.getAttrsFromTemplate('${ecos:alfresco} ${?disp} ${test:argument?json} ${list:argumentList[]!}');
      expect(result).toEqual(['ecos:alfresco', '?disp', 'test:argument?json', 'list:argumentList[]!']);
    });
  });

  describe('stripHTML method', () => {
    const EcosFormUtils = window.Citeck.EcosFormUtils;

    test('should return empty string for empty input', () => {
      expect(EcosFormUtils.stripHTML('')).toBe('');
    });

    test('should return empty string for null input', () => {
      expect(EcosFormUtils.stripHTML(null)).toBe('');
    });

    test('should return empty string for undefined input', () => {
      expect(EcosFormUtils.stripHTML(undefined)).toBe('');
    });

    test('should extract text content from HTML', () => {
      const html = '<div><p>Hello <b>World</b>!</p></div>';
      expect(EcosFormUtils.stripHTML(html)).toBe('Hello World!');
    });

    test('should handle nested HTML elements', () => {
      const html = '<div><span><b>Nested <i>Text</i></b></span></div>';
      expect(EcosFormUtils.stripHTML(html)).toBe('Nested Text');
    });

    test('should handle self-closing tags', () => {
      const html = '<input type="text"/><br/>';
      expect(EcosFormUtils.stripHTML(html)).toBe('');
    });

    test('should handle invalid HTML content', () => {
      const html = '<invalid><p>Some text</p>';
      expect(EcosFormUtils.stripHTML(html)).toBe('Some text');
    });

    test('should handle multiple root HTML nodes', () => {
      const html = '<p>First</p><p>Second</p>';
      expect(EcosFormUtils.stripHTML(html)).toBe('FirstSecond'); // No whitespace in between
    });

    test('should return text from multiple lines of HTML', () => {
      const html = '<div>Line1</div><div>Line2</div><div>Line3</div>';
      expect(EcosFormUtils.stripHTML(html)).toBe('Line1Line2Line3');
    });

    test('should return the text if it is not wrapped in HTML', () => {
      const html = 'plain text without any HTML tags';
      expect(EcosFormUtils.stripHTML(html)).toBe('plain text without any HTML tags');
    });
  });
});
