import {
  makeUserMenuItems,
  processMenuItemsFromOldMenu,
  makeSiteMenu,
  getIconClassMenu,
  getSpecialClassByState,
  getMenuWidth,
  getPositionAdjustment
} from '../menu';
import {
  iconsByMenuId,
  makeSiteMenuFromConfig,
  makeUserMenuConfigs,
  menuWidth,
  menuWidthBySelector,
  oldToNewMenu,
  positionAdjustmentsByType,
  specialClassByState
} from '../__mocks__/menu.mock';
import { NEW_VERSION_PREFIX } from '../export/urls';

function check(data, method, manyProperties = false) {
  data.forEach(item => {
    it(item.title, () => {
      let result;

      if (typeof method === 'function') {
        if (manyProperties) {
          result = method(...item.input);
        } else {
          result = method(item.input);
        }
      } else {
        result = method;
      }

      expect(result).toEqual(item.output);
    });
  });
}

function asyncCheck(data, method, manyProperties = false) {
  data.forEach(async item => {
    it(item.title, async () => {
      let result;

      if (typeof method === 'function') {
        if (manyProperties) {
          result = await method(...item.input);
        } else {
          result = await method(item.input);
        }
      } else {
        result = await method;
      }

      expect(result).toEqual(item.output);
    });
  });
}

