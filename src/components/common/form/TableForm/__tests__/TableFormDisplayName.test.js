import Records from '@citeck/records-core';
import Record from '@citeck/records-core/Record';
import { render, act } from '@testing-library/react';
import React from 'react';

jest.mock('@/components/forms/EcosForm', () => ({
  __esModule: true,
  FORM_MODE_CLONE: 'CLONE',
  FORM_MODE_CREATE: 'CREATE',
  FORM_MODE_EDIT: 'EDIT',
  FORM_MODE_VIEW: 'VIEW'
}));

jest.mock('@/components/forms/EcosForm/EcosFormUtils', () => ({
  __esModule: true,
  default: {
    getForm: jest.fn(),
    cloneRecord: jest.fn(),
    initJsonRecord: jest.fn(v => v)
  }
}));

import {
  TableFormContext,
  TableFormContextProvider,
  buildRowFetchPlan,
  extractAttsFromDisplayJs,
  resolveAssocDisplayValue,
  resolveSingleAssocDisplay
} from '../TableFormContext';

import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils';
import { Components } from '@/forms/components';

const PLANT_Z001 = 'emodel/mdmref-plant@mdmref-plant-z001';
const PLANT_Z002 = 'emodel/mdmref-plant@mdmref-plant-z002';
const PLANT_Z003 = 'emodel/mdmref-plant@mdmref-plant-z003';
const PLANT_SHORT = 'mdmref-plant@123';
const SPEC_ING = 'emodel/mdmref-spec-type@ING';

const PLANT_SJ_COMPONENT = {
  key: 'nfgrProductionPlant',
  type: 'selectJournal',
  multiple: true,
  computed: {
    valueDisplayName: "disp = _.toString(value.att('plntCode'));"
  }
};

const COLUMNS = [
  {
    attribute: 'nfgrProductionPlant',
    multiple: true,
    formatter: {
      name: 'FormFieldFormatter',
      params: { component: PLANT_SJ_COMPONENT }
    }
  },
  {
    attribute: 'mtcrSpecType',
    multiple: false
  },
  {
    attribute: 'mtcrTags',
    multiple: true
  }
];

const COLUMNS_WITHOUT_FORMATTER_COMPONENT = [
  {
    attribute: 'nfgrProductionPlant',
    multiple: true
  },
  {
    attribute: 'mtcrSpecType',
    multiple: false
  },
  {
    attribute: 'mtcrTags',
    multiple: true
  }
];

const plantRecordsData = {
  [PLANT_Z001]: { plntCode: 'Z001', '.disp': 'Z001-Spb TEA RU SU' },
  [PLANT_Z002]: { plntCode: 'Z002', '.disp': 'Z002-Tula Food' },
  [PLANT_Z003]: { plntCode: 'Z003', '.disp': 'Z003-Omsk Dairy' },
  [PLANT_SHORT]: { plntCode: 'S123', '.disp': 'S123-Short Ref Plant' },
  [SPEC_ING]: { '.disp': 'ING' }
};

function createFakeRefRecord(id) {
  const data = plantRecordsData[id] || {};
  const cache = {};
  return {
    id,
    att: key => (key in cache ? cache[key] : null),
    load: jest.fn(async spec => {
      if (Array.isArray(spec)) {
        const res = {};
        spec.forEach(k => {
          cache[k] = data[k];
          res[k] = data[k];
        });
        return res;
      }
      return data[spec];
    })
  };
}

const flushPromises = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

