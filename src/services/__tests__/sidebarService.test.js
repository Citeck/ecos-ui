import { MenuSettings } from '../../constants/menu';
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
        title: `Menu v0 - style for type ${ATypes.CREATE_SITE} level-0`,
        input: { level: 0, item: { action: { type: ATypes.CREATE_SITE } } },
        output: { noIcon: true, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v0 - style for type ${ATypes.CREATE_SITE} level-1`,
        input: { level: 1, item: { action: { type: ATypes.CREATE_SITE } } },
        output: { noIcon: false, noBadge: true, isSeparator: false }
      },
      {
        title: `Menu v0 - style for type ${ATypes.JOURNAL_LINK} level-1`,
        input: { level: 1, item: { action: { type: ATypes.JOURNAL_LINK } } },
        output: { noIcon: false, noBadge: false, isSeparator: false }
      },
      {
        title: `Menu v0 - style for type ${ATypes.JOURNAL_LINK} level-2`,
        input: { level: 2, item: { action: { type: ATypes.JOURNAL_LINK } } },
        output: { noIcon: true, noBadge: false, isSeparator: false }
      },

      {
        title: `Menu v1 - style for type ${MITypes.SECTION} level-0`,
        input: { level: 0, item: { type: MITypes.SECTION } },
        output: { noIcon: true, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v1 - style for type ${MITypes.SECTION} level-1`,
        input: { level: 1, item: { type: MITypes.SECTION } },
        output: { noIcon: false, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v1 - style for type ${MITypes.HEADER_DIVIDER} level-1`,
        input: { level: 1, item: { type: MITypes.HEADER_DIVIDER } },
        output: { noIcon: true, noBadge: true, isSeparator: true }
      },
      {
        title: `Menu v1 - style for type ${MITypes.JOURNAL} level-0`,
        input: { level: 0, item: { type: MITypes.JOURNAL, config: { displayCount: true } } },
        output: { noIcon: true, noBadge: false, isSeparator: false }
      },
      {
        title: `Menu v1 - style for type ${MITypes.JOURNAL} level-1`,
        input: { level: 1, item: { type: MITypes.JOURNAL, config: { displayCount: false } } },
        output: { noIcon: false, noBadge: true, isSeparator: false }
      },
      {
        title: `Menu v1 - style for type ${MITypes.JOURNAL} level-1`,
        input: { level: 1, item: { type: MITypes.JOURNAL, config: { displayCount: true } } },
        output: { noIcon: false, noBadge: false, isSeparator: false }
      },
      {
        title: `Menu v1 - style for type ${MITypes.LINK_CREATE_CASE} level-2`,
        input: { level: 2, item: { type: MITypes.LINK_CREATE_CASE } },
        output: { noIcon: true, noBadge: true, isSeparator: false }
      }
    ];

    check(data, 'getPropsStyleLevel');
  });
});
