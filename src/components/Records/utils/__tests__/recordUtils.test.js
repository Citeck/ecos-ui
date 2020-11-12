import * as RecordUtils from '../recordUtils';

import '../__mocks__/recordUtils.mock';

const RECORD = 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e';

describe('Record Utils', () => {
  describe('Function replaceAttributeValues', () => {
    const data = [
      {
        title: 'with simple field',
        input: {
          someField: 'prefix-${cm:name}'
        },
        output: {
          someField: 'prefix-Договор №1244 (1).txt'
        }
      },
      {
        title: 'with multiple fields',
        input: {
          someField: 'prefix-${idocs:performer}-${cm:name}'
        },
        output: {
          someField: 'prefix-Admin Adminov2-Договор №1244 (1).txt'
        }
      },
      {
        title: 'with inner objects',
        input: {
          someField: 'prefix-${cm:name}',
          innerObj: {
            innerField: '${.disp}-postfix',
            ref: 'recordRef = ${recordRef}',
            otherData: {
              contractor: 'Contractor: ${contracts:contractor}',
              performer: 'Performer: ${idocs:performer}',
              currency: 'Currency - ${contracts:agreementCurrency}'
            }
          }
        },
        output: {
          someField: 'prefix-Договор №1244 (1).txt',
          innerObj: {
            innerField: 'Договор №1244-postfix',
            ref: 'recordRef = workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
            otherData: {
              contractor: 'Contractor: ОАО ТЕСТ',
              performer: 'Performer: Admin Adminov2',
              currency: 'Currency - Рубль'
            }
          }
        }
      },
      {
        title: 'with array of strings',
        input: {
          name: '${cm:name}',
          arrayData: ['username', 'password', 'Договор с: ${contracts:contractWith}']
        },
        output: {
          name: 'Договор №1244 (1).txt',
          arrayData: ['username', 'password', 'Договор с: Заказчиком']
        }
      },
      {
        title: 'with array of objects',
        input: {
          arrayObjects: [
            { note: 'Примечание: ${idocs:note}' },
            { signatory: 'Подписант: ${idocs:signatory}' },
            { finance: 'Сумма договора ${contracts:agreementAmount} (в т.ч. НДС ${contracts:VAT})' }
          ]
        },
        output: {
          arrayObjects: [
            { note: 'Примечание: Тестовый договор' },
            { signatory: 'Подписант: Бухгалтер Горбункова' },
            { finance: 'Сумма договора 980000 (в т.ч. НДС 120000)' }
          ]
        }
      },
      {
        title: 'with simple string',
        input: {
          withoutVariable: 'username=User, password=Password'
        },
        output: {
          withoutVariable: 'username=User, password=Password'
        }
      },
      {
        title: 'with number',
        input: {
          totalCount: 300,
          sum: 100000,
          page: 12
        },
        output: {
          totalCount: 300,
          sum: 100000,
          page: 12
        }
      },
      {
        title: 'with nullable fields',
        input: {
          nullableField: '${nullableField}'
        },
        output: {
          nullableField: null
        }
      },
      {
        title: 'with boolean fields',
        input: {
          booleanField: '${booleanField?bool}',
          booleanField2: '${booleanField2?bool}'
        },
        output: {
          booleanField: false,
          booleanField2: true
        }
      },
      {
        title: 'with numeric fields',
        input: {
          numericField: '${numericField?num}'
        },
        output: {
          numericField: 125
        }
      },
      {
        title: 'string mask with numeric and boolean fields',
        input: {
          numericField: 'Total: ${numericField?num}',
          booleanField: 'Result: ${booleanField?bool}'
        },
        output: {
          numericField: 'Total: 125',
          booleanField: 'Result: false'
        }
      }
    ];

    data.forEach(async item => {
      it(item.title, async () => {
        const result = await RecordUtils.replaceAttributeValues(item.input, RECORD);
        expect(result).toEqual(item.output);
      });
    });
  });

  describe('Function replaceAttrValuesForRecord', () => {
    const data = [
      {
        title: 'by own record',
        record: RECORD,
        url: '',
        input: {
          innerField: '${.disp}-postfix',
          ref: 'recordRef = ${recordRef}'
        },
        output: {
          innerField: 'Договор №1244-postfix',
          ref: 'recordRef = ' + RECORD
        }
      },
      {
        title: 'by url record',
        record: '',
        url: 'http://dev.com/v2/dashboard?recordRef=' + RECORD,
        input: {
          innerField: '${.disp}-postfix',
          ref: 'recordRef = ${recordRef}'
        },
        output: {
          innerField: 'Договор №1244-postfix',
          ref: 'recordRef = ' + RECORD
        }
      },
      {
        title: 'there is record nowhere',
        record: '',
        url: 'http://dev.com/v2/dashboard',
        input: {
          innerField: '${.disp}-postfix',
          ref: 'recordRef = ${recordRef}'
        },
        output: {
          innerField: '${.disp}-postfix',
          ref: 'recordRef = ${recordRef}'
        }
      }
    ];

    data.forEach(async item => {
      it(item.title, async () => {
        delete window.location;
        window.location = { href: item.url };

        const result = await RecordUtils.replaceAttrValuesForRecord(item.input, item.record);

        expect(result).toEqual(item.output);
      });
    });
  });

  describe('getSourceId', () => {
    [
      { input: undefined, output: '' },
      { input: null, output: '' },
      { input: 0, output: '' },
      { input: 1, output: '' },
      { input: '', output: '' },
      { input: '@id', output: '' },
      { input: 'source@', output: 'source' },
      { input: 'source@id', output: 'source' },
      { input: 'source@id@something', output: 'source' }
    ].forEach(caseItem => {
      it(`should return "${caseItem.output}" for recordId=${caseItem.input}`, () => {
        expect(RecordUtils.getSourceId(caseItem.input)).toBe(caseItem.output);
      });
    });
  });
});
