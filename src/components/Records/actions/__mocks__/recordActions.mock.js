jest.spyOn(global, 'fetch').mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        id: 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
        attributes: {
          'contracts:agreementCurrency?disp': 'Рубль',
          'cm:name?disp': 'Договор №1244 (1).txt',
          'idocs:performer?disp': 'Admin Adminov2',
          'contracts:contractor?disp': 'ОАО ТЕСТ',
          '.disp': 'Договор №1244',
          'contracts:contractWith?disp': 'Заказчиком',
          'idocs:note?disp': 'Тестовый договор',
          'idocs:signatory?disp': 'Бухгалтер Горбункова',
          'contracts:VAT?disp': '120000',
          'contracts:agreementAmount?disp': '980000'
        }
      })
  });
});
