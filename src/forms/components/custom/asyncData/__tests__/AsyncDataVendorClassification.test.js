import Records from '@citeck/records-core';

import { TestForm } from '../../../../test/forms2/TestForm';
import { Components } from '../../../index';
import BaseReactComponent from '../../base/BaseReactComponent';

import ecosFetch from '@/helpers/ecosFetch';

jest.mock('@/helpers/ecosFetch', () => {
  const actual = jest.requireActual('@/helpers/ecosFetch');
  return {
    __esModule: true,
    ...actual,
    default: jest.fn()
  };
});

class DummyClassificationJournalComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        type: 'dummyClassificationJournal',
        label: 'Classification',
        key: 'dummyClassificationJournal',
        input: true
      },
      ...extend
    );
  }

  get defaultSchema() {
    return DummyClassificationJournalComponent.schema();
  }

  getComponentToRender() {
    return function DummyInput() {
      return null;
    };
  }

  setReactValue() {}
}

beforeAll(() => {
  if (!Components._components.dummyClassificationJournal) {
    Components.addComponent('dummyClassificationJournal', DummyClassificationJournalComponent);
  }
});

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('EMTC-672: AsyncData refreshOn reset, once-mode preservation, request generation guard & SelectJournal validation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    ecosFetch.mockReset();
  });

  const buildVendorClassificationDefinition = () => ({
    components: [
      {
        type: 'asyncData',
        key: 'classificationPIFlat_ad',
        input: true,
        persistent: 'client-only',
        update: { type: 'once', rate: 5 },
        source: {
          type: 'record',
          forceLoad: false,
          record: {
            id: "{{ !data.classificationPIFlat ? '' : (('' + data.classificationPIFlat).indexOf('@') >= 0 ? ('' + data.classificationPIFlat) : \"emodel/mdmref-classification-pi-flat@\" + data.classificationPIFlat) }}",
            attributes: { cpiVendorType: 'cpiVendorType' }
          }
        },
        executionCondition: "value = !(data.classificationPIFlat == null || data.classificationPIFlat === '');",
        refreshOn: [{ label: 'classificationPIFlat', value: 'classificationPIFlat' }]
      },
      {
        type: 'asyncData',
        key: 'vrqClassificationMBS_ad',
        input: true,
        persistent: 'client-only',
        update: { type: 'once', rate: 5 },
        source: {
          type: 'record',
          forceLoad: false,
          record: {
            id: "{{ !data.vrqClassificationMBS ? '' : (('' + data.vrqClassificationMBS).indexOf('@') >= 0 ? ('' + data.vrqClassificationMBS) : \"emodel/mdmref-classification-mbs@\" + data.vrqClassificationMBS) }}",
            attributes: { cmbsVendorType: 'cmbsVendorType' }
          }
        },
        executionCondition: "value = !(data.vrqClassificationMBS == null || data.vrqClassificationMBS === '');",
        refreshOn: [{ label: 'vrqClassificationMBS', value: 'vrqClassificationMBS' }]
      },
      {
        type: 'textfield',
        key: 'vrqaVendorType',
        label: 'Vendor type',
        input: true
      },
      {
        type: 'dummyClassificationJournal',
        key: 'vrqClassificationMBS',
        label: 'Classification MBS',
        input: true,
        clearOnHide: false,
        conditional: { show: true, when: 'vrqaVendorType', eq: 'nonproductive' },
        logic: [
          {
            name: 'mandatory',
            trigger: { type: 'javascript', javascript: 'result = data.vrqaVendorType == "nonproductive";' },
            actions: [
              {
                name: 'required',
                type: 'property',
                property: { type: 'boolean', value: 'validate.required' },
                state: true
              }
            ]
          },
          {
            name: 'Clear value when hidden',
            trigger: { type: 'javascript', javascript: 'result = data.vrqaVendorType != "nonproductive";' },
            actions: [{ name: 'Clear value when hidden', type: 'value', value: "value = '';" }]
          }
        ]
      },
      {
        type: 'dummyClassificationJournal',
        key: 'classificationPIFlat',
        label: 'Classification PI',
        input: true,
        clearOnHide: false,
        conditional: { show: true, when: 'vrqaVendorType', eq: 'productive' },
        logic: [
          {
            name: 'mandatory',
            trigger: { type: 'javascript', javascript: 'result = data.vrqaVendorType == "productive";' },
            actions: [
              {
                name: 'required',
                type: 'property',
                property: { type: 'boolean', value: 'validate.required' },
                state: true
              }
            ]
          }
        ]
      },
      {
        type: 'textfield',
        key: 'vrqaVendorTypeEN',
        label: 'Vendor type En',
        input: true,
        disabled: true,
        allowCalculateOverride: false,
        calculateValue:
          'var answered = ((data.vrqaVendorType == "productive") ? ((!!data.classificationPIFlat_ad && typeof data.classificationPIFlat_ad === \'object\' && "cpiVendorType" in data.classificationPIFlat_ad) || (data.classificationPIFlat == null || data.classificationPIFlat === \'\')) : ((data.vrqaVendorType == "nonproductive") ? ((!!data.vrqClassificationMBS_ad && typeof data.vrqClassificationMBS_ad === \'object\' && "cmbsVendorType" in data.vrqClassificationMBS_ad) || (data.vrqClassificationMBS == null || data.vrqClassificationMBS === \'\')) : true));\n' +
          'var current = instance.hasValue() ? instance.dataValue : null;\n' +
          "var held = !(current == null || current === '' || (Array.isArray(current) && current.length === 0));\n" +
          'value = answered || !held ? (data.vrqaVendorType == "productive") ? ((data.classificationPIFlat == null || data.classificationPIFlat === \'\') ? null : (data.classificationPIFlat_ad || {}).cpiVendorType) : (data.vrqaVendorType == "nonproductive") ? ((data.vrqClassificationMBS == null || data.vrqClassificationMBS === \'\') ? null : (data.vrqClassificationMBS_ad || {}).cmbsVendorType) : null : instance.dataValue;'
      }
    ]
  });

  const waitAsync = async form => {
    const asyncComps = form.getAllComponents().filter(c => c.type === 'asyncData');
    await new Promise(resolve => setTimeout(resolve, 250));
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline && (asyncComps.some(c => c.activeAsyncActionsCounter > 0) || form.changing)) {
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  };

  it('recalculates vrqaVendorTypeEN on MBS pick, PI pick, clear PI and re-pick same PI', async () => {
    const loadedRecords = {
      'emodel/mdmref-classification-mbs@cmbs-2': { cmbsVendorType: 'Marketing Business Services' },
      'emodel/mdmref-classification-pi-flat@cpi-1': { cpiVendorType: 'Production Item Vendor' },
      'emodel/mdmref-classification-pi-flat@cpi-2': { cpiVendorType: 'Packaging Materials' }
    };

    jest.spyOn(Records, 'get').mockImplementation(id => {
      const data = loadedRecords[id] || {};
      return {
        getBaseRecord() {
          return this;
        },
        watch: () => ({
          getWatchedAttributes: () => ({}),
          unwatch: jest.fn()
        }),
        load: jest.fn(() => Promise.resolve({ ...data }))
      };
    });

    const wrapper = await TestForm.create(buildVendorClassificationDefinition(), { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();

    await wrapper.setInputValue('vrqaVendorType', 'nonproductive');
    await wrapper.setInputValue('vrqClassificationMBS', 'emodel/mdmref-classification-mbs@cmbs-2');
    await waitAsync(form);
    expect(form.getComponent('vrqaVendorTypeEN').getValue()).toBe('Marketing Business Services');

    await wrapper.setInputValue('vrqaVendorType', 'productive');
    await waitAsync(form);
    await wrapper.setInputValue('classificationPIFlat', 'emodel/mdmref-classification-pi-flat@cpi-1');
    await waitAsync(form);
    expect(form.getComponent('vrqaVendorTypeEN').getValue()).toBe('Production Item Vendor');

    await wrapper.setInputValue('classificationPIFlat', '');
    await waitAsync(form);
    expect(form.getComponent('classificationPIFlat_ad').getValue()).toEqual({});
    expect(form.getComponent('classificationPIFlat_ad').evaluatedRecordId).toBeUndefined();
    expect(form.getComponent('vrqaVendorTypeEN').getValue() || '').toBe('');

    await wrapper.setInputValue('classificationPIFlat', 'emodel/mdmref-classification-pi-flat@cpi-1');
    await waitAsync(form);
    expect(form.getComponent('vrqaVendorTypeEN').getValue()).toBe('Production Item Vendor');
  }, 15000);

  it('preserves once-mode semantics without refreshOn: does not clear value or repeat AJAX POST when executionCondition toggles', async () => {
    ecosFetch.mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ status: 'created', id: 'tx-1' })
      })
    );

    const definition = {
      components: [
        {
          type: 'textfield',
          key: 'flag',
          label: 'Flag',
          input: true
        },
        {
          type: 'asyncData',
          key: 'oncePost',
          input: true,
          persistent: 'client-only',
          update: { type: 'once', rate: 5 },
          executionCondition: 'value = data.flag === "on";',
          refreshOn: [],
          source: {
            type: 'ajax',
            ajax: {
              method: 'POST',
              url: '/gateway/test/action',
              data: 'value = { action: "submit" };',
              mapping: ''
            }
          }
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, { flag: 'on' });
    const form = wrapper.getForm();
    await waitAsync(form);

    expect(ecosFetch).toHaveBeenCalledTimes(1);
    expect(form.getComponent('oncePost').getValue()).toEqual({ status: 'created', id: 'tx-1' });

    await wrapper.setInputValue('flag', 'off');
    await waitAsync(form);
    expect(ecosFetch).toHaveBeenCalledTimes(1);
    expect(form.getComponent('oncePost').getValue()).toEqual({ status: 'created', id: 'tx-1' });

    await wrapper.setInputValue('flag', 'on');
    await waitAsync(form);
    expect(ecosFetch).toHaveBeenCalledTimes(1);
    expect(form.getComponent('oncePost').getValue()).toEqual({ status: 'created', id: 'tx-1' });
  }, 15000);

  it('ignores stale out-of-order AsyncData response when dependency is cleared and re-selected with the same value', async () => {
    const reqA = createDeferred();
    const reqB = createDeferred();
    let callCount = 0;

    jest.spyOn(Records, 'get').mockImplementation(() => ({
      getBaseRecord() {
        return this;
      },
      watch: () => ({
        getWatchedAttributes: () => ({}),
        unwatch: jest.fn()
      }),
      load: jest.fn(() => {
        callCount += 1;
        return callCount === 1 ? reqA.promise : reqB.promise;
      })
    }));

    const wrapper = await TestForm.create(buildVendorClassificationDefinition(), { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();
    const piAd = form.getComponent('classificationPIFlat_ad');

    await wrapper.setInputValue('vrqaVendorType', 'productive');
    await wrapper.setInputValue('classificationPIFlat', 'emodel/mdmref-classification-pi-flat@cpi-1');
    await new Promise(resolve => setTimeout(resolve, 260));
    expect(callCount).toBe(1);
    expect(piAd.activeAsyncActionsCounter).toBe(1);

    await wrapper.setInputValue('classificationPIFlat', '');
    await new Promise(resolve => setTimeout(resolve, 40));
    expect(piAd.getValue()).toEqual({});

    await wrapper.setInputValue('classificationPIFlat', 'emodel/mdmref-classification-pi-flat@cpi-1');
    await new Promise(resolve => setTimeout(resolve, 260));
    expect(callCount).toBe(2);

    reqB.resolve({ cpiVendorType: 'Fresh Value' });
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(piAd.getValue()).toEqual({ cpiVendorType: 'Fresh Value' });
    expect(form.getComponent('vrqaVendorTypeEN').getValue()).toBe('Fresh Value');

    reqA.resolve({ cpiVendorType: 'Stale Value' });
    await waitAsync(form);

    expect(piAd.getValue()).toEqual({ cpiVendorType: 'Fresh Value' });
    expect(form.getComponent('vrqaVendorTypeEN').getValue()).toBe('Fresh Value');
  }, 15000);

  it('renders exactly one required error message on a real SelectJournal after repeated clear cycles', async () => {
    const origGet = Records.get.bind(Records);
    jest.spyOn(Records, 'get').mockImplementation(id => {
      if (typeof id === 'string' && id.startsWith('emodel/mdmref-classification-mbs@')) {
        return {
          id,
          getBaseRecord() {
            return this;
          },
          watch: () => ({
            getWatchedAttributes: () => ({}),
            unwatch: jest.fn()
          }),
          load: jest.fn(() => Promise.resolve('Mock Display'))
        };
      }
      return origGet(id);
    });

    const definition = {
      components: [
        {
          type: 'selectJournal',
          key: 'vrqClassificationMBS',
          label: 'Classification MBS',
          input: true,
          source: {
            journalId: 'mdmref-classification-mbs'
          },
          validate: {
            required: true
          }
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();
    const sjComp = form.getComponent('vrqClassificationMBS');

    for (let i = 0; i < 3; i++) {
      sjComp.setValue('emodel/mdmref-classification-mbs@cmbs-2');
      sjComp.setPristine(false);
      expect(sjComp.checkValidity(form.data, true)).toBe(true);

      sjComp.setValue('');
      sjComp.setPristine(false);
      expect(sjComp.checkValidity(form.data, true)).toBe(false);

      const errorContainers = sjComp.element.querySelectorAll('.formio-errors');
      const errorItems = sjComp.element.querySelectorAll('.formio-errors .error, .formio-errors .help-block');
      expect(errorContainers.length).toBe(1);
      expect(errorItems.length).toBe(1);
    }
  }, 15000);

  it.each([
    ['A resolves before B', 'A_FIRST'],
    ['B resolves before A', 'B_FIRST']
  ])(
    'recordsScript Promise race (%s): final value is always B and redundant same-id does not cancel active load',
    async (_, order) => {
      const scriptA = createDeferred();
      const scriptB = createDeferred();
      const loadA = createDeferred();
      const loadB = createDeferred();
      const loadedIds = [];

      jest.spyOn(Records, 'get').mockImplementation(id => ({
        id,
        getBaseRecord() {
          return this;
        },
        watch: () => ({
          getWatchedAttributes: () => ({}),
          unwatch: jest.fn()
        }),
        load: jest.fn(() => {
          loadedIds.push(id);
          return id === 'emodel/rec@A' ? loadA.promise : loadB.promise;
        })
      }));

      const scriptCalls = [];
      const definition = {
        components: [
          {
            type: 'textfield',
            key: 'driver',
            label: 'Driver',
            input: true
          },
          {
            type: 'asyncData',
            key: 'scriptLoader',
            input: true,
            persistent: 'client-only',
            update: { type: 'once', rate: 5 },
            executionCondition: 'value = Boolean(data.driver);',
            refreshOn: [{ label: 'driver', value: 'driver' }],
            source: {
              type: 'recordsScript',
              recordsScript: {
                script: 'value = data._resolveScript(data.driver);',
                attributes: { title: 'title' }
              }
            }
          }
        ]
      };

      const resolveScript = driver => {
        scriptCalls.push(driver);
        if (driver === 'A') return scriptA.promise;
        if (driver === 'B') return scriptB.promise;
        return Promise.resolve('emodel/rec@B');
      };

      const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, { _resolveScript: resolveScript });
      const form = wrapper.getForm();
      const loader = form.getComponent('scriptLoader');

      // Fire A, wait past 200ms debounce so scriptA is pending
      await wrapper.setInputValue('driver', 'A');
      await new Promise(resolve => setTimeout(resolve, 250));
      expect(scriptCalls).toEqual(['A']);

      // Switch to B while scriptA is still pending (no reset / executionCondition stays true)
      await wrapper.setInputValue('driver', 'B');
      await new Promise(resolve => setTimeout(resolve, 250));
      expect(scriptCalls).toEqual(['A', 'B']);

      if (order === 'A_FIRST') {
        scriptA.resolve('emodel/rec@A');
        await new Promise(resolve => setTimeout(resolve, 50));
        // Stale scriptA must be discarded and must not even start loading A
        expect(loadedIds).toEqual([]);

        scriptB.resolve('emodel/rec@B');
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(loadedIds).toEqual(['emodel/rec@B']);
      } else {
        scriptB.resolve('emodel/rec@B');
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(loadedIds).toEqual(['emodel/rec@B']);

        scriptA.resolve('emodel/rec@A');
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(loadedIds).toEqual(['emodel/rec@B']);
      }

      // Trigger a redundant update that resolves to the SAME id 'emodel/rec@B' while loadB is still in flight
      await wrapper.setInputValue('driver', 'B_SAME');
      await new Promise(resolve => setTimeout(resolve, 250));
      expect(loadedIds).toEqual(['emodel/rec@B']);

      // Resolve loadB (and loadA defensively) -> final value must be B
      loadB.resolve({ title: 'Title B' });
      loadA.resolve({ title: 'Title A' });
      await waitAsync(form);

      expect(loader.getValue()).toEqual({ title: 'Title B' });
    },
    15000
  );

  it('record watcher with refreshOn does not refill cleared AsyncData while executionCondition is false', async () => {
    let recordVersion = 1;
    const watchCallbacks = [];
    const unwatchFns = [];
    const loadSpy = jest.fn(async () => ({ title: `Version ${recordVersion}` }));

    jest.spyOn(Records, 'get').mockImplementation(id => ({
      id,
      getBaseRecord() {
        return this;
      },
      watch: jest.fn((atts, cb) => {
        watchCallbacks.push(cb);
        const unwatch = jest.fn();
        unwatchFns.push(unwatch);
        return {
          getWatchedAttributes: () => ({ ...atts }),
          unwatch
        };
      }),
      load: loadSpy
    }));

    const definition = {
      components: [
        {
          type: 'textfield',
          key: 'enabled',
          label: 'Enabled',
          input: true
        },
        {
          type: 'asyncData',
          key: 'watchedLoader',
          input: true,
          persistent: 'client-only',
          update: { type: 'any-change', rate: 5 },
          executionCondition: "value = data.enabled === 'yes';",
          refreshOn: [{ label: 'enabled', value: 'enabled' }],
          source: {
            type: 'record',
            record: {
              id: 'emodel/doc@watched-1',
              attributes: { title: 'title' }
            }
          }
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();
    const loader = form.getComponent('watchedLoader');

    // Step 1: enable -> loads Version 1 and attaches record watcher
    await wrapper.setInputValue('enabled', 'yes');
    await waitAsync(form);
    expect(loader.getValue()).toEqual({ title: 'Version 1' });
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(watchCallbacks).toHaveLength(1);

    // Step 2: disable executionCondition via refreshOn -> value clears to {} and watcher is unwatched
    await wrapper.setInputValue('enabled', 'no');
    await waitAsync(form);
    expect(loader.getValue()).toEqual({});
    expect(unwatchFns[0]).toHaveBeenCalledTimes(1);

    // Step 3: even if a stale watcher callback fires while executionCondition is false, it must NOT refill the cleared field
    recordVersion = 2;
    watchCallbacks[0]();
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitAsync(form);
    expect(loader.getValue()).toEqual({});
    expect(loadSpy).toHaveBeenCalledTimes(1);

    // Step 4: re-enable -> reloads fresh Version 2 and attaches a new watcher
    await wrapper.setInputValue('enabled', 'yes');
    await waitAsync(form);
    expect(loader.getValue()).toEqual({ title: 'Version 2' });
    expect(loadSpy).toHaveBeenCalledTimes(2);
    expect(watchCallbacks).toHaveLength(2);
  }, 15000);

  it('record watcher without refreshOn does not trigger reload while executionCondition is false', async () => {
    let recordVersion = 1;
    const watchCallbacks = [];
    const loadSpy = jest.fn(async () => ({ title: `Version ${recordVersion}` }));

    jest.spyOn(Records, 'get').mockImplementation(id => ({
      id,
      getBaseRecord() {
        return this;
      },
      watch: jest.fn((atts, cb) => {
        watchCallbacks.push(cb);
        return {
          getWatchedAttributes: () => ({ ...atts }),
          unwatch: jest.fn()
        };
      }),
      load: loadSpy
    }));

    const definition = {
      components: [
        {
          type: 'textfield',
          key: 'enabled',
          label: 'Enabled',
          input: true
        },
        {
          type: 'asyncData',
          key: 'watchedNoRefresh',
          input: true,
          persistent: 'client-only',
          update: { type: 'once', rate: 5 },
          executionCondition: "value = data.enabled === 'yes';",
          source: {
            type: 'record',
            record: {
              id: 'emodel/doc@watched-2',
              attributes: { title: 'title' }
            }
          }
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();
    const loader = form.getComponent('watchedNoRefresh');

    await wrapper.setInputValue('enabled', 'yes');
    await waitAsync(form);
    expect(loader.getValue()).toEqual({ title: 'Version 1' });
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(watchCallbacks).toHaveLength(1);

    await wrapper.setInputValue('enabled', 'no');
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(loader.getValue()).toEqual({ title: 'Version 1' });

    recordVersion = 2;
    watchCallbacks[0]();
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitAsync(form);
    expect(loader.getValue()).toEqual({ title: 'Version 1' });
    expect(loadSpy).toHaveBeenCalledTimes(1);
  }, 15000);

  it('once-mode without refreshOn still executes once if executionCondition turns false before 200ms debounce and later turns true (MDM23-08)', async () => {
    ecosFetch.mockImplementation(async () => ({ ok: true, json: async () => ({ createdId: 'once-deferred-1' }) }));

    const definition = {
      components: [
        {
          type: 'textfield',
          key: 'step',
          label: 'Step',
          input: true
        },
        {
          type: 'asyncData',
          key: 'onceAjaxDeferred',
          input: true,
          persistent: 'client-only',
          update: { type: 'once', rate: 5 },
          executionCondition: "value = data.step === 'go';",
          source: {
            type: 'ajax',
            ajax: {
              url: '/gateway/api/once-deferred',
              method: 'POST',
              body: '{ "step": "{{ data.step }}" }'
            }
          }
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();
    const loader = form.getComponent('onceAjaxDeferred');

    // Step 1: flip true -> false BEFORE the 200ms debounce fires
    await wrapper.setInputValue('step', 'go');
    await wrapper.setInputValue('step', 'stop');
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitAsync(form);
    expect(ecosFetch).toHaveBeenCalledTimes(0);
    expect(loader.getValue()).toEqual({});

    // Step 2: flip back to true -> must execute ONCE now (was never executed yet)
    await wrapper.setInputValue('step', 'go');
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitAsync(form);
    expect(ecosFetch).toHaveBeenCalledTimes(1);
    expect(loader.getValue()).toEqual({ createdId: 'once-deferred-1' });

    // Step 3: another false -> true cycle must NOT repeat the POST
    await wrapper.setInputValue('step', 'stop');
    await new Promise(resolve => setTimeout(resolve, 250));
    await wrapper.setInputValue('step', 'go');
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitAsync(form);
    expect(ecosFetch).toHaveBeenCalledTimes(1);
    expect(loader.getValue()).toEqual({ createdId: 'once-deferred-1' });
  }, 15000);

  it('once-mode without refreshOn with async recordsScript Promise retries once if first Promise settled while executionCondition was false', async () => {
    const script1 = createDeferred();
    const script2 = createDeferred();
    let scriptCallCount = 0;
    const loadSpy = jest.fn(async () => ({ title: 'Resolved Record' }));

    jest.spyOn(Records, 'get').mockImplementation(id => ({
      id,
      getBaseRecord() {
        return this;
      },
      watch: () => ({
        getWatchedAttributes: () => ({}),
        unwatch: jest.fn()
      }),
      load: loadSpy
    }));

    const definition = {
      components: [
        {
          type: 'textfield',
          key: 'enabled',
          label: 'Enabled',
          input: true
        },
        {
          type: 'asyncData',
          key: 'onceAsyncScript',
          input: true,
          persistent: 'client-only',
          update: { type: 'once', rate: 5 },
          executionCondition: "value = data.enabled === 'yes';",
          source: {
            type: 'recordsScript',
            recordsScript: {
              script: 'value = data._resolveRecordId();',
              attributes: { title: 'title' }
            }
          }
        }
      ]
    };

    const resolveRecordId = () => {
      scriptCallCount += 1;
      if (scriptCallCount === 1) return script1.promise;
      return script2.promise;
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, { _resolveRecordId: resolveRecordId });
    const form = wrapper.getForm();
    const loader = form.getComponent('onceAsyncScript');

    // Step 1: enable -> wait past 200ms debounce so recordsScript starts pending Promise #1
    await wrapper.setInputValue('enabled', 'yes');
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(scriptCallCount).toBe(1);

    // Step 2: disable while Promise #1 is still pending, then resolve Promise #1 -> must be discarded without locking updatedOnce
    await wrapper.setInputValue('enabled', 'no');
    script1.resolve('emodel/doc@async-once-1');
    await new Promise(resolve => setTimeout(resolve, 100));
    await waitAsync(form);
    expect(loadSpy).toHaveBeenCalledTimes(0);
    expect(loader.getValue()).toEqual({});

    // Step 3: re-enable -> must invoke recordsScript again and load once
    await wrapper.setInputValue('enabled', 'yes');
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(scriptCallCount).toBe(2);
    script2.resolve('emodel/doc@async-once-1');
    await waitAsync(form);
    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(loader.getValue()).toEqual({ title: 'Resolved Record' });

    // Step 4: subsequent false -> true cycle must NOT run again
    await wrapper.setInputValue('enabled', 'no');
    await new Promise(resolve => setTimeout(resolve, 250));
    await wrapper.setInputValue('enabled', 'yes');
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitAsync(form);
    expect(scriptCallCount).toBe(2);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  }, 15000);

  it('once-mode without refreshOn does not starve initial 200ms debounce when unrelated form fields change every 100ms', async () => {
    ecosFetch.mockImplementation(async () => ({ ok: true, json: async () => ({ loaded: true }) }));

    const definition = {
      components: [
        {
          type: 'textfield',
          key: 'enabled',
          label: 'Enabled',
          input: true
        },
        {
          type: 'textfield',
          key: 'otherField',
          label: 'Other Field',
          input: true
        },
        {
          type: 'asyncData',
          key: 'onceActiveForm',
          input: true,
          persistent: 'client-only',
          update: { type: 'once', rate: 5 },
          executionCondition: "value = data.enabled === 'yes';",
          source: {
            type: 'ajax',
            ajax: {
              url: '/gateway/api/once-active-form',
              method: 'POST',
              body: '{ "enabled": "{{ data.enabled }}" }'
            }
          }
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();
    const loader = form.getComponent('onceActiveForm');

    await wrapper.setInputValue('enabled', 'yes');

    let firedDuringActiveChanges = false;
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.setInputValue('otherField', `tick-${i}`);
      if (ecosFetch.mock.calls.length === 1) {
        firedDuringActiveChanges = true;
      }
    }

    await waitAsync(form);
    expect(firedDuringActiveChanges).toBe(true);
    expect(ecosFetch).toHaveBeenCalledTimes(1);
    expect(loader.getValue()).toEqual({ loaded: true });
  }, 15000);

  it('once-mode without refreshOn does not re-run rejected recordsScript on unrelated form edits while executionCondition stays true', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let scriptCallCount = 0;

    const definition = {
      components: [
        {
          type: 'textfield',
          key: 'enabled',
          label: 'Enabled',
          input: true
        },
        {
          type: 'textfield',
          key: 'otherField',
          label: 'Other Field',
          input: true
        },
        {
          type: 'asyncData',
          key: 'onceRejectedScript',
          input: true,
          persistent: 'client-only',
          update: { type: 'once', rate: 5 },
          executionCondition: "value = data.enabled === 'yes';",
          source: {
            type: 'recordsScript',
            recordsScript: {
              script: 'value = data._rejectScript();',
              attributes: { title: 'title' }
            }
          }
        }
      ]
    };

    const rejectScript = () => {
      scriptCallCount += 1;
      return Promise.reject(new Error('backend unavailable'));
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, { _rejectScript: rejectScript });
    const form = wrapper.getForm();
    const loader = form.getComponent('onceRejectedScript');

    await wrapper.setInputValue('enabled', 'yes');
    await new Promise(resolve => setTimeout(resolve, 300));
    await waitAsync(form);
    expect(scriptCallCount).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(loader.getValue()).toEqual({});

    // Edit an unrelated field 3 times -> must NOT re-invoke the failed once-mode script
    for (let i = 1; i <= 3; i++) {
      await wrapper.setInputValue('otherField', `edit-${i}`);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    await waitAsync(form);

    expect(scriptCallCount).toBe(1);
    expect(loader.getValue()).toEqual({});
    warnSpy.mockRestore();
  }, 15000);
});
