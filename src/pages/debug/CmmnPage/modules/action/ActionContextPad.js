export default class ActionContextPad {
  constructor(config, contextPad, create, elementFactory, injector) {
    this.create = create;
    this.elementFactory = elementFactory;

    if (config.autoPlace !== false) {
      this.autoPlace = injector.get('autoPlace', false);
    }

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const { autoPlace, create, elementFactory } = this;

    function appendServiceTask(event, element) {
      if (autoPlace) {
        const shape = elementFactory.createShape({ type: 'cmmn:Task' });

        autoPlace.append(element, shape);
      } else {
        appendServiceTaskStart(event, element);
      }
    }

    function appendServiceTaskStart(event) {
      const shape = elementFactory.createShape({ type: 'cmmn:Task' });

      create.start(event, shape, element);
    }

    return {
      'append.action': {
        group: 'model',
        className: 'cmmn-icon-bpmn-io',
        title: 'Append CUSTOM action',
        action: {
          click: appendServiceTask,
          dragstart: appendServiceTaskStart
        }
      }
    };
  }
}

ActionContextPad.$inject = ['config', 'contextPad', 'create', 'elementFactory', 'injector'];
