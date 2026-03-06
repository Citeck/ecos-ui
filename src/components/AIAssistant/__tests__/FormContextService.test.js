jest.mock('@/helpers/util', () => ({
  getTextByLocale: jest.fn(val => val)
}));

import FormContextService from '../FormContextService';

describe('FormContextService', () => {
  describe('applyExtractionConfig', () => {
    it('returns all data with "all" strategy', () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(FormContextService.applyExtractionConfig(data, { strategy: 'all' })).toEqual(data);
    });

    it('applies whitelist strategy', () => {
      const data = { a: 1, b: 2, c: 3 };
      const result = FormContextService.applyExtractionConfig(data, {
        strategy: 'whitelist',
        fields: ['a', 'c']
      });
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('applies blacklist strategy', () => {
      const data = { a: 1, b: 2, c: 3 };
      const result = FormContextService.applyExtractionConfig(data, {
        strategy: 'blacklist',
        blacklistFields: ['b']
      });
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it('applies transform function', () => {
      const data = { a: 1 };
      const result = FormContextService.applyExtractionConfig(data, {
        strategy: 'all',
        transform: (d) => ({ ...d, transformed: true })
      });
      expect(result).toEqual({ a: 1, transformed: true });
    });

    it('returns empty object for null/undefined/empty data', () => {
      expect(FormContextService.applyExtractionConfig(null)).toEqual({});
      expect(FormContextService.applyExtractionConfig(undefined)).toEqual({});
      expect(FormContextService.applyExtractionConfig({})).toEqual({});
    });
  });

  describe('sanitizeForAI', () => {
    it('removes fields matching exclude patterns', () => {
      const data = {
        name: 'test',
        password: 'secret123',
        apiToken: 'tok123',
        secretKey: 'key',
        someCredential: 'cred',
        data_internal: 'int'
      };
      const result = FormContextService.sanitizeForAI(data);
      expect(result).toEqual({ name: 'test' });
    });

    it('removes functions and symbols', () => {
      const data = {
        name: 'test',
        callback: () => {},
        sym: Symbol('test')
      };
      const result = FormContextService.sanitizeForAI(data);
      expect(result).toEqual({ name: 'test' });
    });

    it('recursively sanitizes nested objects', () => {
      const data = {
        name: 'test',
        nested: {
          value: 'keep',
          password: 'remove'
        }
      };
      const result = FormContextService.sanitizeForAI(data);
      expect(result).toEqual({
        name: 'test',
        nested: { value: 'keep' }
      });
    });

    it('sanitizes arrays', () => {
      const data = {
        items: [
          { name: 'item1', password: 'secret' },
          { name: 'item2' }
        ]
      };
      const result = FormContextService.sanitizeForAI(data);
      expect(result).toEqual({
        items: [
          { name: 'item1' },
          { name: 'item2' }
        ]
      });
    });

    it('filters out functions and symbols from arrays', () => {
      const data = {
        items: ['a', () => {}, 'b']
      };
      const result = FormContextService.sanitizeForAI(data);
      expect(result).toEqual({ items: ['a', 'b'] });
    });

    it('handles circular references', () => {
      const data = { name: 'test' };
      data.self = data;
      const result = FormContextService.sanitizeForAI(data);
      expect(result).toEqual({ name: 'test' });
    });

    it('removes empty nested objects', () => {
      const data = {
        name: 'test',
        empty: {},
        nested: { password: 'secret' }
      };
      const result = FormContextService.sanitizeForAI(data);
      expect(result).toEqual({ name: 'test' });
    });

    it('returns empty object for null/undefined/empty', () => {
      expect(FormContextService.sanitizeForAI(null)).toEqual({});
      expect(FormContextService.sanitizeForAI(undefined)).toEqual({});
      expect(FormContextService.sanitizeForAI({})).toEqual({});
    });
  });

  describe('extractContextData', () => {
    it('returns empty object when formInstance is null', () => {
      expect(FormContextService.extractContextData(null, 'computed_attribute')).toEqual({});
    });

    it('returns empty object when extraction is disabled', () => {
      const form = { root: { parentForm: { data: { name: 'test' } } } };
      expect(FormContextService.extractContextData(form, 'bpmn_script_task')).toEqual({});
    });

    it('returns empty object when no parent form data', () => {
      const form = {};
      expect(FormContextService.extractContextData(form, 'computed_attribute')).toEqual({});
    });

    it('extracts and sanitizes data with "all" strategy', () => {
      const form = {
        root: {
          parentForm: {
            data: {
              name: 'test',
              description: 'desc',
              password: 'secret'
            }
          }
        }
      };

      const result = FormContextService.extractContextData(form, 'computed_attribute');
      expect(result).toEqual({ name: 'test', description: 'desc' });
    });

    it('uses custom config override', () => {
      const form = {
        root: {
          parentForm: {
            data: { a: 1, b: 2, c: 3 }
          }
        }
      };
      const config = { enabled: true, strategy: 'whitelist', fields: ['a'] };

      const result = FormContextService.extractContextData(form, 'any', config);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('extractFieldContext', () => {
    it('extracts field context from form options', () => {
      const form = {
        root: {
          options: {
            fieldContext: { id: 'description', name: 'Description', type: 'TEXT' }
          }
        }
      };

      const result = FormContextService.extractFieldContext(form);
      expect(result).toEqual({ id: 'description', name: 'Description', type: 'TEXT' });
    });

    it('returns null when no fieldContext', () => {
      expect(FormContextService.extractFieldContext({})).toBeNull();
    });

    it('returns null when fieldContext has no id', () => {
      const form = {
        root: { options: { fieldContext: { name: 'test' } } }
      };
      expect(FormContextService.extractFieldContext(form)).toBeNull();
    });

    it('defaults type to TEXT when not specified', () => {
      const form = {
        root: { options: { fieldContext: { id: 'field1', name: 'Field' } } }
      };
      const result = FormContextService.extractFieldContext(form);
      expect(result.type).toBe('TEXT');
    });
  });
});
