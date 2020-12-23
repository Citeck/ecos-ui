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
      const shape = elementFactory.createPlanItemShape('cmmn:Task');

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
