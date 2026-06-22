import { onlyRenderer } from '@/components/editors/ModelEditor/BPMNModeler/modules';

export const withoutDragging = {
  dragging: [
    'value',
    {
      init: function() {}
    }
  ]
};

export default [onlyRenderer, withoutDragging];
