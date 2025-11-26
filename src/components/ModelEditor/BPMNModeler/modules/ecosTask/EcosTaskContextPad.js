import {
  ECOS_TASK_TYPE_SET_STATUS,
  ECOS_TASK_BASE_ELEMENT,
  DISABLE_SET_STATUS_ACTION_FOR_ELEMENTS, ECOS_TASK_TYPE_AI_TASK
} from "@/constants/bpmn";

export default class CustomContextPad {
  constructor(bpmnFactory, config, contextPad, create, elementFactory, injector, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    if (config.autoPlace !== false) {
      this.autoPlace = injector.get('autoPlace', false);
    }

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const { autoPlace, bpmnFactory, create, elementFactory, translate } = this;

    if (DISABLE_SET_STATUS_ACTION_FOR_ELEMENTS.includes(element.type)) {
      return {};
    }

    function appendEcosTask(taskType) {
      return function (event, element) {
        if (autoPlace) {
          const businessObject = bpmnFactory.create(ECOS_TASK_BASE_ELEMENT);
          businessObject.taskType = taskType;

          const shape = elementFactory.createShape({
            type: ECOS_TASK_BASE_ELEMENT,
            businessObject: businessObject
          });

          autoPlace.append(element, shape);
        } else {
          appendEcosTaskStart(event, element);
        }
      };
    }

    function appendEcosTaskStart(taskType) {
      return function (event) {
        const businessObject = bpmnFactory.create(ECOS_TASK_BASE_ELEMENT);
        businessObject.taskType = taskType;

        const shape = elementFactory.createShape({
          type: ECOS_TASK_BASE_ELEMENT,
          businessObject: businessObject
        });

        create.start(event, shape, element);
      };
    }

    return {
      'append.task-set-status': {
        group: 'model',
        className: 'bpmn-icon-set-status',
        title: translate('Append Set document status'),
        action: {
          click: appendEcosTask(ECOS_TASK_TYPE_SET_STATUS),
          dragstart: appendEcosTaskStart(ECOS_TASK_TYPE_SET_STATUS)
        }
      },
      'append.task-ai': {
        group: 'model',
        className: 'bpmn-icon-ai',
        title: translate('Append AI Task'),
        action: {
          click: appendEcosTaskStart(ECOS_TASK_TYPE_AI_TASK),
          dragstart: appendEcosTaskStart(ECOS_TASK_TYPE_AI_TASK)
        }
      }
    };
  }
}

CustomContextPad.$inject = ['bpmnFactory', 'config', 'contextPad', 'create', 'elementFactory', 'injector', 'translate'];