describe('EMTC-727 #10: TableFormContext resolves custom valueDisplayName & JsonRecord assoc refs', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('extractAttsFromDisplayJs extracts both direct value.att and array-based columns', () => {
    expect(extractAttsFromDisplayJs("disp = _.toString(value.att('plntCode'));")).toEqual(['plntCode']);
    expect(
      extractAttsFromDisplayJs("var columns = ['code','name'];\ndisp = _.join(columns.map(function (c) { return value.att(c); }), '-');")
    ).toEqual(['code', 'name']);
  });

  it('buildRowFetchPlan requests both {id} and fallback {disp} when column selectJournal has computed.valueDisplayName', () => {
    const plan = buildRowFetchPlan(COLUMNS, [PLANT_SJ_COMPONENT]);
    expect(plan.atts).toEqual([
      '.atts(n:"nfgrProductionPlant"){id}',
      '.atts(n:"nfgrProductionPlant"){disp}',
      '.att(n:"mtcrSpecType"){disp}',
      '.atts(n:"mtcrTags"){disp}'
    ]);
  });

  it('resolves BaseRecord initial rows (including short refs) using valueDisplayName and keeps server disp fallback', async () => {
    const rowId = 'emodel/uni-mdm-nfg-nfgr-list-materials-create@row-1';
    const refMocks = {
      [PLANT_Z001]: createFakeRefRecord(PLANT_Z001),
      [PLANT_SHORT]: createFakeRefRecord(PLANT_SHORT)
    };
    const rowRecord = {
      id: rowId,
      isBaseRecord: () => true,
      load: jest.fn(async atts => {
        if (atts === '_notExists?bool') return false;
        return {
          '.atts(n:"nfgrProductionPlant"){id}': [PLANT_Z001, PLANT_SHORT],
          '.atts(n:"nfgrProductionPlant"){disp}': ['Z001-Spb TEA RU SU', 'S123-Short Ref Plant'],
          '.att(n:"mtcrSpecType"){disp}': 'ING',
          '.atts(n:"mtcrTags"){disp}': ['tag-1']
        };
      })
    };

    jest.spyOn(EcosFormUtils, 'getForm').mockResolvedValue({
      load: async () => ({ components: [PLANT_SJ_COMPONENT] })
    });
    jest.spyOn(Records, 'get').mockImplementation(id => (id === rowId ? rowRecord : refMocks[id] || createFakeRefRecord(id)));

    let capturedCtx;
    render(
      <TableFormContextProvider
        controlProps={{
          columns: COLUMNS,
          defaultValue: [rowId],
          onChange: jest.fn()
        }}
      >
        <TableFormContext.Consumer>
          {ctx => {
            capturedCtx = ctx;
            return null;
          }}
        </TableFormContext.Consumer>
      </TableFormContextProvider>
    );

    await flushPromises();
    await flushPromises();

    expect(rowRecord.load).toHaveBeenCalledWith(
      [
        '.atts(n:"nfgrProductionPlant"){id}',
        '.atts(n:"nfgrProductionPlant"){disp}',
        '.att(n:"mtcrSpecType"){disp}',
        '.atts(n:"mtcrTags"){disp}'
      ],
      undefined
    );
    expect(capturedCtx.gridRows).toHaveLength(1);
    expect(capturedCtx.gridRows[0].nfgrProductionPlant).toEqual(['Z001', 'S123']);
    expect(capturedCtx.gridRows[0].mtcrSpecType).toBe('ING');
  });

  it('falls back to server disp instead of raw technical ID when valueDisplayName returns empty or throws', async () => {
    const brokenSjComponent = {
      key: 'nfgrProductionPlant',
      type: 'selectJournal',
      multiple: true,
      computed: {
        valueDisplayName: 'throw new Error("broken display script");'
      }
    };
    const rowId = 'emodel/uni-mdm-nfg-nfgr-list-materials-create@row-fallback';
    const rowRecord = {
      id: rowId,
      isBaseRecord: () => true,
      load: jest.fn(async atts => {
        if (atts === '_notExists?bool') return false;
        return {
          '.atts(n:"nfgrProductionPlant"){id}': [PLANT_SHORT],
          '.atts(n:"nfgrProductionPlant"){disp}': ['S123-Short Ref Plant']
        };
      })
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(EcosFormUtils, 'getForm').mockResolvedValue({
      load: async () => ({ components: [brokenSjComponent] })
    });
    jest.spyOn(Records, 'get').mockImplementation(id => (id === rowId ? rowRecord : createFakeRefRecord(id)));

    let capturedCtx;
    render(
      <TableFormContextProvider
        controlProps={{
          columns: [{ attribute: 'nfgrProductionPlant', multiple: true }],
          defaultValue: [rowId],
          onChange: jest.fn()
        }}
      >
        <TableFormContext.Consumer>
          {ctx => {
            capturedCtx = ctx;
            return null;
          }}
        </TableFormContext.Consumer>
      </TableFormContextProvider>
    );

    await flushPromises();
    await flushPromises();

    expect(capturedCtx.gridRows).toHaveLength(1);
    expect(capturedCtx.gridRows[0].nfgrProductionPlant).toEqual(['S123-Short Ref Plant']);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('discovers dynamic value.att(variable) attributes via tracking proxy without regex match', async () => {
    const dynamicSjComponent = {
      key: 'nfgrProductionPlant',
      type: 'selectJournal',
      multiple: false,
      computed: {
        valueDisplayName: "const key = 'plntCode'; disp = value.att(key);"
      }
    };
    const fakeRec = createFakeRefRecord(PLANT_SHORT);
    jest.spyOn(Records, 'get').mockReturnValue(fakeRec);

    const disp = await resolveSingleAssocDisplay(PLANT_SHORT, dynamicSjComponent, 'S123-Short Ref Plant');
    expect(disp).toBe('S123');
    expect(fakeRec.load).toHaveBeenCalledWith(['plntCode']);
  });

  it('uses per-element server disp instead of raw ID for mixed arrays containing Alfresco refs', async () => {
    const ALFRESCO_REF = 'alfresco/@workspace://SpacesStore/123';
    const rowId = 'emodel/uni-mdm-nfg-nfgr-list-materials-create@row-mixed-alfresco';
    const refMocks = {
      [PLANT_Z001]: createFakeRefRecord(PLANT_Z001)
    };
    const rowRecord = {
      id: rowId,
      isBaseRecord: () => true,
      load: jest.fn(async atts => {
        if (atts === '_notExists?bool') return false;
        return {
          '.atts(n:"nfgrProductionPlant"){id}': [PLANT_Z001, ALFRESCO_REF],
          '.atts(n:"nfgrProductionPlant"){disp}': ['Z001-Spb TEA RU SU', 'Archive node']
        };
      })
    };

    jest.spyOn(EcosFormUtils, 'getForm').mockResolvedValue({
      load: async () => ({ components: [PLANT_SJ_COMPONENT] })
    });
    jest.spyOn(Records, 'get').mockImplementation(id => (id === rowId ? rowRecord : refMocks[id] || createFakeRefRecord(id)));

    let capturedCtx;
    render(
      <TableFormContextProvider
        controlProps={{
          columns: [{ attribute: 'nfgrProductionPlant', multiple: true }],
          defaultValue: [rowId],
          onChange: jest.fn()
        }}
      >
        <TableFormContext.Consumer>
          {ctx => {
            capturedCtx = ctx;
            return null;
          }}
        </TableFormContext.Consumer>
      </TableFormContextProvider>
    );

    await flushPromises();
    await flushPromises();

    expect(capturedCtx.gridRows).toHaveLength(1);
    expect(capturedCtx.gridRows[0].nfgrProductionPlant).toEqual(['Z001', 'Archive node']);
  });

  it('falls back to server disp when dynamic valueDisplayName exhausts pass limit with unloaded attributes', async () => {
    const chainedSjComponent = {
      key: 'nfgrProductionPlant',
      type: 'selectJournal',
      multiple: false,
      computed: {
        valueDisplayName: [
          "const k1 = 'firstKey';",
          'const step1 = value.att(k1);',
          'const step2 = step1 ? value.att(step1) : null;',
          'const step3 = step2 ? value.att(step2) : null;',
          "disp = step3 || 'Unknown';"
        ].join('\n')
      }
    };

    const backing = {
      firstKey: 'secondKey',
      secondKey: 'thirdKey',
      thirdKey: 'Z999'
    };
    const loaded = new Set();
    const fakeRec = {
      id: PLANT_Z001,
      load: jest.fn(async atts => {
        const list = Array.isArray(atts) ? atts : [atts];
        list.forEach(a => loaded.add(a));
        return list.reduce((acc, a) => ({ ...acc, [a]: backing[a] }), {});
      }),
      att: jest.fn(name => (loaded.has(name) ? backing[name] : null))
    };

    jest.spyOn(Records, 'get').mockReturnValue(fakeRec);

    const disp = await resolveSingleAssocDisplay(PLANT_Z001, chainedSjComponent, 'Server Display Name');
    expect(disp).toBe('Server Display Name');
    expect(fakeRec.load).toHaveBeenCalledTimes(2);
  });

  it('resolves unsaved JsonRecord initial rows, create submit, and edit submit using a real SelectJournalComponent instance', async () => {
    const SelectJournalComponent = Components._components.selectJournal;
    const realSjInstance = new SelectJournalComponent(PLANT_SJ_COMPONENT, {}, {});
    expect(realSjInstance.computed).toBeUndefined();
    expect(realSjInstance.component.computed.valueDisplayName).toBe(PLANT_SJ_COMPONENT.computed.valueDisplayName);

    const rowId = 'json-rec-1';
    const refMocks = {
      [PLANT_Z001]: createFakeRefRecord(PLANT_Z001),
      [PLANT_Z002]: createFakeRefRecord(PLANT_Z002),
      [PLANT_Z003]: createFakeRefRecord(PLANT_Z003),
      [PLANT_SHORT]: createFakeRefRecord(PLANT_SHORT),
      [SPEC_ING]: createFakeRefRecord(SPEC_ING)
    };
    const jsonRowRecord = Object.create(Record.prototype);
    Object.defineProperty(jsonRowRecord, 'id', { value: rowId });
    Object.assign(jsonRowRecord, {
      isBaseRecord: () => false,
      toJsonAsync: jest.fn(async () => ({
        attributes: {
          nfgrProductionPlant: [PLANT_Z001],
          mtcrSpecType: SPEC_ING,
          mtcrTags: ['raw-text']
        }
      })),
      load: jest.fn(async arg => {
        if (arg === '_notExists?bool') return false;
        if (Array.isArray(arg)) {
          return {
            nfgrProductionPlant: [PLANT_Z003],
            mtcrSpecType: SPEC_ING,
            mtcrTags: ['raw-text']
          };
        }
        return null;
      })
    });

    jest.spyOn(EcosFormUtils, 'getForm').mockResolvedValue({
      load: async () => ({ components: [PLANT_SJ_COMPONENT] })
    });
    jest.spyOn(Records, 'get').mockImplementation(id => (id === rowId ? jsonRowRecord : refMocks[id] || createFakeRefRecord(id)));

    const onChange = jest.fn();
    let capturedCtx;
    render(
      <TableFormContextProvider
        controlProps={{
          columns: COLUMNS_WITHOUT_FORMATTER_COMPONENT,
          defaultValue: [rowId],
          onChange
        }}
      >
        <TableFormContext.Consumer>
          {ctx => {
            capturedCtx = ctx;
            return null;
          }}
        </TableFormContext.Consumer>
      </TableFormContextProvider>
    );

    await flushPromises();
    await flushPromises();

    expect(capturedCtx.gridRows[0].nfgrProductionPlant).toEqual(['Z001']);
    expect(capturedCtx.gridRows[0].mtcrSpecType).toBe('ING');
    expect(capturedCtx.gridRows[0].mtcrTags).toEqual(['raw-text']);

    const newRowRecord = {
      id: 'json-rec-2',
      toJsonAsync: async () => ({
        attributes: {
          nfgrProductionPlant: [PLANT_Z001, PLANT_SHORT],
          mtcrSpecType: SPEC_ING
        }
      })
    };

    await act(async () => {
      capturedCtx.onCreateFormSubmit(newRowRecord, { getAllComponents: () => [realSjInstance] });
    });
    await flushPromises();

    expect(capturedCtx.gridRows).toHaveLength(2);
    expect(capturedCtx.gridRows[1].nfgrProductionPlant).toEqual(['Z001', 'S123']);

    jsonRowRecord.toJsonAsync = jest.fn(async () => ({
      attributes: {
        nfgrProductionPlant: [PLANT_Z003],
        mtcrSpecType: SPEC_ING,
        mtcrTags: ['kept-scalar']
      }
    }));
    jsonRowRecord.load = jest.fn(async () => ({
      nfgrProductionPlant: [PLANT_Z003],
      mtcrSpecType: SPEC_ING,
      mtcrTags: ['kept-scalar']
    }));

    await act(async () => {
      capturedCtx.onEditFormSubmit(jsonRowRecord, { getAllComponents: () => [realSjInstance] });
    });
    await flushPromises();

    expect(capturedCtx.gridRows[0].nfgrProductionPlant).toEqual(['Z003']);
    expect(capturedCtx.gridRows[0].mtcrTags).toEqual(['kept-scalar']);
  });

  it('resolveAssocDisplayValue returns null for plain text and email strings when column is not selectJournal', async () => {
    expect(await resolveAssocDisplayValue('plain-text', null)).toBeNull();
    expect(await resolveAssocDisplayValue('user@example.com', null)).toBeNull();
    expect(await resolveAssocDisplayValue(['a', 'b'], null)).toBeNull();
  });
});
