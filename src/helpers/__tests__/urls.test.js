import cloneDeep from 'lodash/cloneDeep';

import { replaceHistoryLink, pushHistoryLink } from '../urls';
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
        replaceHistoryLink(...item.input);

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
        pushHistoryLink(...item.input);

        expect(item.input[0].history[item.input[0].history.length - 1]).toEqual(item.output);
      });
    });
  });
});
