import RecordsQuerySource from './AsyncData.source.recordsQuery';
import RecordSource from './AsyncData.source.record';
import RecordsArraySource from './AsyncData.source.recordsArray';
import RecordsScriptSource from './AsyncData.source.recordsScript';
import AjaxSource from './AsyncData.source.ajax';
import CustomSource from './AsyncData.source.custom';
import { SourceTypes } from '../const';
import { t } from '../../../../../helpers/export/util';

export default [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'label',
    label: 'Label',
    placeholder: 'Field Label',
    tooltip: 'The label for this field that will appear next to it.',
    validate: {
      required: true
    }
  },
  {
    type: 'select',
    input: true,
    label: 'Data type:',
    key: 'source.type',
    dataSrc: 'values',
    defaultValue: SourceTypes.record,
    data: {
      values: [
        {
          get label() {
            return t('form-constructor.async.record');
          },
          value: SourceTypes.record
        },
        {
          get label() {
            return t('form-constructor.async.record.script');
          },
          value: SourceTypes.recordsScript
        },
        {
          get label() {
            return t('form-constructor.async.record.array');
          },
          value: SourceTypes.recordsArray
        },
        {
          get label() {
            return t('form-constructor.async.record.query');
          },
          value: SourceTypes.recordsQuery
        },
        {
          label: 'Ajax',
          value: SourceTypes.ajax
        },
        {
          get label() {
            return t('form-constructor.async.record.custom');
          },
          value: SourceTypes.custom
        }
      ]
    }
  },
  {
    type: 'checkbox',
    input: true,
    key: 'source.forceLoad',
    label: 'Force attributes loading, ignore Records cache',
    defaultValue: false,
    conditional: {
      json: {
        or: [
          { '==': [{ var: 'data.source.type' }, 'record'] },
          { '==': [{ var: 'data.source.type' }, 'recordsScript'] },
          { '==': [{ var: 'data.source.type' }, 'recordsArray'] }
        ]
      }
    }
  },
  {
    type: 'panel',
    collapsible: false,
    key: 'source.records.config-panel',
    components: RecordsQuerySource,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'recordsQuery'] }]
      }
    }
  },
  {
    type: 'panel',
    collapsible: false,
    key: 'source.recordsScript.config-panel',
    components: RecordsScriptSource,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'recordsScript'] }]
      }
    }
  },
  {
    type: 'panel',
    collapsible: false,
    key: 'source.record.config-panel',
    components: RecordSource,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'record'] }]
      }
    }
  },
  {
    type: 'panel',
    collapsible: false,
    key: 'source.recordsArray.config-panel',
    components: RecordsArraySource,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'recordsArray'] }]
      }
    }
  },
  {
    type: 'panel',
    collapsible: false,
    key: 'source.ajax.config-panel',
    components: AjaxSource,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'ajax'] }]
      }
    }
  },
  {
    type: 'panel',
    collapsible: false,
    key: 'source.custom.config-panel',
    components: CustomSource,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.type' }, 'custom'] }]
      }
    }
  }
];
