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

  it('fun replacePlaceholders', async () => {
    let params = {
      valueStr: 'abc',
      valueNum: 123,
      valueNull: null,
      valueObj: {
        innerStr: 'str'
      },
      valueArr: ['first', 'second']
    };

    let result;

    result = Util.replacePlaceholders(
      {
        flat_str: '${valueStr}'
      },
      params
    );
    expect(result).toEqual({ flat_str: params['valueStr'] });

    result = Util.replacePlaceholders(
      {
        testArray: ['${valueNum}', '${valueNull}']
      },
      params
    );

    expect(result).toEqual({
      testArray: [params['valueNum'], null]
    });

    result = Util.replacePlaceholders(
      {
        emptyString: '${valueNull}${}',
        nullValue: '${valueNull}'
      },
      params
    );

    expect(result).toEqual({ emptyString: '', nullValue: null });

    result = Util.replacePlaceholders(
      {
        array: '${valueArr}'
      },
      params
    );

    expect(result).toEqual({ array: params.valueArr });
  });
});
