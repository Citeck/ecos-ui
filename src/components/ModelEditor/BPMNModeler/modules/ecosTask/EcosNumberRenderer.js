import _ from 'lodash';
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { append as svgAppend } from 'tiny-svg';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import TextUtil from 'diagram-js/lib/util/Text';

import { TYPE_BPMN_TASK, PARTICIPANT_TYPE, LABEL_STYLE } from '../../../../../constants/bpmn';
import Records from '../../../../../components/Records/Records';

const HIGH_PRIORITY = 1600;

class NumberRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    // only render tasks and events (ignore labels)
    return isAny(element, ['bpmn:Task', 'bpmn:Event', 'bpmn:Participant', 'bpmn:CallActivity', 'bpmn:SubProcess']) && !element.labelTarget;
  }

  async drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);

    let number = _.get(element, 'businessObject.$attrs["ecos:number"]');

    if (number) {
      const section = await Records.get(_.get(element, 'recordRef')).load("sectionPath[]{code}|join('-')");

      let padding = is(element, TYPE_BPMN_TASK) ? -15 : -10;

      if (is(element, PARTICIPANT_TYPE)) {
        padding = -25;
      }

      if (is(element, 'bpmn:CallActivity' || is(element, 'bpmn:SubProcess'))) {
        padding = -20;
      }

      const parentNumber = _.get(element, 'parent.businessObject.$attrs["ecos:number"]');
      if (parentNumber) {
        number = `${parentNumber}-${number}`;
      }

      this._drawNumber(parentNode, element, section ? `${section}-${number}` : number, padding);
    }

    return shape;
  }

  _drawNumber(parentNode, element, number, padding = 0) {
    const textUtil = new TextUtil({
      style: {
        ...LABEL_STYLE,
        fontSize: is(element, 'bpmn:Event') ? '9px' : LABEL_STYLE.fontSize
      }
    });

    const text = textUtil.createText(number, {
      align: is(element, 'bpmn:Event') ? 'center-top' : 'left-top',
      box: element,
      padding: padding
    });

    svgAppend(parentNode, text);

    return parentNode;
  }
}

NumberRenderer.$inject = ['eventBus', 'bpmnRenderer'];

export default NumberRenderer;
