// jest.spyOn(global, 'fetch').mockImplementation(
//   jest.fn(
//     () => Promise.resolve({ json: () => Promise.resolve({
//       records: [
//         {
//           id: 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
//           attributes: {
//             'contracts:agreementCurrency?disp': 'Рубль',
//             'cm:name?disp': 'Договор №1244 (1).txt',
//             'idocs:performer?disp': 'Admin Adminov2',
//             'contracts:contractor?disp': 'ОАО ТЕСТ',
//             '.disp': 'Договор №1244',
//             'contracts:contractWith?disp': 'Заказчиком',
//             'idocs:note?disp': 'Тестовый договор',
//             'idocs:signatory?disp': 'Бухгалтер Горбункова',
//             'contracts:VAT?disp': '120000',
//             'contracts:agreementAmount?disp': '980000',
//             'nullableField?disp': null,
//             'booleanField?bool': false,
//             'booleanField2?bool': true,
//             'numericField?num': 125
//           }
//         }
//       ]
//     }),
//   }),
// ));

export const ActionResultTypes = {
  RESULTS: {
    type: 'results',
    data: { results: [] },
  },
  TRUE: true,
  FALSE: false,
  BAD_RESULT: [{ message: 'Бизнес-процесс не найден' }, { message: 'Бизнес-процесс не найден' }],
};

export const ActionResultFormation = {
  RESULTS: {
    input: ActionResultTypes.RESULTS,
    output: ActionResultTypes.RESULTS,
  },
  BOOL: {
    input: ActionResultTypes.TRUE,
    output: ActionResultTypes.TRUE,
  },
  ARRAY: {
    input: ActionResultTypes.BAD_RESULT,
    output: {
      type: 'results',
      data: { results: ActionResultTypes.BAD_RESULT },
    },
  },
};
