import MenuSettingsService from '../MenuSettingsService';
import { MenuSettings as ms, MenuTypes } from '../../constants/menu';
import {
  ACTIONS,
  ACTIONS_BY_TYPE,
  ACTIONS_ON_MENU_ITEMS,
  AVAILABLE_CREATE_OPTIONS,
  CREATE_OPTIONS,
  ITEMS_INPUT,
  ITEMS_OUTPUT,
  PERMISSIONS_BY_TYPE
} from '../__mocks__/menuSettingsService.mock';

function check(data, method) {
  data.forEach(item => {
    it(item.title, () => {
      let result;

      if (typeof MenuSettingsService[method] === 'function') {
        result = MenuSettingsService[method](item.input, item.params);
      } else {
        result = MenuSettingsService[method];
      }

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

  describe('Method getActiveActions (default hidden = true)', () => {
    const data = [
      {
        title: `${ITEMS_INPUT[0].type} > hidden ${ITEMS_INPUT[0].hidden} > Available actions - 2`,
        input: ITEMS_INPUT[0],
        output: [ACTIONS.DELETE, ACTIONS.ACTIVE_ON]
      },
      {
        title: `${ITEMS_INPUT[5].type} > hidden ${ITEMS_INPUT[5].hidden} > Available actions - 3`,
        input: ITEMS_INPUT[5],
        output: [ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.ACTIVE_ON]
      },
      {
        title: `${ITEMS_INPUT[6].type} > hidden ${ITEMS_INPUT[6].hidden} > Available actions - 2`,
        input: ITEMS_INPUT[6],
        output: [ACTIONS.DELETE, ACTIONS.ACTIVE_ON]
      },
      {
        title: `${ITEMS_INPUT[7].type} > hidden ${ITEMS_INPUT[7].hidden} > Available actions - 1`,
        input: ITEMS_INPUT[7],
        output: [ACTIONS.ACTIVE_OFF]
      }
    ];

    check(data, 'getActiveActions');
  });

  describe('Method processAction', () => {
    const data = [
      {
        title: 'Create new item',
        input: ACTIONS_ON_MENU_ITEMS.CREATE[0],
        output: ACTIONS_ON_MENU_ITEMS.CREATE[1]
      },
      {
        title: 'Delete item',
        input: ACTIONS_ON_MENU_ITEMS.DELETE[0],
        output: ACTIONS_ON_MENU_ITEMS.DELETE[1]
      },
      {
        title: 'Toggle display count',
        input: ACTIONS_ON_MENU_ITEMS.DISPLAY_COUNT[0],
        output: ACTIONS_ON_MENU_ITEMS.DISPLAY_COUNT[1]
      },
      {
        title: 'Edit item',
        input: ACTIONS_ON_MENU_ITEMS.EDIT[0],
        output: ACTIONS_ON_MENU_ITEMS.EDIT[1]
      },
      {
        title: 'Toggle active item (off)',
        input: ACTIONS_ON_MENU_ITEMS.ACTIVE_OFF[0],
        output: ACTIONS_ON_MENU_ITEMS.ACTIVE_OFF[1]
      },
      {
        title: 'Toggle active item (on)',
        input: ACTIONS_ON_MENU_ITEMS.ACTIVE_ON[0],
        output: ACTIONS_ON_MENU_ITEMS.ACTIVE_ON[1]
      }
    ];

    check(data, 'processAction');
  });

  describe('Property createOptions', () => {
    const data = [
      {
        title: `Create options: ${CREATE_OPTIONS.length} items`,
        input: null,
        output: CREATE_OPTIONS
      }
    ];

    check(data, 'createOptions');
  });

  describe('Method getAvailableCreateOptions', () => {
    const data = AVAILABLE_CREATE_OPTIONS.map(([input, params, output]) => {
      const title = `Type: ${input && input.type} Level:  ${params && params.level} Available create options count: ${output.length}`;
      return { title, input, params, output };
    });

    check(data, 'getAvailableCreateOptions');
  });
});
