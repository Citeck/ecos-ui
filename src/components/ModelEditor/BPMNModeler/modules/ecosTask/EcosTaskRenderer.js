import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { append as svgAppend, classes as svgClasses, create as svgCreate, remove as svgRemove, select as svgSelect } from 'tiny-svg';
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import TextUtil from 'diagram-js/lib/util/Text';
import { isNil } from 'min-dash';
import _ from 'lodash';

import Records from '../../../../../components/Records/Records';
import { ECOS_TASK_TYPE_SET_STATUS, ECOS_TASK_BASE_ELEMENT } from '../../../../../constants/bpmn';
import { t } from '../../../../../helpers/util';

const HIGH_PRIORITY = 1500;

const LABEL_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  color: '#444444'
};

export default class CustomRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {
    return is(element, ECOS_TASK_BASE_ELEMENT) && _.get(element, 'businessObject.taskType') === ECOS_TASK_TYPE_SET_STATUS;
  }

  drawShape(parentNode, element) {
    const rootProcces = this.getParentProccess(element).$parent;
    const type = this.getEcosType(rootProcces);

    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    const statusImage = svgCreate('image', {
      x: 5,
      y: 5,
      width: '20px',
      height: '20px',
      opacity: '0.8',
      href: '/bpmn-editor/images/change_status_icon.svg'
    });

    const statusName = this.getStatusName(element);

    if (!isNil(statusName) && _.isEmpty(this.getName(element))) {
      Records.get(type)
        .load('model.statuses[]{value:id,label:name}', false)
        .then(statuses => {
          if (!_.isEmpty(statuses)) {
            const label = statuses.find(field => field.value === statusName)['label'];
            const text = `${t('dashboard-settings.widget.doc-status')}: "${label}"`;

            this.renderLabel(parentNode, text, {
              align: 'center-middle',
              box: element,
              padding: 5
            });
          }
        });
    }

    svgAppend(parentNode, statusImage);

    return shape;
  }

  getParentProccess(element) {
    return getBusinessObject(element).$parent;
  }

  getName(element) {
    return getBusinessObject(element).name;
  }

  getStatusName(element) {
    return getBusinessObject(element).status;
  }

  getEcosType(element) {
    if (_.isString(element.$attrs['ecos:ecosType'])) {
      return element.$attrs['ecos:ecosType'];
    }

    return this.getEcosType(getBusinessObject(element).$parent);
  }

  renderLabel(parentGfx, label, options) {
    const textUtil = new TextUtil({
      style: LABEL_STYLE
    });

    const text = textUtil.createText(label || '', options);
    const textNode = svgSelect(parentGfx, 'text');

    svgRemove(textNode);
    svgClasses(text).add('djs-label');
    svgAppend(parentGfx, text);

    return text;
  }
}

CustomRenderer.$inject = ['eventBus', 'bpmnRenderer'];
