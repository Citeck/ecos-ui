import * as Util from '../util';

describe('Journal util', () => {
  it('fun fillTemplateAttsAndMapComputedScope', () => {
    const valuesWithoutPlaceHolders = [null, '', 'abcd', {}, { aa: 'bb' }, [], ['aa']];
    for (let value of valuesWithoutPlaceHolders) {
      let attributes = new Set();
      Util.fillTemplateAttsAndMapComputedScope(value, attributes);
      expect(attributes.size).toEqual(0);
    }

    let attributes = new Set();
    Util.fillTemplateAttsAndMapComputedScope('${abc}', attributes);
    expect(attributes.size).toEqual(1);
    expect(attributes.values().next().value).toEqual('abc');

    attributes = new Set();
    Util.fillTemplateAttsAndMapComputedScope('${abc{def}}', attributes);
    expect(attributes.size).toEqual(1);
    expect(attributes.values().next().value).toEqual('abc{def}');
  });

  it('fun mergeFilters', async () => {
    let result = Util.mergeFilters(
      [{ t: 'eq', a: 'field', v: 'value1' }],
      [{ t: 'contains', a: 'field', v: 'value2' }, { t: 'eq', att: 'abc', val: 'def' }],
      [{ t: 'contains', a: 'field2', v: 'value3' }]
    );
    expect(result).toEqual([
      { t: 'contains', a: 'field', v: 'value2' },
      { t: 'eq', att: 'abc', val: 'def' },
      { t: 'contains', a: 'field2', v: 'value3' }
    ]);
  });

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

    // test with unknown key

    result = Util.replacePlaceholders(
      {
        unknown: '${unknown}'
      },
      params
    );

    expect(result).toEqual({ unknown: '${unknown}' });

    // test with preproc key

    result = Util.replacePlaceholders(
      {
        key: '${prefix-valueStr}',
        withoutPrefix: '${valueNum}',
        deep: {
          deep: {
            arr: ['${prefix-valueStr}']
          }
        },
        multiKeys: '${valueNum}${prefix-valueStr}${valueNum}${prefix-valueStr}'
      },
      params,
      key => {
        if (key.indexOf('prefix-') === 0) {
          return key.replace('prefix-', '');
        } else {
          return null;
        }
      }
    );

    expect(result).toEqual({
      key: params.valueStr,
      withoutPrefix: '${valueNum}',
      deep: { deep: { arr: [params.valueStr] } },
      multiKeys: `\${valueNum}${params.valueStr}\${valueNum}${params.valueStr}`
    });
  });
});
