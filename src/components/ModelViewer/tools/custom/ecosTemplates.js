export const _getPointTemplate = function(radius, blurFactor) {
  const tplCanvas = document.createElement('canvas');
  const tplCtx = tplCanvas.getContext('2d');
  const x = radius;
  const y = radius;

  tplCanvas.width = tplCanvas.height = radius * 2;

  if (blurFactor === 1) {
    tplCtx.beginPath();
    tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
    tplCtx.fillStyle = 'rgba(0,0,0,1)';
    tplCtx.fill();
  } else {
    const gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius);

    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    tplCtx.fillStyle = gradient;
    tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
  }

  return tplCanvas;
};

/**
 *
 * @param {HM_Line} line
 * @param radius
 * @param blurFactor
 * @returns {HTMLCanvasElement}
 * @private
 */
export const _getLineTemplate = (line, radius, blurFactor) => {
  const tplCanvas = document.createElement('canvas');
  const tplCtx = tplCanvas.getContext('2d');

  const lineWidth = 10;
  const Xs = line.map(p => p.x);
  const Ys = line.map(p => p.y);
  const x0 = Math.min(...Xs);
  const x1 = Math.max(...Xs);
  const y0 = Math.min(...Ys);
  const y1 = Math.max(...Ys);

  tplCanvas.width = Math.max(x1 - x0, lineWidth);
  tplCanvas.height = Math.max(y1 - y0, lineWidth);

  const [moveTo, ...linesTo] = line;
  tplCtx.moveTo(0, 0);

  Array.isArray(linesTo) && linesTo.forEach(point => tplCtx.lineTo(point.x - moveTo.x, point.y - moveTo.y));

  if (blurFactor === 1) {
    tplCtx.strokeStyle = 'rgba(0,0,0,1)';
  } /* else {
    const gradient = tplCtx.createLinearGradient(x0, y0, lineWidth, y0+100);

    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    tplCtx.strokeStyle = gradient;
  }*/
  tplCtx.lineWidth = lineWidth;
  tplCtx.stroke();
  return tplCanvas;
};
