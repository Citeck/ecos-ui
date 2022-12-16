import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import { append as svgAppend, classes as svgClasses, create as svgCreate, remove as svgRemove, select as svgSelect } from 'tiny-svg';
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import TextUtil from 'diagram-js/lib/util/Text';
import { isNil } from 'min-dash';
import _ from 'lodash';

import Records from '../../../../../components/Records/Records';
import { ECOS_TASK_TYPE_SET_STATUS, ECOS_TASK_BASE_ELEMENT, PARTICIPANT_TYPE } from '../../../../../constants/bpmn';
import { t } from '../../../../../helpers/util';

const HIGH_PRIORITY = 1500;

const LABEL_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px',
  lineHeight: '1.2',
  color: '#444444'
};

const STATUS_CHANGE_ICON_PATH =
  'm22 2zm-5 4.67c0 0 0 4.66 0 4.66 0 0 2.39-2.27 2.39-2.27 0 0 .94.94 .94.94 0 0-4 4-4 4 0 0-4-4-4-4 0 0 .95-.94.95-.94 0 0 2.39 2.27 2.39 2.27 0 0 0-4.66 0-4.66 0-.37-.3-.67-.67-.67 0 0-8 0-8 0-.37 0-.67.3-.67.67 0 0 0 7.33 0 7.33 0 0-1.33 0-1.33 0 0 0 0-7.33 0-7.33 0-1.11.9-2 2-2 0 0 8 0 8 0 1.1 0 2 .89 2 2 0 0 0 0 0 0zm-.67 15.33c-1.84 0-3.33-1.49-3.33-3.33 0-1.84 1.49-3.34 3.33-3.34 1.84 0 3.34 1.5 3.34 3.34-.01 1.84-1.5 3.33-3.34 3.33 0 0 0 0 0 0zm0-5.33c-1.1 0-2 .89-2 2 0 1.1.9 2 2 2 1.11 0 2-.9 2-2 0-1.11-.89-2-2-2 0 0 0 0 0 0zm-10.66 5.33c-1.84 0-3.34-1.49-3.34-3.33 0-1.84 1.5-3.34 3.34-3.34 1.84 0 3.33 1.5 3.33 3.34 0 1.84-1.49 3.33-3.33 3.33 0 0 0 0 0 0zm0-5.33c-1.11 0-2 .89-2 2 0 1.1.89 2 2 2 1.1 0 2-.9 2-2 0-1.11-.9-2-2-2 0 0 0 0 0 0z';

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

    const statusImage = svgCreate('path', {
      d: STATUS_CHANGE_ICON_PATH,
      opacity: '0.8',
      stroke: 'none',
      fill: 'black'
    });

    svgAppend(parentNode, statusImage);

    if (is(element, ECOS_TASK_BASE_ELEMENT)) {
      const rootProcces = this.getRootProccess(element);
      const statusName = this.getStatusName(element);

      if (!isNil(statusName) && _.isEmpty(this.getName(element))) {
        Records.get(this.getEcosType(rootProcces))
          .load('model.statuses[]{value:id,label:name}', false)
          .then(statuses => {
            if (!_.isEmpty(statuses)) {
              const status = statuses.find(field => field.value === statusName);

              if (status) {
                const text = `${t('dashboard-settings.widget.doc-status')}: "${status.label || ''}"`;

                this.renderLabel(parentNode, text, {
                  align: 'center-middle',
                  box: element,
                  padding: 5
                });
              }
            }
          });
      }

      return shape;
    }
  }

  getRootProccess(element) {
    const parent = this.getParentProccess(element);

    if (element.parent) {
      return _.get(element.parent, 'parent');
    }

    return _.get(parent, '$parent', getBusinessObject(element));
  }

  getParentProccess(element) {
    return _.get(getBusinessObject(element), '$parent');
  }

  getName(element) {
    return getBusinessObject(element).name;
  }

  getStatusName(element) {
    return getBusinessObject(element).status;
  }

  getEcosType(element) {
    if (element.type === PARTICIPANT_TYPE) {
      return _.get(getBusinessObject(element), '$attrs["ecos:ecosType"]');
    }

    if (_.isString(element.$attrs['ecos:ecosType'])) {
      return element.$attrs['ecos:ecosType'];
    }

    return this.getEcosType(this.getRootProccess(element));
  }

  renderLabel(parentGfx, label, options) {
    const textUtil = new TextUtil({
      style: LABEL_STYLE
    });

    const text = textUtil.createText(label, options);
    const textNode = svgSelect(parentGfx, 'text');

    svgRemove(textNode);
    svgClasses(text).add('djs-label');
    svgAppend(parentGfx, text);

    return text;
  }
}

CustomRenderer.$inject = ['eventBus', 'bpmnRenderer'];
