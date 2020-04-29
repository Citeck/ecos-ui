import RecordActions from '../';
import './recordActions.mock';

describe('Testing RecordActions service', () => {
  it('Method replaceAttributeValues', async () => {
    const record = 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e';
    const data = [
      {
        input: { name: '${cm:name}' },
        output: { name: 'Договор №1244 (1).txt' }
      },
      {
        input: {
          someField: 'prefix-${cm:name}'
        },
        output: {
          someField: 'prefix-Договор №1244 (1).txt'
        }
      },
      {
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
        input: {
          withoutVariable: 'username=User, password=Password'
        },
        output: {
          withoutVariable: 'username=User, password=Password'
        }
      }
    ];

    expect.assertions(data.length);

    await Promise.all(
      data.map(async item => {
        const result = await RecordActions.replaceAttributeValues(item.input, record);

        return await expect(result).toEqual(item.output);
      })
    );
  });
});
