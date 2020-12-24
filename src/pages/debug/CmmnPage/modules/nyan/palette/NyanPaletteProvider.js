import PaletteProvider from 'cmmn-js/lib/features/palette/PaletteProvider';

import Cat from '../cat';

export default class NyanPaletteProvider extends PaletteProvider {
  constructor(create, elementFactory, globalConnect, handTool, lassoTool, palette, spaceTool, ...extra) {
    super(create, elementFactory, globalConnect, handTool, lassoTool, palette, spaceTool, extra);

    this._create = create;
    this._elementFactory = elementFactory;

    palette.registerProvider(this);

    console.warn({
      renderer: this,
      create,
      elementFactory,
      globalConnect,
      handTool,
      lassoTool,
      palette,
      spaceTool
    });
  }

  getPaletteEntries() {
    var elementFactory = this._elementFactory,
      create = this._create;

    function startCreate(event) {
      var serviceTaskShape = elementFactory.createShape({ type: 'cmmn:Task' });
      // var serviceTaskShape = elementFactory.createPlanItemShape('cmmn:Task');

      create.start(event, serviceTaskShape);
    }

    return {
      'create-service-task': {
        group: 'activity',
        title: 'Create a new nyan CAT!',
        imageUrl: Cat.dataURL,
        action: {
          dragstart: startCreate,
          click: startCreate
        }
      }
    };
  }
}

NyanPaletteProvider.$inject = ['create', 'elementFactory', 'globalConnect', 'handTool', 'lassoTool', 'palette', 'spaceTool'];
