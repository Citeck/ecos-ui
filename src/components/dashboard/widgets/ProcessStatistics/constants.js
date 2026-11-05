export const EXTENDED_MODE = 'heatmap';
export const SIMPLIFIED_MODE = 'default';
export const KPI_MODE = 'kpi';

// Dashboards saved before ECOSUI-2876 use the constant names as persisted values.
// Preserve their selected mode when reading the configuration and saving settings.
export const normalizeFormMode = mode => {
  switch (mode) {
    case 'SIMPLIFIED_MODE':
    case SIMPLIFIED_MODE:
      return SIMPLIFIED_MODE;
    case 'KPI_MODE':
    case KPI_MODE:
      return KPI_MODE;
    default:
      return EXTENDED_MODE;
  }
};
