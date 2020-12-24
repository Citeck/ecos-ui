import inherits from 'inherits';
import CmmnRenderer from 'cmmn-js/lib/draw/CmmnRenderer';
import { is } from 'cmmn-js/lib/util/ModelUtil';

// const originDrawShape = CmmnRenderer.prototype.drawShape;
//
// CmmnRenderer.prototype.drawShape = function(parent, element) {
//   let type = element.type;
//
//   console.warn('drawShape => ', { element })
//
//   return originDrawShape.call(this, parent, element);
//
//   // if (type === 'cmmn:Action') {
//   //   type = 'cmmn:Task';
//   // }
//   //
//   // const h = handlers[type];
//   //
//   // console.warn({ handlers })
//   //
//   // if (!h) {
//   //   return BaseRenderer.prototype.drawShape.apply(this, [ parent, element ]);
//   // } else {
//   //   return h(parent, element);
//   // }
// };

export default function CustomRenderer(eventBus, styles) {
  CmmnRenderer.call(this, eventBus, 2000);

  // this.canRender = function(element) {
  //   return is(element, 'bpmn:ServiceTask');
  // };

  this.drawShape = function(parent, element) {
    console.warn('DRAW SHAPE => ', { parent, element });

    return CmmnRenderer.prototype.drawShape.call(this, parent, element);
  };
}

inherits(CustomRenderer, CmmnRenderer);

CustomRenderer.$inject = ['eventBus', 'styles'];

console.warn({ CustomRenderer });

CustomRenderer.prototype.canRender = function(element) {
  console.warn('canRenderer => ', { element });

  return CmmnRenderer.prototype.canRender.call(this, element);

  // return /^custom:/.test(element.type);
};

CustomRenderer.prototype.drawShape = function(p, element) {
  console.warn('drawShape => ', { p, element });

  return CmmnRenderer.prototype.drawShape.call(this, p, element);

  // var type = element.type;
  //
  // if (type === 'custom:triangle') {
  //   return this.drawTriangle(p, element.width);
  // }
  //
  // if (type === 'custom:circle') {
  //   return this.drawCircle(p, element.width, element.height);
  // }
};

CustomRenderer.prototype.getShapePath = function(shape) {
  console.warn('getShapePath => ', { shape });

  return CmmnRenderer.prototype.getShapePath.call(this, shape);

  // var type = shape.type;
  //
  // if (type === 'custom:triangle') {
  //   return this.getTrianglePath(shape);
  // }
  //
  // if (type === 'custom:circle') {
  //   return this.getCirclePath(shape);
  // }
};

CustomRenderer.prototype.drawConnection = function(p, element) {
  console.warn('drawConnection => ', { p, element });

  return CmmnRenderer.prototype.drawConnection.call(this, p, element);

  // var type = element.type;
  //
  // if (type === 'custom:connection') {
  //   return this.drawCustomConnection(p, element);
  // }
};

CustomRenderer.prototype.getConnectionPath = function(connection) {
  console.warn('getConnectionPath => ', { connection });

  return CmmnRenderer.prototype.getConnectionPath.call(this, connection);

  // var type = connection.type;
  //
  // if (type === 'custom:connection') {
  //   return this.getCustomConnectionPath(connection);
  // }
};
