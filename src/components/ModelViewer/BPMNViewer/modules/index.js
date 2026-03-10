import { onlyRenderer } from '../../../ModelEditor/BPMNModeler/modules';

export const withoutDragging = {
  dragging: [
    'value',
    {
      init: function() {}
    }
  ]
};

export const withoutCanvasScroll = {
  zoomScroll: ['value', null]
};

export default [onlyRenderer, withoutDragging, withoutCanvasScroll];
