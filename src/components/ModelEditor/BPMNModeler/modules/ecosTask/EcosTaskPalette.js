import {
  ECOS_TASK_TYPE_SET_STATUS,
  ECOS_TASK_BASE_ELEMENT,
  ECOS_TASK_TYPE_AI_TASK
} from "@/constants/bpmn";

export default class CustomPalette {
  constructor(bpmnFactory, create, elementFactory, palette, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const { bpmnFactory, create, elementFactory, translate } = this;

    function createEcosTask(taskType) {
      return function (event) {
        const businessObject = bpmnFactory.create(ECOS_TASK_BASE_ELEMENT);
        businessObject.taskType = taskType;

        const shape = elementFactory.createShape({
          type: ECOS_TASK_BASE_ELEMENT,
          businessObject: businessObject
        });

        create.start(event, shape);
      };
    }

    return {
      'create.task-set-status': {
        group: 'activity',
        className: 'bpmn-icon-set-status',
        title: translate('Set document status'),
        action: {
          dragstart: createEcosTask(ECOS_TASK_TYPE_SET_STATUS),
          click: createEcosTask(ECOS_TASK_TYPE_SET_STATUS)
        }
      },
      'create.task-ai': {
        group: 'activity',
        className: 'bpmn-icon-ai',
        title: translate('AI Task'),
        action: {
          dragstart: createEcosTask(ECOS_TASK_TYPE_AI_TASK),
          click: createEcosTask(ECOS_TASK_TYPE_AI_TASK)
        }
      }
    };
  }
}

CustomPalette.$inject = ['bpmnFactory', 'create', 'elementFactory', 'palette', 'translate'];
