import MenuSettingsService from '../MenuSettingsService';
import { MenuTypes } from '../../constants/menu';
import { ITEMS_INPUT, ITEMS_OUTPUT, ACTIONS_BY_TYPE, PERMISSIONS_BY_TYPE } from '../__mocks__/menuSettingsService.mock';
import { MenuSettings as ms } from '../../constants/menu';

function check(data, method) {
  data.forEach(item => {
    it(item.title, () => {
      const result = MenuSettingsService[method](item.input);

      expect(result).toEqual(item.output);
    });
  });
}

describe('Menu Settings Service', () => {
  describe('Method getConfigKeyByType', () => {
    const data = [
      {
        title: `Config key for type ${MenuTypes.TOP} => top`,
        input: MenuTypes.TOP,
        output: 'top'
      },
      {
        title: `Config key for type ${MenuTypes.LEFT} => left`,
        input: MenuTypes.LEFT,
        output: 'left'
      },
      {
        title: `Config key for type ${MenuTypes.HIDDEN} => left`,
        input: MenuTypes.HIDDEN,
        output: 'left'
      },
      {
        title: `Config key for empty type => left`,
        input: undefined,
        output: 'left'
      }
    ];

    check(data, 'getConfigKeyByType');
  });

  describe('Method getItemParams', () => {
    const data = [
      {
        title: 'Item with icon (type img)',
        input: ITEMS_INPUT[0],
        output: ITEMS_OUTPUT[0]
      },
      {
        title: 'Item with icon (type icon)',
        input: ITEMS_INPUT[1],
        output: ITEMS_OUTPUT[1]
      },
      {
        title: 'Item without icon (divider item)',
        input: ITEMS_INPUT[2],
        output: ITEMS_OUTPUT[2]
      },
      {
        title: 'Item with default icon',
        input: ITEMS_INPUT[3],
        output: ITEMS_OUTPUT[3]
      }
    ];

    check(data, 'getItemParams');
  });

  describe('Method isChildless', () => {
    const data = [
      {
        title: 'Item childless (type !== SECTION)',
        input: ITEMS_INPUT[0],
        output: true
      },
      {
        title: 'Item not childless (type === SECTION)',
        input: ITEMS_INPUT[4],
        output: false
      }
    ];

    check(data, 'isChildless');
  });

  describe('Method getAvailableActions', () => {
    const data = [
      {
        title: `Item with 3 actions: edit, remove, toggle active (active) (type: ${ms.ItemTypes.SECTION})`,
        input: { type: ms.ItemTypes.SECTION },
        output: ACTIONS_BY_TYPE[ms.ItemTypes.SECTION]
      },
      {
        title: `Item with 2 actions: toggle active (active), remove (type: ${ms.ItemTypes.JOURNAL})`,
        input: { type: ms.ItemTypes.JOURNAL },
        output: ACTIONS_BY_TYPE[ms.ItemTypes.JOURNAL]
      },
      {
        title: `Item with 3 actions: edit, remove, toggle active (active) (type: ${ms.ItemTypes.ARBITRARY})`,
        input: { type: ms.ItemTypes.ARBITRARY },
        output: ACTIONS_BY_TYPE[ms.ItemTypes.ARBITRARY]
      },
      {
        title: `Item with 2 actions: remove, toggle active (inactive) (type: ${ms.ItemTypes.LINK_CREATE_CASE})`,
        input: { type: ms.ItemTypes.LINK_CREATE_CASE, hidden: true },
        output: ACTIONS_BY_TYPE[ms.ItemTypes.LINK_CREATE_CASE]
      },
      {
        title: `Item with 2 actions: remove, toggle active (inactive) (type: ${ms.ItemTypes.HEADER_DIVIDER})`,
        input: { type: ms.ItemTypes.HEADER_DIVIDER, hidden: true },
        output: ACTIONS_BY_TYPE[ms.ItemTypes.HEADER_DIVIDER]
      },
      {
        title: `Item with 2 actions: remove, toggle active (active) (type: without type)`,
        input: {},
        output: ACTIONS_BY_TYPE.EMPTY_TYPE
      }
    ];

    check(data, 'getAvailableActions');
  });

  describe('Method getActionPermissions', () => {
    const data = [
      {
        title: `Type ${ms.ItemTypes.SECTION} has all permissions`,
        input: { type: ms.ItemTypes.SECTION },
        output: PERMISSIONS_BY_TYPE[ms.ItemTypes.SECTION]
      },
      {
        title: `Type ${ms.ItemTypes.JOURNAL} has all permissions, except edit`,
        input: { type: ms.ItemTypes.JOURNAL },
        output: PERMISSIONS_BY_TYPE[ms.ItemTypes.JOURNAL]
      },
      {
        title: `Type ${ms.ItemTypes.ARBITRARY} has all permissions`,
        input: { type: ms.ItemTypes.ARBITRARY },
        output: PERMISSIONS_BY_TYPE[ms.ItemTypes.ARBITRARY]
      },
      {
        title: `Type ${ms.ItemTypes.LINK_CREATE_CASE} has all permissions, except edit`,
        input: { type: ms.ItemTypes.LINK_CREATE_CASE },
        output: PERMISSIONS_BY_TYPE[ms.ItemTypes.LINK_CREATE_CASE]
      },
      {
        title: `Type ${ms.ItemTypes.HEADER_DIVIDER} has all permissions, except edit and hasIcon`,
        input: { type: ms.ItemTypes.HEADER_DIVIDER },
        output: PERMISSIONS_BY_TYPE[ms.ItemTypes.HEADER_DIVIDER]
      }
    ];

    check(data, 'getActionPermissions');
  });
});
