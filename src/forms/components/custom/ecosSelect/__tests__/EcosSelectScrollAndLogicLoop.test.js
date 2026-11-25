import Records from '@citeck/records-core';
import { render, act } from '@testing-library/react';
import Formio from 'formiojs/Formio';
import React from 'react';

import EventEmitter from '@/forms/EventEmitter';
import '@/forms/components';
import ModalForm from '@/components/common/form/TableForm/components/ModalForm/ModalForm';
import { TableFormContext } from '@/components/common/form/TableForm/TableFormContext';
import { FORM_MODE_CREATE, FORM_MODE_EDIT } from '@/components/forms/EcosForm/constants';
import EcosSelectComponent from '../EcosSelect';
import Harness from '../../../../test/harness';

jest.mock('@/components/forms/EcosForm/EcosForm', () => () => <div data-testid="mock-ecos-form" />);
jest.mock(
  '@/components/common/EcosModal',
  () =>
    ({ title, isOpen, children }) =>
      isOpen ? (
        <div data-testid="mock-modal" data-title={title}>
          {children}
        </div>
      ) : null
);

describe('EMTC-795: EcosSelect scroll stability for non-paginated dataSrc', () => {
  it('does not trigger scrollLoading or re-render choices when scrolling a custom dataSrc dropdown to the bottom', async () => {
    const component = await Harness.testCreate(EcosSelectComponent, {
      key: 'salesOrganization',
      type: 'ecosSelect',
      dataSrc: 'custom',
      data: {
        custom: 'values = Array.from({ length: 20 }, function (_, i) { return { value: "so-" + i, label: "Sales Org " + i }; });'
      },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>'
    });

    component.updateItems('', true);
    expect(component.selectOptions).toHaveLength(20);

    const setChoicesSpy = jest.spyOn(component.choices, 'setChoices');
    const triggerUpdateSpy = jest.spyOn(component, 'triggerUpdate');

    Object.defineProperty(component.scrollList, 'scrollTop', { value: 100, writable: true, configurable: true });
    Object.defineProperty(component.scrollList, 'clientHeight', { value: 200, writable: true, configurable: true });
    Object.defineProperty(component.scrollList, 'scrollHeight', { value: 300, writable: true, configurable: true });

    component.onScroll();

    expect(component.scrollLoading).toBeFalsy();
    expect(setChoicesSpy).not.toHaveBeenCalled();
    expect(triggerUpdateSpy).not.toHaveBeenCalled();

    component.destroy(true);
  });
});

