import { convertValueByType } from '../util';

describe('Function convertValueByType', () => {
  const data = [
    { type: 'int', value: '15.3', out: 15, jsType: 'number' },
    { type: 'int', value: null, out: null, jsType: 'object' },
    { type: 'int', value: undefined, out: null, jsType: 'object' },
    { type: 'int', value: '15qwe', out: null, jsType: 'object' },
    { type: 'float', value: '15.3', out: 15.3, jsType: 'number' },
    { type: 'float', value: null, out: null, jsType: 'object' },
    { type: 'float', value: '15.3qwe', out: null, jsType: 'object' },
    { type: 'float', value: undefined, out: null, jsType: 'object' },
    { type: 'text', value: 'text', out: 'text', jsType: 'string' },
    { type: 'text', value: null, out: '', jsType: 'string' },
    { type: 'boolean', value: 'yes', out: true, jsType: 'boolean' },
    { type: 'boolean', value: 'no', out: false, jsType: 'boolean' },
    { type: 'boolean', value: '123321', out: null, jsType: 'object' }
  ];

  data.forEach(async item => {
    it(item.type + ' > ' + item.jsType, async () => {
      const result = convertValueByType(item.type, item.value);
      expect(result).toEqual(item.out);
      expect(item.jsType).toEqual(typeof result);
    });
  });
});
