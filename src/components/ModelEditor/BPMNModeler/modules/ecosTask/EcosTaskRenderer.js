import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import TextUtil from 'diagram-js/lib/util/Text';
import _ from 'lodash';
import { isNil } from 'min-dash';
import { append as svgAppend, classes as svgClasses, create as svgCreate, remove as svgRemove, select as svgSelect } from 'tiny-svg';

import KPIRenderer from './EcosKPIRenderer';

import Records from '@/components/Records/Records';
import {
  ECOS_TASK_BASE_ELEMENT,
  SUBPROCESS_TYPE,
  BPMN_TASK_TYPES,
  LABEL_STYLE,
  STATUS_CHANGE_ICON_PATH, ECOS_TASK_TYPES, ECOS_TASK_TYPE_SET_STATUS, ECOS_TASK_TYPE_AI_TASK, AI_ICON_PATH
} from "@/constants/bpmn";
import { t } from '@/helpers/util';

const HIGH_PRIORITY = 1500;

class CustomRenderer extends KPIRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  getEcosTaskTypes(element) {
    const taskType = _.get(element, 'businessObject.taskType');

    if (taskType && ECOS_TASK_TYPES.includes(taskType)) {
      return taskType;
    }

    return null;
  }

  canRender(element) {
    if (BPMN_TASK_TYPES.includes(element.type)) {
      return false;
    }

    const ecosTaskType = this.getEcosTaskTypes(element);
    return is(element, ECOS_TASK_BASE_ELEMENT) && ECOS_TASK_TYPES.includes(ecosTaskType);
  }

  _getImage(path) {
    return svgCreate('path', {
      d: path,
      opacity: '0.8',
      stroke: 'none',
      fill: 'black'
    });
  }

  async drawShape(parentNode, element) {
    let shape = await super.drawShape(parentNode, element); // draw numbers
    if (!this.canRender(element)) {
      return;
    }

    shape = this.bpmnRenderer.drawShape(parentNode, element);

    const ecosTaskType = this.getEcosTaskTypes(element);
    switch (ecosTaskType) {
      case ECOS_TASK_TYPE_SET_STATUS: {
        svgAppend(parentNode, this._getImage(STATUS_CHANGE_ICON_PATH));

        const rootProcces = this.getRootProccess(element);
        const statusName = this.getStatusName(element);

        if (!isNil(statusName) && _.isEmpty(this.getName(element)) && rootProcces) {
          const ecosType = this.getEcosType(rootProcces);

          Records.get(ecosType)
            .load('model.statuses[]{value:id,label:name}', false)
            .then(statuses => {
              if (!_.isEmpty(statuses)) {
                const status = statuses.find(field => field.value === statusName);

                if (status) {
                  const text = `${t('dashboard-settings.widget.doc-status')}: "${status.label || ''}"`;

                  parentNode &&
                  this.renderLabel(parentNode, text, {
                    align: 'center-middle',
                    box: element,
                    padding: 5
                  });
                }
              }
            });
        }
        return;
      }
      case ECOS_TASK_TYPE_AI_TASK: {
        svgAppend(parentNode, this._getImage(AI_ICON_PATH));
      }
    }

    return shape;
  }

  getRootProccess(element) {
    const parent = this.getParentProccess(element);

    return _.get(parent, '$parent');
  }

  getParentProccess(element) {
    if (_.get(element, 'parent.type') === SUBPROCESS_TYPE) {
      return _.get(getBusinessObject(element.parent), '$parent');
    }

    return _.get(getBusinessObject(element), '$parent');
  }

  getName(element) {
    return getBusinessObject(element).name;
  }

  getStatusName(element) {
    return getBusinessObject(element).status;
  }

  getEcosType(element) {
    if (element && _.isString(element.$attrs['ecos:ecosType'])) {
      return element.$attrs['ecos:ecosType'];
    }

    const parent = this.getRootProccess(element);
    return this.getEcosType(parent);
  }

  renderLabel(parentGfx, label, options) {
    const textUtil = new TextUtil({
      style: LABEL_STYLE
    });

    const text = textUtil.createText(label, options);
    const textNode = svgSelect(parentGfx, 'text');

    textNode && svgRemove(textNode);
    svgClasses(text).add('djs-label');
    svgAppend(parentGfx, text);

    return text;
  }
}

CustomRenderer.$inject = ['eventBus', 'bpmnRenderer'];

export default CustomRenderer;
