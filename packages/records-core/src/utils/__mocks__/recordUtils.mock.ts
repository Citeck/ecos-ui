import { configure } from '../../config';

const CANNED = {
  ok: true,
  status: 200,
  statusText: 'OK',
  json: () =>
    Promise.resolve({
      records: [
        {
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
            'contracts:agreementAmount?disp': '980000',
            'nullableField?disp': null,
            'booleanField?bool': false,
            'booleanField2?bool': true,
            'numericField?num': 125
          }
        }
      ]
    })
};

// Configure the core with test adapters: canned HTTP, identity i18n, and a
// workspace whose current record ref is read from the (jsdom) URL.
configure({
  http: () => Promise.resolve(CANNED),
  i18n: { t: key => key },
  workspace: {
    getWorkspaceId: () => '',
    getEnabledWorkspaces: () => false,
    getCurrentRecordRef: () => {
      const href = (typeof window !== 'undefined' && window.location && window.location.href) || '';
      const m = href.match(/[?&]recordRef=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : undefined;
    }
  }
});
