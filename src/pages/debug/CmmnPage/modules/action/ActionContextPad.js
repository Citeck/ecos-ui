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

    function appendAction(event, element) {
      console.warn({ autoPlace });
      if (autoPlace) {
        const businessObject = elementFactory.create('cmmn:Task');
        console.warn('appendServiceTask => ', { elementFactory, businessObject });
        const shape = elementFactory.createShape({ type: 'cmmn:Task' });

        autoPlace.append(element, shape);
      } else {
        appendActionStart(event, element);
      }
    }

    function appendActionStart(event, businessObject) {
      console.warn('appendServiceTaskStart => ', { elementFactory });
      // const shape = elementFactory.createShape({ type: 'cmmn:Task' });
      const shape = elementFactory.createPlanItemShape('cmmn:Task');
      // const shape = elementFactory.createCmmnElement('shape', {
      //   type: 'cmmn:Task',
      //   businessObject
      // });
      // const test = elementFactory.create('root', { type: 'cmmn:Task' });

      // const shape = elementFactory.createShape({
      //   type: 'cmmn:Task',
      //   businessObject: businessObject
      // });

      console.warn({ businessObject, shape });

      create.start(event, shape, element);
    }

    return {
      'append.action': {
        group: 'model',
        className: 'cmmn-icon-bpmn-io',
        title: 'Append CUSTOM action',
        action: {
          click: appendAction,
          dragstart: appendActionStart
        }
      }
    };
  }
}

ActionContextPad.$inject = ['config', 'contextPad', 'create', 'elementFactory', 'injector'];
