import * as Util from '../util';

describe('Journal util', () => {
  it('fun getCreateVariantKeyField', async () => {
    let fields = Util.getCreateVariantKeyField({
      _object: {},
      _null: null,
      _und: undefined,
      _bool: true,
      _str1: 'string',
      _str2: 'string string'
    });
    expect(fields).toEqual(['_str1', '_str2']);
  });
});
