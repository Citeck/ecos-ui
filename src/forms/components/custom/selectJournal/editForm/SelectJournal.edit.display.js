import { DisplayModes } from '@/forms/components/custom/selectJournal/constants';

export default [
  {
    type: 'checkbox',
    input: true,
    key: 'hideCreateButton',
    label: 'Hide "Create" button',
    weight: 10,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'hideEditRowButton',
    label: 'Hide "Edit row" button',
    weight: 11,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'hideDeleteRowButton',
    label: 'Hide "Delete row" button',
    weight: 12,
    defaultValue: false
  },
  {
    type: 'checkbox',
    input: true,
    key: 'isSelectedValueAsText',
    label: 'Display selected value as a text. Default value is link',
    weight: 13,
    defaultValue: false,
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.source.viewMode' }, DisplayModes.DEFAULT] }]
      }
    }
  },
  {
    type: 'radio',
    input: true,
    key: 'openNewBrowserTab',
    label: 'Open selected record',
    weight: 14,
    values: [
      { label: 'Default', value: '' },
      { label: 'New browser tab', value: true },
      { label: 'Inside application', value: false }
    ]
  },
  {
    key: 'reorder',
    ignore: true
  }
];
