import { URL } from '../../constants';
import { MenuSettings } from '../../constants/menu';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../constants/pageTabs';
import { itemsForPropsUrl } from '../../helpers/__mocks__/menu.mock';
import SidebarService from '../sidebar';
import { ActionTypes } from '../../constants/sidebar';

const ATypes = ActionTypes;
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
        output: { noIcon: true, noBadge: true, isSeparator: false, isClosedSeparator: true }
      },
      {
        title: `Menu v0 - appearance for type ${ATypes.CREATE_SITE} level-1`,
        input: { level: 1, item: { action: { type: ATypes.CREATE_SITE } } },
        output: { noIcon: false, noBadge: true, isSeparator: false, isClosedSeparator: false }
      },
      {
        title: `Menu v0 - appearance for type ${ATypes.JOURNAL_LINK} level-2`,
        input: { level: 2, item: { action: { type: ATypes.JOURNAL_LINK } } },
        output: { noIcon: true, noBadge: true, isSeparator: false, isClosedSeparator: false }
      },
      {
        title: `Menu v0 - appearance for type ${ATypes.JOURNAL_LINK} journalId: 'active-tasks'`,
        input: { level: 1, item: { action: { type: ATypes.JOURNAL_LINK }, params: { journalId: 'active-tasks' } } },
        output: { noIcon: false, noBadge: false, isSeparator: false, isClosedSeparator: false }
      },
      {
        title: `Menu v0 - appearance for type ${ATypes.JOURNAL_LINK} journalId: ''`,
        input: { level: 1, item: { action: { type: ATypes.JOURNAL_LINK }, params: { journalId: '' } } },
        output: { noIcon: false, noBadge: true, isSeparator: false, isClosedSeparator: false }
      },
      //**************
      {
        title: `Menu v1 - appearance for type ${MITypes.SECTION} level-0`,
        input: { level: 0, item: { type: MITypes.SECTION } },
        output: { noIcon: true, noBadge: true, isSeparator: false, isClosedSeparator: true }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.SECTION} level-1`,
        input: { level: 1, item: { type: MITypes.SECTION } },
        output: { noIcon: false, noBadge: true, isSeparator: false, isClosedSeparator: false }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.HEADER_DIVIDER} level-1`,
        input: { level: 1, item: { type: MITypes.HEADER_DIVIDER } },
        output: { noIcon: true, noBadge: true, isSeparator: true, isClosedSeparator: true }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.JOURNAL} level-0`,
        input: { level: 0, item: { type: MITypes.JOURNAL, config: { displayCount: true } } },
        output: { noIcon: true, noBadge: false, isSeparator: false, isClosedSeparator: false }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.JOURNAL} level-1`,
        input: { level: 1, item: { type: MITypes.JOURNAL, config: { displayCount: false } } },
        output: { noIcon: false, noBadge: true, isSeparator: false, isClosedSeparator: false }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.JOURNAL} level-1`,
        input: { level: 1, item: { type: MITypes.JOURNAL, config: { displayCount: true } } },
        output: { noIcon: false, noBadge: false, isSeparator: false, isClosedSeparator: false }
      },
      {
        title: `Menu v1 - appearance for type ${MITypes.LINK_CREATE_CASE} level-2`,
        input: { level: 2, item: { type: MITypes.LINK_CREATE_CASE } },
        output: { noIcon: true, noBadge: true, isSeparator: false, isClosedSeparator: false }
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
      //**************
      {
        title: `Menu v1 - url for ${MITypes.JOURNAL}`,
        input: _.JOURNAL,
        output: {
          targetUrl: `${URL.JOURNAL}?journalId=${_.JOURNAL.params.journalId}`,
          attributes: {}
        }
      },
      {
        title: `Menu v1 - url for ${MITypes.JOURNAL} no data`,
        input: _.JOURNAL_NONE,
        output: {
          targetUrl: null,
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
      },
      {
        title: `Menu v1 - url for ${MITypes.ARBITRARY} no data`,
        input: _.ARBITRARY_NONE,
        output: {
          targetUrl: null,
          attributes: {}
        }
      },
      {
        title: `Menu v1 - url for ${MITypes.LINK_CREATE_CASE}`,
        input: _.LINK_CREATE_CASE,
        output: {
          targetUrl: null,
          attributes: { [IGNORE_TABS_HANDLER_ATTR_NAME]: true }
        }
      },
      {
        title: `Menu v1 - url for ${MITypes.SECTION}`,
        input: _.SECTION,
        output: {
          targetUrl: null,
          attributes: { [IGNORE_TABS_HANDLER_ATTR_NAME]: true }
        }
      },
      {
        title: `Menu v1 - url for ${MITypes.HEADER_DIVIDER}`,
        input: _.HEADER_DIVIDER,
        output: {
          targetUrl: null,
          attributes: { [IGNORE_TABS_HANDLER_ATTR_NAME]: true }
        }
      }
    ];

    check(data, 'getPropsUrl');
  });

  describe('Method getSelectedId', () => {
    const items = [
      {
        id: '16457ea7-d2b0-4a51-b993-903198210878',
        type: 'SECTION',
        config: {},
        action: {
          type: '',
          config: {}
        },
        items: [
          {
            id: 'cc02d5ac-e511-4b06-9dc6-73273fa0a801',
            type: 'ARBITRARY',
            config: {
              url: '/v2/dashboard'
            }
          },
          {
            id: 'tttcc02d5ac-e511-4b06-9dc6-73273fa0a801',
            type: 'ARBITRARY',
            config: {
              url: '/v2/dashboard?recordRef=alfresco/@workspace://SpacesStore/ceb274df-4718-4683-ac4f-801daca655c0'
            }
          },
          {
            id: '9305e85e-6184-4c28-a0c0-a2ec9854d2a1',
            type: 'SECTION',
            config: {},
            items: [
              {
                id: '3333339305e85e-6184-4c28-a0c0-a2ec9854d2a1',
                type: 'SECTION',
                config: {},
                items: [
                  {
                    id: '88be206d-2cd8-4fd8-bcd0-ab4f6b1a6c23',
                    label: {},
                    icon: '',
                    hidden: false,
                    type: 'JOURNAL',
                    config: {
                      recordRef: 'uiserv/journal@system-notifications'
                    }
                  }
                ]
              }
            ]
          },
          {
            id: '979bfe85-5361-4cf2-a0a3-dd43dabc95b6',
            type: 'ARBITRARY',
            config: {
              url: '/v2/bpmn-designer'
            },
            action: {
              type: '',
              config: {}
            },
            items: [],
            allowedFor: []
          }
        ]
      }
    ];
    describe.each([
      [
        'home dashboard',
        `/v2/dashboard`,
        'activeLayoutId=layout_bb6e6685-f802-4680-8606-007a42a8c1bd',
        'cc02d5ac-e511-4b06-9dc6-73273fa0a801'
      ],
      [
        'some dashboard',
        `/v2/dashboard`,
        'recordRef=alfresco/@workspace://SpacesStore/ceb274df-4718-4683-ac4f-801daca655c0',
        'tttcc02d5ac-e511-4b06-9dc6-73273fa0a801'
      ],
      ['journal', `/v2/journals`, 'journalId=system-notifications', '88be206d-2cd8-4fd8-bcd0-ab4f6b1a6c23'],
      ['undefined', `/v2/journals`, 'journalId=system', undefined],
      ['admin old link', `/v2/bpmn-designer`, '', '979bfe85-5361-4cf2-a0a3-dd43dabc95b6'],
      ['admin', `/v2/admin`, 'type=BPM', '979bfe85-5361-4cf2-a0a3-dd43dabc95b6']
    ])('%s', (title, pathname, search, output) => {
      beforeEach(() => {
        delete window.location;
        window.location = { pathname, search };
      });

      it(title, () => {
        const returnValue = SidebarService.getSelectedId(items);
        expect(returnValue).toEqual(output);
      });
    });
  });
});
