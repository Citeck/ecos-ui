import { selectInstanceActions, selectInstanceMetaInfo, selectInstanceTabInfo } from '../instanceAdmin';

// A record ref with a DOT in the local id — lodash `get` with a STRING path would split it
// ('emodel/person@jane' -> 'doe') and never find the stored entry (COREDEV-492).
const instanceId = 'emodel/person@jane.doe';
const tabId = 'VARIABLES';

const metaInfo = { loading: false, definitionRefId: 'eproc/bpmn-def@some-def' };
const actionsInfo = { loading: false, data: [{ id: 'delete' }] };
const tabInfo = { loading: false, data: [], totalCount: 0 };

const state = {
  instanceAdmin: {
    [instanceId]: {
      metaInfo,
      actionsInfo,
      [tabId]: tabInfo
    }
  }
};

describe('instanceAdmin selectors', () => {
  describe('record ref with a dot', () => {
    it('selectInstanceMetaInfo returns the stored metaInfo', () => {
      expect(selectInstanceMetaInfo(state, { instanceId })).toBe(metaInfo);
    });

    it('selectInstanceActions returns the stored actionsInfo', () => {
      expect(selectInstanceActions(state, { instanceId })).toBe(actionsInfo);
    });

    it('selectInstanceTabInfo returns the stored tab info', () => {
      expect(selectInstanceTabInfo(state, { instanceId, tabId })).toBe(tabInfo);
    });
  });

  describe('missing entry', () => {
    // Every store change used to produce a brand new `{}` default, so connected components got a
    // new prop reference on every dispatch and their effects re-fired forever.
    const missing = { instanceId: 'emodel/person@no.such.person', tabId };

    it('selectInstanceMetaInfo returns the same reference for different store objects', () => {
      const first = selectInstanceMetaInfo({ instanceAdmin: {} }, missing);
      const second = selectInstanceMetaInfo({ instanceAdmin: { other: {} } }, missing);

      expect(first).toEqual({});
      expect(second).toBe(first);
    });

    it('selectInstanceActions returns the same reference for different store objects', () => {
      const first = selectInstanceActions({ instanceAdmin: {} }, missing);
      const second = selectInstanceActions({ instanceAdmin: { other: {} } }, missing);

      expect(first).toEqual({});
      expect(second).toBe(first);
    });

    it('selectInstanceTabInfo returns the same reference for different store objects', () => {
      const first = selectInstanceTabInfo({ instanceAdmin: {} }, missing);
      const second = selectInstanceTabInfo({ instanceAdmin: { other: {} } }, missing);

      expect(first).toEqual({});
      expect(second).toBe(first);
    });
  });
});
