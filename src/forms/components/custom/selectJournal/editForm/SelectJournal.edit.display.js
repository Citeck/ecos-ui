import { DisplayModes } from '../constants';

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
  }
];
