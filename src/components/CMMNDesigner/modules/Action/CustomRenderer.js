import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';
import TextUtil from 'diagram-js/lib/util/Text';
import { append as svgAppend, attr as svgAttr, classes as svgClasses, create as svgCreate } from 'tiny-svg';
import { getName } from 'cmmn-js/lib/util/ModelUtil';

import { getEcosType } from '../../utils';
import actionTypes from './action-types.json';

import 'bpmn-font/dist/css/bpmn.css';

const HIGH_PRIORITY = 1500;
const TASK_BORDER_RADIUS = 10;
const LABEL_STYLE = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '12px'
};
const DEFAULT_TYPES_TO_RENDER = ['Action'];

export default class CustomRenderer extends BaseRenderer {
  constructor(eventBus, cmmnRenderer) {
    super(eventBus, HIGH_PRIORITY);
    this.cmmnRenderer = cmmnRenderer;
    this._actionTypesToRender = [...DEFAULT_TYPES_TO_RENDER, ...actionTypes.map(type => type.id)];
  }

  canRender(element) {
    return this._actionTypesToRender.indexOf(getEcosType(element)) !== -1;
  }

  drawShape(parentNode, element, attrs) {
    const rect = drawRect(parentNode, element.width, element.height, TASK_BORDER_RADIUS, attrs);
    const ecosType = getEcosType(element);

    renderLabel(parentNode, ecosType, { box: element, align: 'left-top', padding: 5 });
    renderEmbeddedLabel(parentNode, element, 'center-middle');
    //attachTaskMarkers(p, element);
    return rect;
  }

  getShapePath(shape) {
    return this.cmmnRenderer.getShapePath(shape);
  }
}

CustomRenderer.$inject = ['eventBus', 'cmmnRenderer'];

// helpers //////////

const textUtil = new TextUtil({
  style: LABEL_STYLE,
  size: { width: 100 }
});

function renderLabel(parentGfx, label, options) {
  const text = textUtil.createText(label || '', options);

  svgClasses(text).add('djs-label');
  svgAppend(parentGfx, text);

  return text;
}

function renderEmbeddedLabel(p, box, align) {
  const name = getName(box);

  return renderLabel(p, name, { box, align, padding: 5 });
}

// copied from https://github.com/bpmn-io/bpmn-js/blob/master/lib/draw/BpmnRenderer.js
function drawRect(parentNode, width, height, borderRadius, strokeColor) {
  const rect = svgCreate('rect');

  svgAttr(rect, {
    width,
    height,
    rx: borderRadius,
    ry: borderRadius,
    stroke: strokeColor || '#000',
    strokeWidth: 2,
    fill: '#fff'
  });

  svgAppend(parentNode, rect);

  return rect;
}

// copied from https://github.com/bpmn-io/diagram-js/blob/master/lib/core/GraphicsFactory.js
function prependTo(newNode, parentNode, siblingNode) {
  parentNode.insertBefore(newNode, siblingNode || parentNode.firstChild);
}
