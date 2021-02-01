import { GROUP_CUSTOM } from '../../../../constants/cmmn';

function createAction(elementFactory, cmmnFactory) {
  return elementFactory.createShape({
    type: 'cmmn:PlanItem',
    businessObject: (function() {
      const definitionRef = cmmnFactory.create('cmmn:Task', {
        'ecos:cmmnType': 'Action'
      });

      return cmmnFactory.create('cmmn:PlanItem', { definitionRef });
    })()
  });
}

export default class ActionPalette {
  constructor(create, elementFactory, palette, cmmnFactory) {
    this.create = create;
    this.elementFactory = elementFactory;
    this.cmmnFactory = cmmnFactory;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const { create, elementFactory, cmmnFactory } = this;

    function createServiceTask(event) {
      const shape = createAction(elementFactory, cmmnFactory);
      create.start(event, shape);
    }

    return {
      'create.action': {
        group: GROUP_CUSTOM,
        className: 'bpmn-icon-service-task',
        title: 'Create Action',
        action: {
          dragstart: createServiceTask,
          click: createServiceTask
        }
      }
    };
  }
}

ActionPalette.$inject = ['create', 'elementFactory', 'palette', 'cmmnFactory'];
