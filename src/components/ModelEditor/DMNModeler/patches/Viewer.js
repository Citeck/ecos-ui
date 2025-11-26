import Viewer from 'dmn-js-drd/lib/Viewer';
import { wrapForCompatibility } from 'dmn-js-shared/lib/util/CompatibilityUtils';
import { query as domQuery } from 'min-dom';
import { innerSVG } from 'tiny-svg';

Viewer.prototype.saveSVG = wrapForCompatibility(function (layer, canvasSvg, bbox, options) {
  return new Promise(function (resolve, reject) {
    try {
      const contentNode = layer;
      const defsNode = domQuery('defs', canvasSvg);

      const contents = innerSVG(contentNode);
      const defs = defsNode ? '<defs>' + innerSVG(defsNode) + '</defs>' : '';

      const svg =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<!-- created with bpmn-js / http://bpmn.io -->\n' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
        'width="' +
        bbox.width +
        '" height="' +
        bbox.height +
        '" ' +
        'viewBox="' +
        bbox.x +
        ' ' +
        bbox.y +
        ' ' +
        bbox.width +
        ' ' +
        bbox.height +
        '" version="1.1">' +
        defs +
        contents +
        '</svg>';

      resolve({
        svg
      });
    } catch (error) {
      reject({ error, svg: null });
    }
  });
});
