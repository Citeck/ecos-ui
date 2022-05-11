import uniqueId from 'lodash/uniqueId';
import { t } from '../../../helpers/export/util';

export const Labels = {
  ZOOM_WINDOW: 'model-viewer.zoom.tip-window',
  ZOOM_ORIGINAL: 'model-viewer.zoom.tip-original',
  ZOOM_IN: 'model-viewer.zoom.tip-in',
  ZOOM_OUT: 'model-viewer.zoom.tip-out'
};

export const ScaleOptions = {
  FIT: 'fit-viewport',
  STEP: 0.1,
  DEFAULT: ''
};

export const getButtons = step =>
  [
    {
      icon: 'icon-filter-clean',
      zoom: ScaleOptions.DEFAULT,
      tip: t(Labels.ZOOM_ORIGINAL)
    },
    {
      icon: 'icon-resize-full-alt',
      zoom: ScaleOptions.FIT,
      tip: t(Labels.ZOOM_WINDOW)
    },
    {
      icon: 'icon-small-minus',
      zoom: -1 * step,
      tip: t(Labels.ZOOM_OUT)
    },
    {
      icon: 'icon-small-plus',
      zoom: 1 * step,
      tip: t(Labels.ZOOM_IN)
    }
  ].map(btn => ({
    ...btn,
    key: uniqueId('ecos-scale-btn-')
  }));
