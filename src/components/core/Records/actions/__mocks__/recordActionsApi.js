export const RECORD_0 = 'workspace://SpacesStore/test-record0';
export const RECORD_1 = 'workspace://SpacesStore/test-record1';
export const RECORD_2 = 'workspace://SpacesStore/test-record2';

export const ACTION_0 = 'uiserv/action@action0';
export const ACTION_1 = 'uiserv/action@action1';
export const ACTION_2 = 'uiserv/action@action2';

export const TYPE_0 = 'emodel/type@type0';
export const TYPE_1 = 'emodel/type@type1';
export const TYPE_2 = 'emodel/type@type2';

export const RECORDS = [RECORD_0, RECORD_1, RECORD_2];

export const ACTIONS_BY_RECORD = {
  [RECORD_0]: [ACTION_0],
  [RECORD_1]: [ACTION_0, ACTION_1],
  [RECORD_2]: [ACTION_0, ACTION_1, ACTION_2]
};

export const ACTIONS_BY_TYPE = {
  [TYPE_0]: [ACTION_0, ACTION_2],
  [TYPE_1]: [ACTION_0, ACTION_1],
  [TYPE_2]: [ACTION_0, ACTION_1, ACTION_2]
};

export const ACTION_DTO_BY_ID = {
  [ACTION_0]: {
    id: 'first',
    className: 'fitnesse-inline-tools-actions-btn__first',
    type: 'test-action',
    name: 'First Action'
  },
  [ACTION_1]: {
    id: 'second',
    className: 'fitnesse-inline-tools-actions-btn__second',
    type: 'test-action',
    name: 'Second action',
    pluralName: 'Second actions',
    features: {
      execForRecord: false
    }
  },
  [ACTION_2]: {
    id: 'third',
    className: 'fitnesse-inline-tools-actions-btn__third',
    type: 'test-action',
    features: {
      execForQuery: false
    }
  }
};

export const RECORD_TYPE = {
  [RECORD_0]: TYPE_0,
  [RECORD_1]: TYPE_0,
  [RECORD_2]: TYPE_2
};

class RecordActionsApi {
  async getActionsForRecords(recordRefs, actionRefs) {
    let actionsDto = actionRefs.map(a => ACTION_DTO_BY_ID[a]);
    let records = recordRefs.map(ref => {
      let actions = ACTIONS_BY_RECORD[ref] || [];
      let res = 0;
      for (let idx = 0; idx < actionRefs.length; idx++) {
        if (actions.indexOf(actionRefs[idx]) !== -1) {
          res = res | (1 << idx);
        }
      }
      return res;
    });

    return {
      records: records,
      actions: actionsDto
    };
  }

  async getActionsForRecord(recordRef) {
    let type = RECORD_TYPE[recordRef];
    if (!type) {
      return [];
    }
    return this.getActionsByType(type);
  }

  async getActionsByType(typeRef) {
    if (!typeRef) {
      return [];
    }
    return ACTIONS_BY_TYPE[typeRef] || [];
  }
}

export default new RecordActionsApi();
