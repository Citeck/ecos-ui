import Records from '@citeck/records-core';

import { TestForm } from '../../../../test/forms2/TestForm';
import { Components } from '../../../index';
import { TAB_ERROR_ICON_CLASS, TAB_ERRORS_CLASS, TAB_INVALID_CLASS } from '../../../override/tabs/tabErrors';
import BaseReactComponent from '../BaseReactComponent';

class DummyJournalFieldComponent extends BaseReactComponent {
  static schema(...extend) {
    return BaseReactComponent.schema(
      {
        type: 'dummyJournalField',
        label: 'Hierarchy Field',
        key: 'dummyJournalField',
        input: true
      },
      ...extend
    );
  }

  get defaultSchema() {
    return DummyJournalFieldComponent.schema();
  }

  getComponentToRender() {
    return function DummyInput() {
      return null;
    };
  }
}

beforeAll(() => {
  Components.addComponent('dummyJournalField', DummyJournalFieldComponent);
});

describe('EMTC-365 Case 6: BaseReactComponent redraw + optionalWhenDisabled validation', () => {
  it('does not stack duplicate .formio-errors above <label>, preserves tooltip/description, and clears tab errors when disabled', async () => {
    const definition = {
      components: [
        {
          type: 'tabs',
          key: 'tabs',
          input: false,
          persistent: false,
          components: [
            {
              label: 'Main',
              key: 'mainTab',
              components: [
                {
                  type: 'textfield',
                  key: 'businessUnit',
                  label: 'Business Unit',
                  input: true
                }
              ]
            },
            {
              label: 'Hierarchies',
              key: 'hierTab',
              components: [
                {
                  type: 'dummyJournalField',
                  key: 'crqConsumptionOccasionHierarchy',
                  label: 'Consumption occasion hierarchy',
                  tooltip: 'Select hierarchy node',
                  description: 'Hierarchy helper text',
                  input: true,
                  disabled: true,
                  optionalWhenDisabled: true,
                  validate: {
                    required: true
                  },
                  logic: [
                    {
                      name: 'enableForFood',
                      trigger: {
                        type: 'javascript',
                        javascript: 'result = data.businessUnit === "FOOD";'
                      },
                      actions: [
                        {
                          name: 'enableAction',
                          type: 'property',
                          property: { label: 'Disabled', value: 'disabled', type: 'boolean' },
                          state: false
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, { businessUnit: 'FOOD' });
    const form = wrapper.getForm();
    const tabs = form.getComponent('tabs');
    const hierComp = form.getComponent('crqConsumptionOccasionHierarchy');

    await expect(form.submit()).rejects.toBeTruthy();

    expect(hierComp.error).toBeTruthy();
    expect(hierComp.element.querySelectorAll('.formio-errors').length).toBe(1);
    expect(tabs.tabLinks[1].classList.contains(TAB_INVALID_CLASS)).toBe(true);
    expect(tabs.tabLinks[1].querySelector(`.${TAB_ERROR_ICON_CLASS}`)).not.toBeNull();
    expect(tabs.tabs[1].querySelector(`.${TAB_ERRORS_CLASS}`)).not.toBeNull();

    const units = ['HPC', 'FOOD', 'IC', 'FOOD', 'RUB', 'FOOD', 'HPC'];
    for (const unit of units) {
      await wrapper.setInputValue('businessUnit', unit);

      const errorNodes = hierComp.element.querySelectorAll('.formio-errors');
      const labelEl = hierComp.element.querySelector('label');
      expect(labelEl).not.toBeNull();

      expect(hierComp.tooltip).toBeTruthy();
      expect(labelEl.querySelector('i')).not.toBeNull();

      const descNodes = Array.from(hierComp.element.children).filter(
        node => node.classList.contains('help-block') && !node.classList.contains('formio-errors')
      );
      expect(descNodes.length).toBe(1);

      if (unit !== 'FOOD') {
        expect(hierComp.component.disabled).toBe(true);
        expect(hierComp.error).toBeFalsy();
        expect(errorNodes.length).toBe(0);
        expect(tabs.tabLinks[1].classList.contains(TAB_INVALID_CLASS)).toBe(false);
        expect(tabs.tabLinks[1].querySelector(`.${TAB_ERROR_ICON_CLASS}`)).toBeNull();
        expect(tabs.tabs[1].querySelector(`.${TAB_ERRORS_CLASS}`)).toBeNull();
      } else {
        expect(hierComp.component.disabled).toBe(false);
        expect(hierComp.error).toBeTruthy();
        expect(errorNodes.length).toBe(1);
        expect(Boolean(labelEl.compareDocumentPosition(errorNodes[0]) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
        expect(tabs.tabLinks[1].classList.contains(TAB_INVALID_CLASS)).toBe(true);
      }
    }
  });
});

describe('EMTC-652: AsyncData record watcher refreshes viewOnly tabs when status advances from draft', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('updates documentStatus and unhides MSO planing / Custom data / Capgemini tabs in viewOnly mode on watcher callback', async () => {
    let currentStatus = { status: 'uni-draft', disp: 'Draft' };
    let watcherCallback = null;

    const fakeBaseRecord = {
      id: 'emodel/uni-mdm-fg@fgc-17',
      getBaseRecord() {
        return this;
      },
      watch: jest.fn((atts, cb) => {
        watcherCallback = cb;
        return {
          getWatchedAttributes: () => ({ ...atts }),
          unwatch: jest.fn()
        };
      }),
      load: jest.fn(() => Promise.resolve({ ...currentStatus }))
    };

    const fakeAliasRecord = {
      id: 'emodel/uni-mdm-fg@fgc-17-alias-1',
      getBaseRecord: () => fakeBaseRecord,
      load: jest.fn(() => Promise.resolve({ ...currentStatus }))
    };

    jest.spyOn(Records, 'get').mockImplementation(id => {
      if (id === fakeAliasRecord.id) {
        return fakeAliasRecord;
      }
      return fakeBaseRecord;
    });

    const tabCond =
      'var status = (data.documentStatus || {}).status; show = status !== "uni-draft" && instance.options.formMode !== "CREATE";';
    const definition = {
      components: [
        {
          type: 'asyncData',
          key: 'documentStatus',
          input: true,
          update: { type: 'once', rate: 10 },
          executionCondition: 'const {root} = instance || {}; const {loading} = root || {}; value = loading === false;',
          source: {
            type: 'record',
            forceLoad: false,
            record: {
              id: '{{recordId}}',
              attributes: {
                status: '_status?str',
                disp: '_status?disp'
              }
            }
          }
        },
        {
          type: 'tabs',
          key: 'tabs0',
          input: false,
          persistent: false,
          components: [
            {
              label: 'Main Information',
              key: 'tabMain',
              components: [{ type: 'textfield', key: 'fgraProjectName', label: 'Project Name', input: true }]
            },
            {
              label: 'MSO planing',
              key: 'tabMso',
              components: [
                {
                  type: 'panel',
                  key: 'msoPlaningTab',
                  input: false,
                  customConditional: tabCond,
                  components: [{ type: 'textfield', key: 'fgraPlantGroupText', label: 'Plant Group', input: true }]
                }
              ]
            },
            {
              label: 'Custom data',
              key: 'tabCustom',
              components: [
                {
                  type: 'panel',
                  key: 'customDataTab',
                  input: false,
                  customConditional: tabCond,
                  components: [{ type: 'textfield', key: 'fgraOKPD2', label: 'OKPD2', input: true }]
                }
              ]
            },
            {
              label: 'Capgemini',
              key: 'tabCapgemini',
              components: [
                {
                  type: 'panel',
                  key: 'capgeminiTab',
                  input: false,
                  customConditional: tabCond,
                  components: [{ type: 'textfield', key: 'fgraCapField', label: 'Capgemini Field', input: true }]
                }
              ]
            }
          ]
        }
      ]
    };

    const wrapper = await TestForm.create(
      definition,
      {
        readOnly: true,
        viewAsHtml: true,
        formMode: 'VIEW',
        recordId: fakeAliasRecord.id,
        baseRecordId: fakeBaseRecord.id
      },
      { fgraProjectName: '6' }
    );
    const form = wrapper.getForm();
    const tabs = form.getComponent('tabs0');

    await new Promise(resolve => setTimeout(resolve, 650));

    expect(watcherCallback).toEqual(expect.any(Function));
    expect(form.data.documentStatus).toEqual({ status: 'uni-draft', disp: 'Draft' });
    expect(tabs.tabLinks[1].classList.contains('hidden')).toBe(true);
    expect(tabs.tabLinks[2].classList.contains('hidden')).toBe(true);
    expect(tabs.tabLinks[3].classList.contains('hidden')).toBe(true);

    // Simulate Record._innerUpdate notifying RecordWatcher once BPMN advances status to Data filling
    currentStatus = { status: 'uni-only-data-filling', disp: 'Data filling' };
    watcherCallback(currentStatus);

    await new Promise(resolve => setTimeout(resolve, 650));

    expect(form.data.documentStatus).toEqual({ status: 'uni-only-data-filling', disp: 'Data filling' });
    expect(tabs.tabLinks[1].classList.contains('hidden')).toBe(false);
    expect(tabs.tabLinks[2].classList.contains('hidden')).toBe(false);
    expect(tabs.tabLinks[3].classList.contains('hidden')).toBe(false);
  });
});

describe('EMTC-653: Base.prototype.evaluate avoids cloning full form on formMode substrings and caches compiled scripts', () => {
  it('preserves isolated clones when form/component identifiers are used while keeping multi-hundred-component checkConditions fast', async () => {
    const manyFields = Array.from({ length: 120 }, (_, i) => ({
      type: 'textfield',
      key: `field_${i}`,
      label: `Field ${i}`,
      input: true,
      customConditional: 'show = instance.options.formMode !== "CREATE" || data.projectName !== "hide_all";',
      logic: [
        {
          name: `req_${i}`,
          trigger: {
            type: 'javascript',
            javascript: 'result = instance.options.formMode !== "EDIT" && data.scenario === "LOCAL";'
          },
          actions: [
            {
              name: `act_${i}`,
              type: 'property',
              property: { label: 'Required', value: 'validate.required', type: 'boolean' },
              state: true
            }
          ]
        }
      ]
    }));

    const definition = {
      display: 'form',
      components: [
        { type: 'textfield', key: 'projectName', label: 'Project Name', input: true },
        { type: 'textfield', key: 'scenario', label: 'Scenario', input: true },
        ...manyFields
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, { projectName: 'init', scenario: 'LOCAL' });
    const form = wrapper.getForm();
    const projectComp = form.getComponent('projectName');

    // Mutation isolation when script explicitly references `form` or `component`
    const resForm = projectComp.evaluate('form.display = "mutated"; value = form.display;', {}, 'value');
    expect(resForm).toBe('mutated');
    expect(form._form.display).toBe('form');

    const resComp = projectComp.evaluate('component.label = "Mutated Label"; value = component.label;', {}, 'value');
    expect(resComp).toBe('Mutated Label');
    expect(projectComp.component.label).toBe('Project Name');

    // Warm up + measure 5 consecutive checkConditions passes across 120 logic+conditional components
    form.checkConditions(form.data);
    const start = Date.now();
    for (let k = 0; k < 5; k++) {
      form.data.projectName = `typed_${k}`;
      form.checkConditions(form.data);
    }
    const avgMs = (Date.now() - start) / 5;
    expect(avgMs).toBeLessThan(80);
  });
});

describe('EMTC-465: Validator.required enforces required when optionalWhenDisabled is explicitly false', () => {
  it('blocks empty disabled required component when optionalWhenDisabled is false while keeping optionalWhenDisabled=true optional', async () => {
    const definition = {
      display: 'form',
      components: [
        {
          type: 'textfield',
          key: 'crqTradeFormatHierarchy',
          label: 'Trade format hierarchy',
          input: true,
          disabled: true,
          optionalWhenDisabled: false,
          validate: { required: true }
        },
        {
          type: 'textfield',
          key: 'optionalDisabledField',
          label: 'Optional when disabled',
          input: true,
          disabled: true,
          optionalWhenDisabled: true,
          validate: { required: true }
        }
      ]
    };

    const wrapper = await TestForm.create(definition, { formMode: 'CREATE' }, {});
    const form = wrapper.getForm();
    const mandatoryComp = form.getComponent('crqTradeFormatHierarchy');
    const optionalComp = form.getComponent('optionalDisabledField');

    expect(optionalComp.checkValidity(form.data, true)).toBe(true);
    expect(mandatoryComp.checkValidity(form.data, true)).toBe(false);
    expect(mandatoryComp.error).toBeTruthy();
    expect(form.checkValidity(form.submission.data, true)).toBe(false);

    await mandatoryComp.setValue('hierarchy-ref-1');
    expect(mandatoryComp.checkValidity(form.data, true)).toBe(true);
    expect(form.checkValidity(form.submission.data, true)).toBe(true);
  });
});
