export default class ActionPalette {
  constructor(create, elementFactory, palette) {
    this.create = create;
    this.elementFactory = elementFactory;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const { create, elementFactory } = this;

    function createServiceTask(event) {
      const shape = elementFactory.createShape({ type: 'cmmn:Task' });

      create.start(event, shape);
    }

    return {
      'create.action': {
        group: 'activity',
        className: 'cmmn-icon-bpmn-io',
        title: 'Create CUSTOM action',
        action: {
          dragstart: createServiceTask,
          click: createServiceTask
        }
      }
    };
  }
}

ActionPalette.$inject = ['create', 'elementFactory', 'palette'];