describe('Menu helpers', () => {
  describe('Method makeUserMenuItems (async)', () => {
    const data = [
      {
        title: 'User menu with logout link (5 items, user - admin)',
        input: makeUserMenuConfigs[0][0],
        output: makeUserMenuConfigs[0][1]
      },
      {
        title: 'User menu without logout link (4 items, user - test-user)',
        input: makeUserMenuConfigs[1][0],
        output: makeUserMenuConfigs[1][1]
      }
    ];

    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        pathname: `${NEW_VERSION_PREFIX}/test-page`
      },
      writable: true
    });

    jest.spyOn(global, 'fetch').mockImplementation(url => {
      let link = '';

      switch (true) {
        case url.includes('custom-feedback-url'):
          link = 'https://www.citeck.ru/feedback';
          break;
        case url.includes('custom-report-issue-url'):
          link =
            'mailto:support@citeck.ru?subject=Ошибка в работе Citeck ECOS: краткое описание&body=Summary: Короткое описание проблемы (продублировать в теме письма)%0A%0ADescription:%0AПожалуйста, детально опишите возникшую проблему, последовательность действий, которая привела к ней. При необходимости приложите скриншоты.';
          break;
        default:
          link = '';
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(link)
      });
    });

    asyncCheck(data, makeUserMenuItems, true);
  });

  describe('Method processMenuItemsFromOldMenu', () => {
    const data = [
      {
        title: 'Empty old menu => empty processed items',
        input: oldToNewMenu[0][0],
        output: oldToNewMenu[0][1]
      },
      {
        title: '2 items old menu => 2 processed items',
        input: oldToNewMenu[1][0],
        output: oldToNewMenu[1][1]
      }
    ];

    check(data, processMenuItemsFromOldMenu);
  });

  describe('Method makeSiteMenu', () => {
    const data = [
      {
        title: 'Empty params => empty menu',
        input: makeSiteMenuFromConfig[0][0],
        output: makeSiteMenuFromConfig[0][1]
      },
      {
        title: '2 menu items with administrator rights: \n - menu settings, \n - bpmn-designer',
        input: makeSiteMenuFromConfig[1][0],
        output: makeSiteMenuFromConfig[1][1]
      },
      {
        title: '1 menu item on Dashboard page without administrator rights: \n - dashboard settings',
        input: makeSiteMenuFromConfig[2][0],
        output: makeSiteMenuFromConfig[2][1]
      },
      {
        title: '3 menu items on Dashboard page with administrator rights: \n - dashboard settings, \n - menu settings, \n - bpmn-designer',
        input: makeSiteMenuFromConfig[3][0],
        output: makeSiteMenuFromConfig[3][1]
      }
    ];

    check(data, makeSiteMenu);
  });

  describe('Method getIconClassMenu', () => {
    const data = [
      {
        title: 'Without id => ""',
        input: [],
        output: ''
      },
      {
        title: `HEADER_USER_MENU_AVAILABILITY (without special class) => ${iconsByMenuId.HEADER_USER_MENU_AVAILABILITY}`,
        input: ['HEADER_USER_MENU_AVAILABILITY'],
        output: iconsByMenuId.HEADER_USER_MENU_AVAILABILITY
      },
      {
        title: `HEADER_USER_MENU_AVAILABILITY (with special class) => "${
          iconsByMenuId['HEADER_USER_MENU_AVAILABILITY (with special class)']
        }"`,
        input: ['HEADER_USER_MENU_AVAILABILITY', iconsByMenuId['HEADER_USER_MENU_AVAILABILITY (with special class)']],
        output: iconsByMenuId['HEADER_USER_MENU_AVAILABILITY (with special class)']
      },
      {
        title: `HEADER_USER_MENU_FEEDBACK => "${iconsByMenuId.HEADER_USER_MENU_FEEDBACK}"`,
        input: ['HEADER_USER_MENU_FEEDBACK'],
        output: iconsByMenuId.HEADER_USER_MENU_FEEDBACK
      },
      {
        title: `HEADER_USER_MENU_REPORTISSUE => "${iconsByMenuId.HEADER_USER_MENU_REPORTISSUE}"`,
        input: ['HEADER_USER_MENU_REPORTISSUE'],
        output: iconsByMenuId.HEADER_USER_MENU_REPORTISSUE
      },
      {
        title: `HEADER_USER_MENU_LOGOUT => "${iconsByMenuId.HEADER_USER_MENU_LOGOUT}"`,
        input: ['HEADER_USER_MENU_LOGOUT'],
        output: iconsByMenuId.HEADER_USER_MENU_LOGOUT
      },
      {
        title: `HEADER_SITE_INVITE => "${iconsByMenuId.HEADER_SITE_INVITE}"`,
        input: ['HEADER_SITE_INVITE'],
        output: iconsByMenuId.HEADER_SITE_INVITE
      },
      {
        title: `HEADER_SITE_INVITE (with special class "icon-invite") => "${iconsByMenuId.HEADER_SITE_INVITE}"`,
        input: ['HEADER_SITE_INVITE', 'icon-invite'],
        output: iconsByMenuId.HEADER_SITE_INVITE
      },
      {
        title: `HEADER_CUSTOMIZE_SITE_DASHBOARD => "${iconsByMenuId.HEADER_CUSTOMIZE_SITE_DASHBOARD}"`,
        input: ['HEADER_CUSTOMIZE_SITE_DASHBOARD'],
        output: iconsByMenuId.HEADER_CUSTOMIZE_SITE_DASHBOARD
      },
      {
        title: `HEADER_EDIT_SITE_DETAILS => "${iconsByMenuId.HEADER_EDIT_SITE_DETAILS}"`,
        input: ['HEADER_EDIT_SITE_DETAILS'],
        output: iconsByMenuId.HEADER_EDIT_SITE_DETAILS
      },
      {
        title: `HEADER_CUSTOMIZE_SITE => "${iconsByMenuId.HEADER_CUSTOMIZE_SITE}"`,
        input: ['HEADER_CUSTOMIZE_SITE'],
        output: iconsByMenuId.HEADER_CUSTOMIZE_SITE
      },
      {
        title: `HEADER_LEAVE_SITE => "${iconsByMenuId.HEADER_LEAVE_SITE}"`,
        input: ['HEADER_LEAVE_SITE'],
        output: iconsByMenuId.HEADER_LEAVE_SITE
      },
      {
        title: `HEADER_SITE_JOURNALS => "${iconsByMenuId.HEADER_SITE_JOURNALS}"`,
        input: ['HEADER_SITE_JOURNALS'],
        output: iconsByMenuId.HEADER_SITE_JOURNALS
      },
      {
        title: `non-existent id => "${iconsByMenuId['non-existent-id']}"`,
        input: ['non-existent-id'],
        output: iconsByMenuId['non-existent-id']
      }
    ];

    check(data, getIconClassMenu, true);
  });

  describe('Method getSpecialClassByState', () => {
    const data = [
      {
        title: `${specialClassByState[0][0][0]} without params => ${specialClassByState[0][1]}`,
        input: specialClassByState[0][0],
        output: specialClassByState[0][1]
      },
      {
        title: `${specialClassByState[1][0][0]} with params ${JSON.stringify(specialClassByState[1][0][1])} => ${
          specialClassByState[1][1]
        }`,
        input: specialClassByState[1][0],
        output: specialClassByState[1][1]
      },
      {
        title: `${specialClassByState[2][0][0]} with params ${JSON.stringify(specialClassByState[2][0][1])} => ${
          specialClassByState[2][1]
        }`,
        input: specialClassByState[2][0],
        output: specialClassByState[2][1]
      },
      {
        title: `${specialClassByState[3][0][0]} with params ${JSON.stringify(specialClassByState[3][0][1])} => ${
          specialClassByState[3][1]
        }`,
        input: specialClassByState[3][0],
        output: specialClassByState[3][1]
      },
      {
        title: `${specialClassByState[4][0][0]} with params ${JSON.stringify(specialClassByState[4][0][1])} => ${
          specialClassByState[4][1]
        }`,
        input: specialClassByState[4][0],
        output: specialClassByState[4][1]
      },
      {
        title: `${specialClassByState[5][0][0]} without params => ${specialClassByState[5][1]}`,
        input: specialClassByState[5][0],
        output: specialClassByState[5][1]
      }
    ];

    check(data, getSpecialClassByState, true);
  });

  describe('Method getMenuWidth', () => {
    const data = [
      {
        title: `Menu selector ${menuWidthBySelector[0][0]} width => ${menuWidthBySelector[0][1]}`,
        input: menuWidthBySelector[0][0],
        output: menuWidthBySelector[0][1]
      },
      {
        title: `Menu selector ${menuWidthBySelector[1][0]} width => ${menuWidthBySelector[1][1]}`,
        input: menuWidthBySelector[1][0],
        output: menuWidthBySelector[1][1]
      },
      {
        title: `Menu selector ${menuWidthBySelector[2][0]} width => ${menuWidthBySelector[2][1]}`,
        input: menuWidthBySelector[2][0],
        output: menuWidthBySelector[2][1]
      },
      {
        title: `Menu selector ${menuWidthBySelector[3][0]} (no such element) width => ${menuWidthBySelector[3][1]}`,
        input: menuWidthBySelector[3][0],
        output: menuWidthBySelector[3][1]
      }
    ];

    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div class="slide-menu-1" style="width: 300px; height: 20px"></div>
      <div class="slide-menu-2" style="width: 22px; height: 20px"></div>
      <div class="slide-menu-3"></div>
    `
    );

    const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

    data.forEach((item, index) => {
      it(item.title, () => {
        Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
          configurable: true,
          value: menuWidth[index]
        });

        const result = getMenuWidth(item.input);

        Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
          ...originalClientWidth,
          configurable: true
        });

        expect(result).toEqual(item.output);
      });
    });
  });

  describe('Method getPositionAdjustment', () => {
    const data = positionAdjustmentsByType.map(item => ({
      title: `Position adjustment 
            - menu type: ${item[0]}, 
            - scrollTop: ${item[1].top}, 
            - menu width ${item[1].left},
            - result ${JSON.stringify(item[2])}`,
      input: item[0],
      output: item[2]
    }));

    const originalScrollingElement = Object.getOwnPropertyDescriptor(Document.prototype, 'scrollingElement');
    const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

    document.body.insertAdjacentHTML('beforeend', '<div class="slide-menu" style="width: 300px;"></div>');

    data.forEach((item, index) => {
      it(item.title, () => {
        Object.defineProperty(Document.prototype, 'scrollingElement', {
          configurable: true,
          value: { scrollTop: positionAdjustmentsByType[index][1].top }
        });
        Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
          configurable: true,
          value: positionAdjustmentsByType[index][1].left
        });

        const result = getPositionAdjustment(item.input);

        Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
          ...originalClientWidth,
          configurable: true
        });
        Object.defineProperty(Document.prototype, 'scrollingElement', {
          ...originalScrollingElement,
          configurable: true
        });

        expect(result).toEqual(item.output);
      });
    });
  });
});
