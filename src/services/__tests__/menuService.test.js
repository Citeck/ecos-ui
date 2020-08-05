import { expectSaga } from 'redux-saga-test-plan';

import MenuService from '../MenuService';
import { LINKS_BY_CONFIG } from '../__mocks__/menuService.mock';

describe('Menu Service', () => {
  describe('Method getSiteMenuLink', () => {
    global.window = Object.create(window);

    Object.defineProperty(window, 'location', {
      value: {
        search: '?recordRef=workspace://SpacesStore/f43fb8cc-d700-4a1b-9f6d-1a18beb069df'
      },
      writable: true
    });

    const data = [
      {
        title: 'Dashboard settings page link',
        input: LINKS_BY_CONFIG[0][0],
        output: LINKS_BY_CONFIG[0][1]
      },
      {
        title: 'BPMN Designer link',
        input: LINKS_BY_CONFIG[1][0],
        output: LINKS_BY_CONFIG[1][1]
      }
    ];
    const storeState = {
      dashboard: {
        null: {
          identification: {
            id: 'user-base-type-dashboard',
            key: 'emodel/type@user-base',
            type: 'case-details',
            user: null
          }
        }
      }
    };

    data.forEach(item => {
      it(item.title, async () => {
        const { returnValue } = await expectSaga(MenuService.getSiteMenuLink, item.input)
          .withState(storeState)
          .run();

        expect(returnValue).toEqual(item.output);
      });
    });
  });
});
