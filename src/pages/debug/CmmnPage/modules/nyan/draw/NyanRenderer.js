import CmmnRenderer from 'cmmn-js/lib/draw/CmmnRenderer';
import { is } from 'cmmn-js/lib/util/ModelUtil';
import { append as svgAppend, create as svgCreate } from 'tiny-svg';

import Cat from '../cat';

export default class NyanRenderer extends CmmnRenderer {
  constructor(eventBus, cmmnRenderer) {
    super(eventBus, 1500);

    this.cmmnRenderer = cmmnRenderer;

    console.warn({ self: this, renderer: CmmnRenderer.prototype.renderer });
  }

  canRender(element) {
    console.warn('can render => ', is(element, 'cmmn:Task'), element);
    return is(element, 'cmmn:Task');
  }

  drawShape(parent, shape) {
    var url = Cat.dataURL;

    var catGfx = svgCreate('image', {
      x: 0,
      y: 0,
      width: shape.width,
      height: shape.height,
      href: url
    });

    svgAppend(parent, catGfx);

    return catGfx;
  }
}

// export default function NyanRender(eventBus, moddle) {
//   console.warn({ eventBus, moddle });
//   // CmmnRenderer.call(this, eventBus, 1500);
//   CmmnRenderer.call(this, eventBus);
//
//   const typeMap = moddle.registry.typeMap;
//
//   if (!typeMap['cmmn:Action'] && typeMap['cmmn:Task']) {
//     typeMap['cmmn:Action'] = typeMap['cmmn:Task'];
//   }
//
//   this.canRender = function(element) {
//     return is(element, 'cmmn:Task');
//   };
//
//
//   this.drawShape = function(parent, shape) {
//     var url = Cat.dataURL;
//
//     var catGfx = svgCreate('image', {
//       x: 0,
//       y: 0,
//       width: shape.width,
//       height: shape.height,
//       href: url
//     });
//
//     svgAppend(parent, catGfx);
//
//     return catGfx;
//   };
// }

// inherits(NyanRender, CmmnRenderer);

NyanRenderer.$inject = ['eventBus', 'cmmnRenderer'];
