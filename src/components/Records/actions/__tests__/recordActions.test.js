import RecordActions from '../index';
import '../__mocks__/recordActions.mock';

describe('RecordActions service', () => {
  describe('Method replaceAttributeValues', () => {
    const record = 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e';
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
      }
    ];

    data.forEach(async item => {
      it(item.title, async () => {
        const result = await RecordActions.replaceAttributeValues(item.input, record);

        expect(result).toEqual(item.output);
      });
    });
  });
});
