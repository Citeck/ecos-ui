import inherits from 'inherits';
import ElementFactory from 'cmmn-js/lib/features/modeling/ElementFactory';

export default function CustomElementFactory(elementFactory, moddle) {
  const self = this;

  ElementFactory.call(this, elementFactory, moddle);

  this.createCmmnElement = function(elementType, attrs) {
    let type = attrs.type;
    console.warn('createCmmnElement', { elementType, attrs });

    if (elementType === 'custom') {
      // switch (attrs.type) {
      //   case 'cmmn:Action':
      //     return ElementFactory.prototype.create.call(this, 'shape', { ...attrs, type: 'cmmn:Task' });
      //   default:
      //     return ElementFactory.prototype.create.call(this, elementType, attrs);
      // }
    }

    return ElementFactory.prototype.createCmmnElement.call(this, elementType, attrs);
  };
}

// CustomElementFactory.prototype.create = function(elementType, attrs) {
//   if (elementType === 'custom') {
//     console.warn('CCUSTOOOOOOOOM');
//     return;
//   }
//
//   return ElementFactory.prototype.create.call(this, elementType, attrs);
// };

inherits(CustomElementFactory, ElementFactory);

CustomElementFactory.$inject = ['cmmnFactory', 'moddle'];

CustomElementFactory.prototype._getCustomElementSize = function(type) {
  const shapes = {
    __default: { width: 100, height: 80 },
    'custom:triangle': { width: 40, height: 40 },
    'custom:circle': { width: 140, height: 140 }
  };

  return shapes[type] || shapes.__default;
};
