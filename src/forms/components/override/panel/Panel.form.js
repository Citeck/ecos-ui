import PanelEditDisplay from 'formiojs/components/panel/editForm/Panel.edit.display';

import baseEditForm from '../base/Base.form';

export default function (...extend) {
  return baseEditForm(
    [
      {
        key: 'display',
        components: [
          {
            type: 'mlText',
            key: 'title'
          },
          {
            weight: 30,
            type: 'select',
            input: true,
            label: 'Theme',
            key: 'theme',
            dataSrc: 'values',
            data: {
              values: [
                {
                  label: 'Default',
                  value: 'default'
                },
                {
                  label: 'Primary',
                  value: 'primary'
                },
                {
                  label: 'Info',
                  value: 'info'
                },
                {
                  label: 'Success',
                  value: 'success'
                },
                {
                  label: 'Danger',
                  value: 'danger'
                },
                {
                  label: 'Warning',
                  value: 'warning'
                },
                {
                  label: 'Transparent',
                  value: 'transparent'
                }
              ]
            }
          },
          ...PanelEditDisplay,
          {
            label: 'Scrollable content',
            labelPosition: 'left-left',
            type: 'checkbox',
            input: true,
            key: 'scrollableContent',
            weight: 655,
            defaultValue: false
          }
        ]
      },
      {
        key: 'data',
        components: [
          // Remove component with 'defaultValue' key. Cause: https://citeck.atlassian.net/browse/ECOSCOM-2637
          // In the defaultValue field, the contents of the panel were displayed, including descendants, which must be filled in.
          // When clicking on the "Save" button, validation was triggered, the form could not be submitted due to empty fields.
          { key: 'defaultValue', ignore: true }
        ]
      }
    ],
    ...extend
  );
}
