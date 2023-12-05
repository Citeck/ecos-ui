import _ from 'lodash';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { append as svgAppend, attr as svgAttr, create as svgCreate, classes as svgClasses } from 'tiny-svg';

import NumberRenderer from './EcosNumberRenderer';

const HIGH_PRIORITY = 1700;

class KPIRenderer extends NumberRenderer {
  KPI_DATA_MOCK = [
    {
      id: 'Activity_0gj8byg',
      time: '1ч 30мин',
      completedCount: '50'
    },
    {
      id: 'Activity_14kiu06',
      time: '4ч',
      completedCount: '-18,75'
    },
    {
      id: 'Activity_1s1qza0',
      time: '1ч',
      completedCount: '20'
    },
    {
      id: 'Activity_0lqviz0',
      time: '1д',
      completedCount: '-21,25'
    },
    {
      id: 'Activity_1rjuk4l',
      time: '2д',
      completedCount: '144,2708333'
    }
  ];

  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    return isAny(element, ['bpmn:Task']) && !element.labelTarget;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    const activity = _.get(element, 'id');

    const KPI = this.KPI_DATA_MOCK.find(i => i.id === activity);

    if (KPI) {
      const timerRect = this.drawRect(parentNode, 75, 20, 8, '#000');
      const percentRect = this.drawRect(parentNode, 45, 20, 8, '#000');

      svgAttr(timerRect, {
        transform: 'translate(-10, 85)'
      });
      svgAttr(percentRect, {
        transform: 'translate(70, 85)'
      });

      this._drawKPITimer(parentNode, KPI.time);
      this._drawKPIPercentage(parentNode, `${parseInt(KPI.completedCount)}%`);
    }

    return shape;
  }

  _drawKPITimer(parentNode, value) {
    const text = svgCreate('text');

    svgAttr(text, {
      fill: '#000',
      transform: 'translate(-5, 100)'
    });

    svgClasses(text).add('djs-label');
    svgAppend(text, document.createTextNode(value));
    svgAppend(parentNode, text);
  }

  _drawKPIPercentage(parentNode, value) {
    const text = svgCreate('text');

    svgAttr(text, {
      fill: '#000',
      transform: 'translate(75, 100)'
    });

    svgClasses(text).add('djs-label');
    svgAppend(text, document.createTextNode(value));
    svgAppend(parentNode, text);
  }

  drawRect(parentNode, width, height, borderRadius, strokeColor) {
    const rect = svgCreate('rect');

    svgAttr(rect, {
      width,
      height,
      rx: borderRadius,
      ry: borderRadius,
      stroke: strokeColor || '#000',
      strokeWidth: 2,
      fill: '#fff'
    });

    svgAppend(parentNode, rect);

    return rect;
  }
}

KPIRenderer.$inject = ['eventBus', 'bpmnRenderer'];

export default KPIRenderer;
