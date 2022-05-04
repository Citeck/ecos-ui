export default [
  {
    type: 'checkbox',
    input: true,
    key: 'isSelectedValueAsText',
    label: 'Display selected value as a text. Default value is link',
    weight: 13,
    defaultValue: false,
    tooltip:
      'Value appears a link, if the value matches pattern "workspace://...". If the transition is different, provide recordRef in data'
  }
];
