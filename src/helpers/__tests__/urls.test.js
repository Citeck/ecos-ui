import cloneDeep from 'lodash/cloneDeep';

import * as UrlUtils from '../urls';
import { history } from '../__mocks__/urls.mock';

describe('Urls helpers', () => {
  describe('Method replaceHistoryLink', () => {
    const replaceHistory = cloneDeep(history);
    const data = [
      {
        title: 'First link came',
        input: [replaceHistory, '/v2/dashboard?recordRef=people@admin'],
        output: '/v2/dashboard?recordRef=people@admin'
      },
      {
        title: 'Empty new link - site root path link will be added',
        input: [replaceHistory, ''],
        output: '/'
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        UrlUtils.replaceHistoryLink(...item.input);

        expect(item.input[0].history[item.input[0].history.length - 1]).toEqual(item.output);
      });
    });
  });

  describe('Method pushHistoryLink', () => {
    const pushHistory = cloneDeep(history);
    const data = [
      {
        title: 'Add new link',
        input: [pushHistory, { pathname: '/v2/dashboard', search: 'recordRef=people@admin' }],
        output: '/v2/dashboard?recordRef=people@admin'
      },
      {
        title: 'Empty new link data - adding did not happen',
        input: [pushHistory],
        output: '/v2/dashboard?recordRef=people@admin'
      },
      {
        title: 'New link without search params',
        input: [pushHistory, { pathname: '/v2/settings/dashboard' }],
        output: '/v2/settings/dashboard'
      },
      {
        title: 'New link with only search params',
        input: [pushHistory, { search: 'activeLayoutId=layout_799ac5e5-9eab-4c08-af80-5ed48d768229' }],
        output: '/v2/settings/dashboard?activeLayoutId=layout_799ac5e5-9eab-4c08-af80-5ed48d768229'
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        UrlUtils.pushHistoryLink(...item.input);

        expect(item.input[0].history[item.input[0].history.length - 1]).toEqual(item.output);
      });
    });
  });

  describe.each([['/v2/journals', false], ['/v2/dashboard', true], ['/v2/dashboard/settings', false], ['/share/page', false]])(
    'fun isDashboard %s',
    (url, expected) => {
      beforeEach(() => {
        delete window.location;
        window.location = { pathname: url };
      });

      it(`returns ${expected}`, () => {
        expect(UrlUtils.isDashboard(url)).toEqual(expected);
      });
    }
  );

  describe('Method isHomePage', () => {
    const data = [
      {
        title: 'Dashboard link (without query attributes)',
        input: '/v2/dashboard',
        output: true
      },
      {
        title: 'Dashboard link (with query attributes, but without recordRef)',
        input: '/v2/dashboard?activeLayoutId=layout_bb6e6685-f802-4680-8606-007a42a8c1bd',
        output: true
      },
      {
        title: 'Dashboard link (with query attributes, including recordRef)',
        input: '/v2/dashboard?recordRef=workspace://SpacesStore/2407ae6f-75ad-4413-81b4-a96dcbe9b303',
        output: false
      },
      {
        title: 'Not Dashboard link',
        input: '/v2/debug/formio-develop',
        output: false
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        expect(UrlUtils.isHomePage(item.input)).toEqual(item.output);
      });
    });
  });

  describe('Method removeUrlSearchParams', () => {
    const defaultUrl =
      '/v2/journals?journalId=contract-agreements&journalSettingId=31aea70b-60b1-4fc8-9614-f5ce887b4e3e&journalsListId=contractor-documents&userConfigId=';
    const data = [
      {
        title: 'Empty remove params',
        input: [defaultUrl],
        output: defaultUrl
      },
      {
        title: 'The parameter to be removed is a string',
        input: [defaultUrl, 'journalsListId'],
        output: '/v2/journals?journalId=contract-agreements&journalSettingId=31aea70b-60b1-4fc8-9614-f5ce887b4e3e&userConfigId='
      },
      {
        title: 'The parameter being removed is an array of strings',
        input: [defaultUrl, ['journalSettingId', 'journalsListId', 'journalId']],
        output: '/v2/journals?userConfigId='
      }
    ];

    data.forEach(item => {
      it(item.title, () => {
        expect(UrlUtils.removeUrlSearchParams(...item.input)).toEqual(item.output);
      });
    });
  });
});
