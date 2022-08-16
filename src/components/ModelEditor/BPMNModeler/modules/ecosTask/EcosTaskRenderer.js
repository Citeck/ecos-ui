import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { ECOS_TASK_TYPE_SET_STATUS, ECOS_TASK_BASE_ELEMENT } from '../../../../../constants/bpmn';

import { append as svgAppend, attr as svgAttr, classes as svgClasses, create as svgCreate } from 'tiny-svg';

import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { isNil } from 'min-dash';

import _ from 'lodash';

const HIGH_PRIORITY = 1500;

export default class CustomRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    return is(element, ECOS_TASK_BASE_ELEMENT) && _.get(element, 'businessObject.taskType') === ECOS_TASK_TYPE_SET_STATUS;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);

    const statusName = this.getStatusName(element);

    if (!isNil(statusName)) {
      var text = svgCreate('text');

      svgAttr(text, {
        fill: '#077683',
        transform: 'translate(-10, -10)'
      });

      svgClasses(text).add('djs-label');

      svgAppend(text, document.createTextNode(statusName));

      svgAppend(parentNode, text);
    }

    return shape;
  }

  getStatusName(element) {
    return getBusinessObject(element).status;
  }
}

CustomRenderer.$inject = ['eventBus', 'bpmnRenderer'];
