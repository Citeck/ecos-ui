import _ from 'lodash';
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { append as svgAppend } from 'tiny-svg';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import TextUtil from 'diagram-js/lib/util/Text';

import { TYPE_BPMN_TASK, LABEL_STYLE } from '../../../../../constants/bpmn';

const HIGH_PRIORITY = 1500;

export default class NumberRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    // only render tasks and events (ignore labels)
    return isAny(element, ['bpmn:Task', 'bpmn:Event']) && !element.labelTarget;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    const number = _.get(element, 'businessObject.$attrs["ecos:number"]');

    if (number) {
      this._drawNumber(parentNode, element, number, is(element, TYPE_BPMN_TASK) ? -15 : -10);
    }

    return shape;
  }

  _drawNumber(parentNode, element, number, padding = 0) {
    const textUtil = new TextUtil({
      style: LABEL_STYLE
    });

    const text = textUtil.createText(number, {
      align: 'left-top',
      box: element,
      padding: padding
    });

    svgAppend(parentNode, text);

    return parentNode;
  }
}