describe('EMTC-794: Clear-value-when-hidden logic on checkbox does not loop or overload events', () => {
  it('clears checked checkbox when hidden once and emits zero repeated componentChange/redraw events while hidden', async () => {
    const formDef = {
      components: [
        {
          type: 'textfield',
          key: 'requestKind',
          input: true
        },
        {
          type: 'checkbox',
          key: 'opso',
          input: true,
          defaultValue: false,
          clearOnHide: false,
          customConditional: 'show = data.requestKind == "discount";',
          logic: [
            {
              name: 'Clear value when hidden',
              trigger: {
                type: 'javascript',
                javascript: 'result = data.requestKind != "discount";'
              },
              actions: [
                {
                  name: 'Clear value when hidden',
                  type: 'value',
                  value: "value = '';"
                }
              ]
            }
          ]
        }
      ]
    };

    let overloadCount = 0;
    const opsoChanges = [];
    const emitter = new EventEmitter({
      wildcard: false,
      maxListeners: 0,
      loadLimit: 200,
      onOverload: () => {
        overloadCount++;
      }
    });
    const origEmit = emitter.emit.bind(emitter);
    emitter.emit = (...args) => {
      if (args[0] === 'formio.componentChange' && args[1]?.component?.key === 'opso') {
        opsoChanges.push(args[1].value);
      }
      return origEmit(...args);
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const form = await Formio.createForm(container, formDef, { events: emitter, formMode: 'CREATE' });

    const opso = form.getComponent('opso');
    const redrawSpy = jest.spyOn(opso, 'redraw');

    // First: make visible and check opso = true, then hide -> must clear once to false
    form.getComponent('requestKind').setValue('discount');
    form.checkData(form.data);
    opso.setValue(true);
    expect(opso.getValue()).toBe(true);

    opsoChanges.length = 0;
    redrawSpy.mockClear();

    form.getComponent('requestKind').setValue('price-list');
    form.checkData(form.data);
    expect(opso.getValue()).toBe(false);

    // Repeated checkData cycles while hidden must NOT re-trigger setValue or redraw
    opsoChanges.length = 0;
    redrawSpy.mockClear();
    for (let i = 0; i < 30; i++) {
      form.checkData(form.data);
    }

    expect(opsoChanges).toHaveLength(0);
    expect(redrawSpy).not.toHaveBeenCalled();
    expect(overloadCount).toBe(0);

    form.destroy();
    document.body.removeChild(container);
  });

  it('does not trigger event overload on real PDR ecosSelect/datetime/asyncData/checkbox schema (ZPR1, R005, validityFrom) through valid submit', async () => {
    const requestKindOptions = [
      { value: 'discount-creation', label: 'Заявка на создание скидки' },
      { value: 'discount-modification', label: 'Заявка на изменение скидки' },
      { value: 'discount-deletion', label: 'Заявка на удаление скидки' },
      { value: 'price-list-creation', label: 'Заявка на создание прейскуранта' }
    ];
    const getSpy = jest.spyOn(Records, 'get').mockImplementation(ref => ({
      load: jest.fn().mockImplementation(async attr => {
        if (attr === '#requestKind?options') {
          return requestKindOptions;
        }
        return null;
      }),
      id: ref
    }));
    const querySpy = jest.spyOn(Records, 'query').mockImplementation(async querySpec => {
      const ecosType = querySpec?.ecosType;
      if (ecosType === 'mdmref-pd-type-price') {
        return {
          records: [
            { value: 'emodel/mdmref-pd-type-price@mdmref-pd-type-price-zpr1', label: 'ZPR1' },
            { value: 'emodel/mdmref-pd-type-price@mdmref-pd-type-price-zucs', label: 'ZUCS' }
          ]
        };
      }
      if (ecosType === 'mdmref-pd-sales-organization') {
        return {
          records: [
            { value: 'emodel/mdmref-pd-sales-organization@mdmref-pd-sales-org-r005', label: 'R005' },
            { value: 'emodel/mdmref-pd-sales-organization@mdmref-pd-sales-org-r001', label: 'R001' }
          ]
        };
      }
      return { records: [] };
    });

    const pdrRealSchema = {
      components: [
        {
          type: 'ecosSelect',
          key: 'requestKind',
          input: true,
          clearOnHide: false,
          validate: { required: true },
          optionalWhenDisabled: true,
          dataSrc: 'url',
          valueProperty: 'value',
          template: '<span>{{ item.label }}</span>',
          filter: '',
          data: {
            url: '',
            values: [],
            json: '',
            resource: '',
            custom: '',
            headers: [{ key: '', value: '' }]
          }
        },
        {
          type: 'asyncData',
          key: 'conditionTypePrice_ad',
          label: 'Options for conditionTypePrice',
          input: true,
          persistent: 'client-only',
          update: { type: 'once' },
          source: {
            type: 'recordsQuery',
            forceLoad: false,
            recordsQuery: {
              query: 'value = { ecosType: "mdmref-pd-type-price", query: { t: "and", val: [] }, language: "predicate" };',
              attributes: { value: '?id', label: '?disp' },
              isSingle: false
            }
          }
        },
        {
          type: 'ecosSelect',
          key: 'conditionTypePrice',
          input: true,
          clearOnHide: false,
          conditional: { show: true, when: 'requestKind', eq: 'price-list-creation' },
          validate: { required: true },
          optionalWhenDisabled: true,
          dataSrc: 'custom',
          valueProperty: 'value',
          template: '<span>{{ item.label }}</span>',
          data: {
            custom:
              'var items = (data.conditionTypePrice_ad || {}).records || [];\nvar known = instance.currentItems || [];\nif (!items.length) { items = known; }\nvalues = items;'
          },
          searchEnabled: false,
          refreshOn: ['conditionTypePrice_ad']
        },
        {
          type: 'asyncData',
          key: 'salesOrganization_ad',
          label: 'Options for salesOrganization',
          input: true,
          persistent: 'client-only',
          update: { type: 'once' },
          source: {
            type: 'recordsQuery',
            forceLoad: false,
            recordsQuery: {
              query: 'value = { ecosType: "mdmref-pd-sales-organization", query: { t: "and", val: [] }, language: "predicate" };',
              attributes: { value: '?id', label: '?disp' },
              isSingle: false
            }
          }
        },
        {
          type: 'ecosSelect',
          key: 'salesOrganization',
          input: true,
          clearOnHide: false,
          customConditional:
            'var lid = function (v) { return typeof v === "string" ? v.split("@").pop() : v; };\nshow = data.requestKind != "price-list-creation" || lid(data.conditionTypePrice) != "mdmref-pd-type-price-zucs";',
          logic: [
            {
              name: 'mandatory',
              trigger: { type: 'javascript', javascript: 'result = !!data.requestKind;' },
              actions: [
                {
                  name: 'required',
                  type: 'property',
                  property: { type: 'boolean', value: 'validate.required' },
                  state: true
                }
              ]
            }
          ],
          optionalWhenDisabled: true,
          dataSrc: 'custom',
          valueProperty: 'value',
          template: '<span>{{ item.label }}</span>',
          data: {
            custom:
              'var items = (data.salesOrganization_ad || {}).records || [];\nvar known = instance.currentItems || [];\nif (!items.length) { items = known; }\nvalues = items;'
          },
          searchEnabled: false,
          refreshOn: ['salesOrganization_ad']
        },
        {
          type: 'ecosSelect',
          key: 'uploadingCondition',
          input: true,
          clearOnHide: false,
          disabled: true,
          optionalWhenDisabled: true,
          validate: { required: true },
          calculateValue:
            'value = (data.requestKind == "price-list-creation") ? "PriceList" : ([].concat(data.requestKind).some(function (v) { return ["discount-creation", "discount-modification", "discount-deletion"].indexOf(v) >= 0; })) ? "Discount" : null;',
          allowCalculateOverride: false,
          dataSrc: 'values',
          valueProperty: 'value',
          template: '<span>{{ item.label }}</span>',
          data: {
            values: [
              { value: 'PriceList', label: 'PriceList' },
              { value: 'Discount', label: 'Discount' }
            ]
          }
        },
        {
          type: 'datetime',
          key: 'validityFrom',
          input: true,
          clearOnHide: false,
          format: 'dd.MM.yyyy',
          enableDate: true,
          enableTime: false,
          validate: { required: true }
        },
        {
          type: 'checkbox',
          key: 'opso',
          input: true,
          defaultValue: false,
          clearOnHide: false,
          customConditional:
            'var lid = function (v) { return typeof v === "string" ? v.split("@").pop() : v; };\nshow = [].concat(data.requestKind).some(function (v) { return ["discount-creation", "discount-modification", "discount-deletion"].indexOf(v) >= 0; }) && [].concat(data.salesOrganization).map(lid).some(function (v) { return ["mdmref-pd-sales-org-r001", "mdmref-pd-sales-org-r003", "mdmref-pd-sales-org-u001"].indexOf(v) >= 0; });',
          logic: [
            {
              name: 'Clear value when hidden',
              trigger: {
                type: 'javascript',
                javascript:
                  'var lid = function (v) { return typeof v === "string" ? v.split("@").pop() : v; };\nresult = ![].concat(data.requestKind).some(function (v) { return ["discount-creation", "discount-modification", "discount-deletion"].indexOf(v) >= 0; }) || ![].concat(data.salesOrganization).map(lid).some(function (v) { return ["mdmref-pd-sales-org-r001", "mdmref-pd-sales-org-r003", "mdmref-pd-sales-org-u001"].indexOf(v) >= 0; });'
              },
              actions: [{ name: 'Clear value when hidden', type: 'value', value: 'value = false;' }]
            }
          ]
        },
        {
          type: 'checkbox',
          key: 'discountInmarkoTrade',
          input: true,
          defaultValue: false,
          clearOnHide: false,
          customConditional:
            'var lid = function (v) { return typeof v === "string" ? v.split("@").pop() : v; };\nshow = [].concat(data.requestKind).some(function (v) { return ["discount-creation", "discount-modification", "discount-deletion"].indexOf(v) >= 0; }) && (data.opso != true || ![].concat(data.salesOrganization).map(lid).some(function (v) { return ["mdmref-pd-sales-org-r001", "mdmref-pd-sales-org-r003", "mdmref-pd-sales-org-u001"].indexOf(v) >= 0; }));',
          logic: [
            {
              name: 'Clear value when hidden',
              trigger: {
                type: 'javascript',
                javascript:
                  'var lid = function (v) { return typeof v === "string" ? v.split("@").pop() : v; };\nresult = ![].concat(data.requestKind).some(function (v) { return ["discount-creation", "discount-modification", "discount-deletion"].indexOf(v) >= 0; }) || (data.opso == true && [].concat(data.salesOrganization).map(lid).some(function (v) { return ["mdmref-pd-sales-org-r001", "mdmref-pd-sales-org-r003", "mdmref-pd-sales-org-u001"].indexOf(v) >= 0; }));'
              },
              actions: [{ name: 'Clear value when hidden', type: 'value', value: "value = '';" }]
            }
          ]
        },
        {
          type: 'button',
          key: 'submit',
          action: 'submit',
          input: true,
          disableOnInvalid: true
        }
      ]
    };

    let overloadCount = 0;
    const emitter = new EventEmitter({
      wildcard: false,
      maxListeners: 0,
      loadLimit: 200,
      onOverload: () => {
        overloadCount++;
      }
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    let form;
    try {
      form = await Formio.createForm(container, pdrRealSchema, {
        events: emitter,
        formMode: 'CREATE',
        recordId: 'emodel/uni-mdm-pdr@'
      });
      // Trigger url/options loader on requestKind (production dataSrc:'url' with empty url) and let asyncData loaders settle
      form.getComponent('requestKind').updateItems('', true);
      await new Promise(resolve => setTimeout(resolve, 30));
      expect(getSpy).toHaveBeenCalledWith('emodel/uni-mdm-pdr@');
      expect(form.getComponent('requestKind').selectOptions.length).toBeGreaterThanOrEqual(4);
      form.checkData(form.data);

      // Step 1: Select price-list-creation, ZPR1, R005, validityFrom (exact EMTC-794 sequence)
      form.getComponent('requestKind').setValue('price-list-creation');
      form.checkData(form.data);
      form.getComponent('conditionTypePrice').setValue('emodel/mdmref-pd-type-price@mdmref-pd-type-price-zpr1');
      form.checkData(form.data);
      form.getComponent('salesOrganization').setValue('emodel/mdmref-pd-sales-organization@mdmref-pd-sales-org-r005');
      form.checkData(form.data);
      form.getComponent('validityFrom').setValue('2026-11-23T00:00:00.000Z');
      form.checkData(form.data);

      // Step 2: Switch to discount-creation with R001, enable opso & discountInmarkoTrade, then switch back
      form.getComponent('requestKind').setValue('discount-creation');
      form.getComponent('salesOrganization').setValue('emodel/mdmref-pd-sales-organization@mdmref-pd-sales-org-r001');
      form.checkData(form.data);
      form.getComponent('opso').setValue(true);
      form.getComponent('discountInmarkoTrade').setValue(true);
      form.checkData(form.data);

      form.getComponent('requestKind').setValue('price-list-creation');
      form.getComponent('conditionTypePrice').setValue('emodel/mdmref-pd-type-price@mdmref-pd-type-price-zpr1');
      form.getComponent('salesOrganization').setValue('emodel/mdmref-pd-sales-organization@mdmref-pd-sales-org-r005');
      for (let i = 0; i < 20; i++) {
        form.checkData(form.data);
      }

      // Step 3: Validate & execute real form.submit()
      let submittedData = null;
      form.on('submit', submission => {
        submittedData = submission.data;
      });
      await form.submit();

      expect(submittedData).not.toBeNull();
      expect(submittedData.requestKind).toBe('price-list-creation');
      expect(submittedData.conditionTypePrice).toBe('emodel/mdmref-pd-type-price@mdmref-pd-type-price-zpr1');
      expect(submittedData.salesOrganization).toBe('emodel/mdmref-pd-sales-organization@mdmref-pd-sales-org-r005');
      expect(submittedData.uploadingCondition).toBe('PriceList');
      expect(submittedData.opso).toBe(false);
      expect(submittedData.discountInmarkoTrade).toBe(false);
      expect(overloadCount).toBe(0);
    } finally {
      getSpy.mockRestore();
      querySpy.mockRestore();
      if (form) form.destroy();
      document.body.removeChild(container);
    }
  });
});

describe('EMTC-757 / EMTC-761: TableForm ModalForm create title', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes createVariant label in create modal title instead of bare Create', () => {
    const { getByTestId } = render(
      <TableFormContext.Provider
        value={{
          record: null,
          clonedRecord: null,
          createVariant: {
            label: 'List Materials Create',
            sourceId: 'emodel/uni-mdm-nfg-nfgr-list-materials-create',
            typeRef: 'emodel/type@uni-mdm-nfg-nfgr-list-materials-create'
          },
          formMode: FORM_MODE_CREATE,
          isViewOnlyForm: false,
          isModalFormOpen: true,
          toggleModal: jest.fn(),
          onCreateFormSubmit: jest.fn(),
          onEditFormSubmit: jest.fn(),
          controlProps: {
            isStaticModalTitle: false,
            customStringForConcatWithStaticTitle: ''
          },
          computed: {},
          rowPosition: null
        }}
      >
        <ModalForm />
      </TableFormContext.Provider>
    );

    expect(getByTestId('mock-modal').getAttribute('data-title')).toContain(': List Materials Create');
  });

  it('loads typeRef display name when createVariant has no inline label', async () => {
    jest.spyOn(Records, 'get').mockReturnValue({
      load: jest.fn().mockResolvedValue('Single Modification/Solman request number')
    });

    const { getByTestId } = render(
      <TableFormContext.Provider
        value={{
          record: null,
          clonedRecord: null,
          createVariant: {
            sourceId: 'emodel/uni-mdm-material-change-mdmmcrq-solman-numbers',
            typeRef: 'emodel/type@uni-mdm-material-change-mdmmcrq-solman-numbers'
          },
          formMode: FORM_MODE_CREATE,
          isViewOnlyForm: false,
          isModalFormOpen: true,
          toggleModal: jest.fn(),
          onCreateFormSubmit: jest.fn(),
          onEditFormSubmit: jest.fn(),
          controlProps: {
            isStaticModalTitle: false,
            customStringForConcatWithStaticTitle: ''
          },
          computed: {},
          rowPosition: null
        }}
      >
        <ModalForm />
      </TableFormContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('mock-modal').getAttribute('data-title')).toContain(': Single Modification/Solman request number');
  });

  it('normalizes localized createVariant name object with getMLValue instead of [object Object]', () => {
    const { getByTestId } = render(
      <TableFormContext.Provider
        value={{
          record: null,
          clonedRecord: null,
          createVariant: {
            name: { ru: 'Материалы', en: 'Materials' },
            sourceId: 'emodel/uni-mdm-nfg-nfgr-list-materials-create',
            typeRef: 'emodel/type@uni-mdm-nfg-nfgr-list-materials-create'
          },
          formMode: FORM_MODE_CREATE,
          isViewOnlyForm: false,
          isModalFormOpen: true,
          toggleModal: jest.fn(),
          onCreateFormSubmit: jest.fn(),
          onEditFormSubmit: jest.fn(),
          controlProps: {
            isStaticModalTitle: false,
            customStringForConcatWithStaticTitle: ''
          },
          computed: {},
          rowPosition: null
        }}
      >
        <ModalForm />
      </TableFormContext.Provider>
    );

    const renderedTitle = getByTestId('mock-modal').getAttribute('data-title');
    expect(renderedTitle).not.toContain('[object Object]');
    expect(renderedTitle).toMatch(/: (Materials|Материалы)$/);
  });

  it('ignores stale create typeRef lookup when modal switches to edit mode and clears title on rejection', async () => {
    let resolveCreateType;
    let resolveEditRecord;
    const createTypePromise = new Promise(resolve => {
      resolveCreateType = resolve;
    });
    const editRecordPromise = new Promise(resolve => {
      resolveEditRecord = resolve;
    });

    jest.spyOn(Records, 'get').mockImplementation(ref => {
      if (ref === 'emodel/type@uni-mdm-nfg-nfgr-list-materials-create') {
        return { load: jest.fn().mockReturnValue(createTypePromise) };
      }
      if (ref === 'emodel/uni-mdm-nfg-nfgr-list-materials-create@row-1') {
        return { load: jest.fn().mockReturnValue(editRecordPromise) };
      }
      return { load: jest.fn().mockRejectedValue(new Error('network error')) };
    });

    const baseContext = {
      clonedRecord: null,
      isViewOnlyForm: false,
      isModalFormOpen: true,
      toggleModal: jest.fn(),
      onCreateFormSubmit: jest.fn(),
      onEditFormSubmit: jest.fn(),
      controlProps: {
        isStaticModalTitle: false,
        customStringForConcatWithStaticTitle: ''
      },
      computed: {},
      rowPosition: 0
    };

    const { getByTestId, rerender } = render(
      <TableFormContext.Provider
        value={{
          ...baseContext,
          record: null,
          createVariant: {
            name: {},
            sourceId: 'emodel/uni-mdm-nfg-nfgr-list-materials-create',
            typeRef: 'emodel/type@uni-mdm-nfg-nfgr-list-materials-create'
          },
          formMode: FORM_MODE_CREATE
        }}
      >
        <ModalForm />
      </TableFormContext.Provider>
    );

    // Switch same mounted ModalForm to Edit before the slow create type lookup settles.
    rerender(
      <TableFormContext.Provider
        value={{
          ...baseContext,
          record: 'emodel/uni-mdm-nfg-nfgr-list-materials-create@row-1',
          createVariant: null,
          formMode: FORM_MODE_EDIT
        }}
      >
        <ModalForm />
      </TableFormContext.Provider>
    );

    await act(async () => {
      resolveEditRecord('Текущая строка');
      await Promise.resolve();
    });
    expect(getByTestId('mock-modal').getAttribute('data-title')).toContain(': Текущая строка');

    // Now the stale create lookup finishes late and MUST NOT overwrite the edit title.
    await act(async () => {
      resolveCreateType('Прежний тип строки');
      await Promise.resolve();
    });
    expect(getByTestId('mock-modal').getAttribute('data-title')).toContain(': Текущая строка');
    expect(getByTestId('mock-modal').getAttribute('data-title')).not.toContain('Прежний тип строки');

    // Switching to a failing create typeRef clears stale title and handles rejection gracefully.
    rerender(
      <TableFormContext.Provider
        value={{
          ...baseContext,
          record: null,
          createVariant: {
            sourceId: 'emodel/broken',
            typeRef: 'emodel/type@broken'
          },
          formMode: FORM_MODE_CREATE
        }}
      >
        <ModalForm />
      </TableFormContext.Provider>
    );
    expect(getByTestId('mock-modal').getAttribute('data-title')).not.toContain('Текущая строка');

    await act(async () => {
      await Promise.resolve();
    });
    expect(getByTestId('mock-modal').getAttribute('data-title')).not.toContain(':');
  });

  it('keeps record display name in edit mode', async () => {
    jest.spyOn(Records, 'get').mockReturnValue({
      load: jest.fn().mockResolvedValue('EXT-001')
    });

    const { getByTestId } = render(
      <TableFormContext.Provider
        value={{
          record: 'emodel/uni-mdm-nfg-nfgr-list-materials-create@row-1',
          clonedRecord: null,
          createVariant: null,
          formMode: FORM_MODE_EDIT,
          isViewOnlyForm: false,
          isModalFormOpen: true,
          toggleModal: jest.fn(),
          onCreateFormSubmit: jest.fn(),
          onEditFormSubmit: jest.fn(),
          controlProps: {
            isStaticModalTitle: false,
            customStringForConcatWithStaticTitle: ''
          },
          computed: {},
          rowPosition: 0
        }}
      >
        <ModalForm />
      </TableFormContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('mock-modal').getAttribute('data-title')).toContain(': EXT-001');
  });
});
