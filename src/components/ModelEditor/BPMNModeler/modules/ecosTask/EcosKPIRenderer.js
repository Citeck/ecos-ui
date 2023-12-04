import _ from 'lodash';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { append as svgAppend, attr as svgAttr, create as svgCreate, classes as svgClasses } from 'tiny-svg';
// import { is } from 'bpmn-js/lib/util/ModelUtil';
import TextUtil from 'diagram-js/lib/util/Text';

import { LABEL_STYLE } from '../../../../../constants/bpmn';
import NumberRenderer from './EcosNumberRenderer';

const HIGH_PRIORITY = 1700;

class KPIRenderer extends NumberRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    // only render tasks and events (ignore labels)
    return isAny(element, ['bpmn:Task']) && !element.labelTarget;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    const activity = _.get(element, 'id');

    if (activity === 'Activity_0gj8byg') {
      const timerRect = this.drawRect(parentNode, 75, 20, 8, '#000');
      const percentRect = this.drawRect(parentNode, 45, 20, 8, '#000');

      svgAttr(timerRect, {
        transform: 'translate(-10, 85)'
      });

      svgAttr(percentRect, {
        transform: 'translate(70, 85)'
      });

      this._drawKPITimer(parentNode, '1ч 30мин');
      this._drawKPIPercentage(parentNode, '50%');
    }

    if (activity === 'Activity_14kiu06') {
      const timerRect = this.drawRect(parentNode, 55, 20, 8, '#000');
      const percentRect = this.drawRect(parentNode, 65, 20, 8, '#000');

      svgAttr(timerRect, {
        transform: 'translate(-10, 85)'
      });

      svgAttr(percentRect, {
        transform: 'translate(70, 85)'
      });

      this._drawKPITimer(parentNode, '6ч');
      this._drawKPIPercentage(parentNode, '-18,5%');
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
