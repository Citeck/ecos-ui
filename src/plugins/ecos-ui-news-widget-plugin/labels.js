/** IMPORTANT! Don't put ERROR_TYPES and Labels in 'constants' file. This will be the use before initialization! **/

export const ERROR_TYPES = {
  NO_GROUPABLE_COLUMNS: 'NO_GROUPABLE_COLUMNS'
};

const Labels = {
  Widget: {
    TITLE: 'charts-widget.title',
    NO_SOURCE_ERROR: 'charts-widget.no-source',

    DATA_BUILD_ERROR: 'charts-widget.data-build-error',

    SELECT_GRAPHIC_TYPE_AND_SOURCE: 'charts-widget.select-graphic-type-and-source',
    LEGEND_ITEM_DEFAULT_NAME: 'charts-widget.legend-item-default-name'
  },
  Settings: {
    SETTINGS_TITLE: 'charts-widget-settings.title',

    TITLE_FIELD: 'charts-widget-setting.label-field',
    GRAPHIC_TYPE_FIELD: 'charts-widget-setting.graphic-type-field',
    JOURNAL_FIELD: 'charts-widget-setting.journal-field',

    GROUP_BY_PARAMS_FIELD: 'charts-widget-setting.group-by-params-field',
    GROUP_BY_PARAMS_EMPTY_LIST: 'charts-widget-setting.group-by-params-empty-list',
    GROUP_BY_ADD: 'charts-widget-setting.group-by-add',

    AGGREGATION_PARAM_FIELD: 'charts-widget-setting.aggregation-param-field',
    TENSINE_PARAM_FIELD: 'charts-widget-setting.tensine-param-field',
    JOURNAL_PRESET_FIELD: 'charts-widget-setting.journal-preset-field',
    SELECT_AGGREGATION_PARAM_FIELD: 'charts-widget-setting.select-aggregation-param-field',
    DATE_FIELDS_PROHIBITED: 'charts-widget-setting.date-fields-prohibited',
    RECORDS_COUNT: 'charts-widget-setting.records-count',

    JOURNAL_SETTINGS_TITLE: 'charts-widget-settings.journal-settings-title',
    GRAPHIC_SETTINGS_TITLE: 'charts-widget-settings.graphic-settings-title',

    PIE_MIDDLE_RADIUS: 'charts-widget-settings.graphic-middle-radius',

    Y_MIN: 'charts-widget-settings.y-min',
    Y_MAX: 'charts-widget-settings.y-max',
    ASPECT_RATIO: 'charts-widget-settings.aspect-ratio',

    SETTINGS_BTN_CANCEL: 'dashlet.cancel.button',
    SETTINGS_BTN_SAVE: 'dashlet.submit.button'
  },
  Errors: {
    [ERROR_TYPES.NO_GROUPABLE_COLUMNS]: 'charts-widget.errors.no-groupable-columns'
  }
};

export default Labels;
