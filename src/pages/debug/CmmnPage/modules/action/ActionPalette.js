import { createAction } from './utils';

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
      // const shape = elementFactory.createPlanItemShape('cmmn:Task');
      // const shape = elementFactory.createPlanItemShape('cmmn:Action');
      // const shape = elementFactory.createCmmnElement('shape', { type: 'cmmn:Action' });
      const shape = createAction(elementFactory, cmmnFactory);
      /*const shape = elementFactory.createShape({
        type: 'cmmn:Task',
        ecosType: 'action'
      });*/

      console.warn({ shape });

      create.start(event, shape);
    }

    return {
      'create.action': {
        group: 'custom',
        className: 'bpmn-icon-service-task',
        title: 'Create action',
        action: {
          dragstart: createServiceTask,
          click: createServiceTask
        }
      }
    };
  }
}

ActionPalette.$inject = ['create', 'elementFactory', 'palette', 'cmmnFactory'];
