export default class ActionPalette {
  constructor(create, elementFactory, palette) {
    this.create = create;
    this.elementFactory = elementFactory;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const { create, elementFactory } = this;

    function createServiceTask(event) {
      // const shape = elementFactory.createPlanItemShape('cmmn:Task');
      // const shape = elementFactory.createPlanItemShape('cmmn:Action');
      // const shape = elementFactory.createCmmnElement('shape', { type: 'cmmn:Action' });
      // const shape = elementFactory.createShape({ type: 'cmmn:Task' });
      const shape = elementFactory.createShape({ type: 'cmmn:Action' });

      console.warn({ shape });

      create.start(event, shape);
    }

    return {
      'create.action': {
        group: 'custom',
        className: 'cmmn-icon-bpmn-io',
        title: 'Create action',
        action: {
          dragstart: createServiceTask,
          click: createServiceTask
        }
      }
    };
  }
}

ActionPalette.$inject = ['create', 'elementFactory', 'palette'];
