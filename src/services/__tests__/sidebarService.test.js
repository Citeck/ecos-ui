import { URL } from '../../constants';
import { MenuSettings } from '../../constants/menu';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../constants/pageTabs';
import { itemsForPropsUrl } from '../../helpers/__mocks__/menu.mock';
import SidebarService from '../sidebar';

const ATypes = SidebarService.ActionTypes;
const MITypes = MenuSettings.ItemTypes;

function check(data, method) {
  data.forEach(item => {
    it(item.title, () => {
      let result;

      if (typeof SidebarService[method] === 'function') {
        result = SidebarService[method](item.input);
      } else {
        result = SidebarService[method];
      }

      expect(result).toEqual(item.output);
    });
  });
}

describe('Sidebar Service', () => {
  describe('Method getPropsStyleLevel', () => {
    const data = [
      {
        title: `Menu v0 - appearance for type ${ATypes.CREATE_SITE} level-0`,
        input: { level: 0, item: { action: { type: ATypes.CREATE_SITE } } },
        output: { noIcon: true, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v0 - appearance for type ${ATypes.CREATE_SITE} level-1`,
        input: { level: 1, item: { action: { type: ATypes.CREATE_SITE } } },
        output: { noIcon: false, noBadge: true, isSeparator: false }
      },
      {
        title: `Menu v0 - appearance for type ${ATypes.JOURNAL_LINK} level-1`,
        input: { level: 1, item: { action: { type: ATypes.JOURNAL_LINK } } },
        output: { noIcon: false, noBadge: false, isSeparator: false }
      },
      {
        title: `Menu v0 - appearance for type ${ATypes.JOURNAL_LINK} level-2`,
        input: { level: 2, item: { action: { type: ATypes.JOURNAL_LINK } } },
        output: { noIcon: true, noBadge: false, isSeparator: false }
      },
      //**************
      {
        title: `Menu v1 - appearance for type ${MITypes.SECTION} level-0`,
        input: { level: 0, item: { type: MITypes.SECTION } },
        output: { noIcon: true, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.SECTION} level-1`,
        input: { level: 1, item: { type: MITypes.SECTION } },
        output: { noIcon: false, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.HEADER_DIVIDER} level-1`,
        input: { level: 1, item: { type: MITypes.HEADER_DIVIDER } },
        output: { noIcon: true, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.JOURNAL} level-0`,
        input: { level: 0, item: { type: MITypes.JOURNAL, config: { displayCount: true } } },
        output: { noIcon: true, noBadge: false, isSeparator: false }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.JOURNAL} level-1`,
        input: { level: 1, item: { type: MITypes.JOURNAL, config: { displayCount: false } } },
        output: { noIcon: false, noBadge: true, isSeparator: false }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.JOURNAL} level-1`,
        input: { level: 1, item: { type: MITypes.JOURNAL, config: { displayCount: true } } },
        output: { noIcon: false, noBadge: false, isSeparator: false }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.LINK_CREATE_CASE} level-2`,
        input: { level: 2, item: { type: MITypes.LINK_CREATE_CASE } },
        output: { noIcon: true, noBadge: true, isSeparator: false }
      }
    ];

    check(data, 'getPropsStyleLevel');
  });

  describe('Method getPropsUrl', () => {
    const attributes = { rel: 'noopener noreferrer' };
    const _ = itemsForPropsUrl;
    const data = [
      {
        title: `Menu v0 - url for 'bpmn-designer'`,
        input: _.BPMN_DESIGNER,
        output: { targetUrl: `${URL.BPMN_DESIGNER}`, attributes }
      },
      {
        title: `Menu v0 - url for ${ATypes.PAGE_LINK}`,
        input: _.PAGE_LINK,
        output: {
          targetUrl: `/share/page/${_.PAGE_LINK.action.params.pageId}`,
          attributes: { [IGNORE_TABS_HANDLER_ATTR_NAME]: true }
        }
      },
      //**************
      {
        title: `Menu v1 - url for ${MITypes.JOURNAL}`,
        input: _.JOURNAL,
        output: {
          targetUrl: `${URL.JOURNAL}?journalId=${_.JOURNAL.params.journalId}&journalsListId=${_.JOURNAL.params.journalsListId}`,
          attributes: {}
        }
      },
      {
        title: `Menu v1 - url for ${MITypes.ARBITRARY} _blank`,
        input: _.ARBITRARY_BLANK,
        output: {
          targetUrl: `${_.ARBITRARY_BLANK.config.url}`,
          attributes: { ...attributes, target: '_blank', [IGNORE_TABS_HANDLER_ATTR_NAME]: true }
        }
      },
      {
        title: `Menu v1 - url for ${MITypes.ARBITRARY} _self`,
        input: _.ARBITRARY_SELF,
        output: {
          targetUrl: `${_.ARBITRARY_SELF.config.url}`,
          attributes: {}
        }
      }
    ];

    check(data, 'getPropsUrl');
  });
});
