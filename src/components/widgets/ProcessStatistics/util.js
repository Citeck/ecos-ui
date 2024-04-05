export const DefSets = {
  OPACITY: 0.5,
  HEIGHT: 400
};

export const Labels = {
  WG_SIMPLIFIED_TITLE: 'process-statistics-widget.simplified-title',
  WG_EXTENDED_TITLE: 'process-statistics-widget.extended-title',
  FORM_MODE_SELECT_LABEL: 'process-statistics-widget.form-condition.label',
  FORM_MODE_EXTENDED: 'process-statistics-widget.form-condition.extended',
  FORM_MODE_SIMPLIFIED: 'process-statistics-widget.form-condition.simplified',
  FORM_MODE_KPI: 'process-statistics-widget.form-condition.kpi',
  NO_COLS: 'process-statistics-widget.info.no-columns',
  NO_MODEL: 'process-statistics-widget.info.no-model',
  ERR_MODEL: 'process-statistics-widget.info.mount-problem',
  SETTINGS_TITLE: 'process-statistics-widget.settings.title',
  SETTINGS_DEFAULT_FLAGS: 'process-statistics-widget.settings.default-turn-on',
  SETTINGS_BADGES_VALUES_MODE: 'process-statistics-widget.settings.badges.label',
  SETTINGS_BTN_CANCEL: 'process-statistics-widget.settings.btn.cancel',
  SETTINGS_BTN_SAVE: 'process-statistics-widget.settings.btn.save',
  JOURNAL_FIELD: 'process-statistics-widget.settings.field.journal',
  DEF_HEATMAP_FIELD: 'process-statistics-widget.settings.field.display-tools-default',
  DEF_MODEL_FIELD: 'process-statistics-widget.settings.field.display-model-default',
  DEF_JOURNAL_FIELD: 'process-statistics-widget.settings.field.display-journal-default',
  PANEL_HEATMAP: 'process-statistics-widget.panel.heatmap',
  PANEL_COUNTERS: 'process-statistics-widget.panel.counters',
  PANEL_OPACITY: 'process-statistics-widget.panel.opacity',
  PANEL_ACTIVE_COUNT: 'process-statistics-widget.panel.active-count',
  PANEL_COMPLETED_COUNT: 'process-statistics-widget.panel.completed-count',
  MODEL_TITLE: 'process-statistics-widget.model.title',
  JOURNAL_TITLE: 'process-statistics-widget.journal.title',
  JOURNAL_RESET_FILTER: 'process-statistics-widget.journal.reset-filter'
};

const getCount = (flag, value) => (flag && value) || 0;

export const getPreparedHeatItem = (item, flags) => {
  return {
    id: item.id,
    value: getCount(flags.isActiveCount, item.activeCount) + getCount(flags.isCompletedCount, item.completedCount)
  };
};

export const getPreparedKPIItem = item => {
  const kpiPercent = parseFloat(item.kpiDeviation);

  if (kpiPercent > 100) {
    item.kpiDeviation = 100;
  }

  if (kpiPercent < -100) {
    item.kpiDeviation = -100;
  }

  return {
    id: item.displayKpiOnBpmnActivityId,
    value: kpiPercent
  };
};
