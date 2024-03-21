import { ViewModes } from '../../../../../components/common/form/SelectOrgstruct/constants';

export default [
  {
    type: 'checkbox',
    input: true,
    key: 'isSelectedValueAsText',
    label: 'Display selected value as a text. Default value is link',
    weight: 13,
    defaultValue: false
  },
  {
    type: 'select',
    input: true,
    key: 'viewModeType',
    label: {
      ru: 'Выберите тип отображения',
      en: 'Select the display type'
    },
    weight: 12,
    data: {
      values: [
        {
          value: ViewModes.DEFAULT,
          label: {
            ru: 'Стандартный',
            en: 'Default'
          },
        },
        {
          value: ViewModes.LINE_SEPARATED,
          label: {
            ru: 'Разделённый линией',
            en: 'Line separated'
          },
        },
        {
          value: ViewModes.TAGS,
          label: {
            ru: 'Тэги',
            en: 'Tags'
          },
        }
      ]
    },
    defaultValue: ViewModes.DEFAULT
  }
];
