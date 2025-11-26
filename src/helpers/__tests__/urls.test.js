import cloneDeep from 'lodash/cloneDeep';

import { history } from '../__mocks__/urls.mock';
import * as UrlUtils from '../urls';

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
      beforeEach(() => {
        delete window.history;
        window.history = replaceHistory;
      });

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
      beforeEach(() => {
        delete window.history;
        window.history = pushHistory;
      });

      it(item.title, () => {
        UrlUtils.pushHistoryLink(...item.input);

        expect(item.input[0].history[item.input[0].history.length - 1]).toEqual(item.output);
      });
    });
  });

  describe.each([
    ['/v2/journals', false],
    ['/v2/dashboard', true],
    ['/v2/dashboard/settings', false]
  ])('fun isDashboard %s', (url, expected) => {
    beforeEach(() => {
      delete window.location;
      window.location = { pathname: url };
    });

    it(`returns ${expected}`, () => {
      expect(UrlUtils.isDashboard(url)).toEqual(expected);
    });
  });

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

  describe('Method getUrlWithWorkspace', () => {
    const url = new URL(
      'https://example.com/v2/dashboard?activeTab=0&recordRef=emodel/sd-request-type@28ad7478-b848-40cc-8056-afaa512daf0a'
    );
    const wsId = 'example-default';

    const data = [
      {
        title: 'Add a workspace ID for a direct link',
        input: [url.pathname, url.search, wsId],
        output: `/v2/dashboard?activeTab=0&recordRef=emodel/sd-request-type@28ad7478-b848-40cc-8056-afaa512daf0a&ws=${wsId}`
      },
      {
        title: 'Do not add a workspace identifier if it is not defined',
        input: [url.pathname, url.search],
        output: `/v2/dashboard?activeTab=0&recordRef=emodel/sd-request-type@28ad7478-b848-40cc-8056-afaa512daf0a`
      },
      {
        title: 'Pass empty parameters',
        input: [url.pathname, '', wsId],
        output: `/v2/dashboard?ws=${wsId}` // It should return a link without parameters, even if there is a search in the current location
      },
      {
        title: 'Pass undefined parameters',
        input: [url.pathname, undefined, wsId],
        output: `/v2/dashboard?example-params=test&ws=${wsId}` // The method should return a link with the parameters that are in the current location
      }
    ];

    data.forEach(item => {
      beforeEach(() => {
        delete window.location;
        window.location = { pathname: url.pathname };
        window.location.search = '?example-params=test';
      });

      it(item.title, () => {
        expect(UrlUtils.getUrlWithWorkspace(...item.input)).toEqual(item.output);
      });
    });
  });

  describe('Method getLinkWithWs', () => {
    const location = {
      origin: 'https://example.com/'
    };

    const data = [
      {
        title: 'Attempt to add an empty workspace',
        input: ['/v2/journal?journalId=example123', ''],
        output: `/v2/journal?journalId=example123`
      },
      {
        title: 'An attempt to add an empty workspace with a space',
        input: ['/v2/journal?journalId=example123', ' '],
        output: `/v2/journal?journalId=example123`
      },
      {
        title: 'Add a workspace to the link with the parameter',
        input: ['/v2/journal?journalId=example123', 'example-default'],
        output: `/v2/journal?journalId=example123&ws=example-default`
      },
      {
        title: 'Add a workspace to the full link without the parameter',
        input: ['https://example.com/v2/journal?journalId=example123', 'example-default'],
        output: `/v2/journal?journalId=example123&ws=example-default`
      },
      {
        title: 'Add a workspace with a special symbol to the link',
        input: ['/v2/journal?journalId=test&activeTab=true', 'user$test-user'],
        output: `/v2/journal?journalId=test&activeTab=true&ws=user$test-user`
      },
      {
        title: 'Add a workspace with a special character and the full url to the link',
        input: ['/v2/journal?journalId=test&activeTab=true', 'user$test-user', true],
        output: `${location.origin}v2/journal?journalId=test&activeTab=true&ws=user$test-user`
      }
    ];

    data.forEach(item => {
      beforeEach(() => {
        delete window.location;
        window.location = location;
      });

      it(item.title, () => {
        expect(UrlUtils.getLinkWithWs(...item.input)).toEqual(item.output);
      });
    });
  });
});
