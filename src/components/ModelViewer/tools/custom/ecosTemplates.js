export function getPointTemplate(radius, blurFactor) {
  const tplCanvas = document.createElement('canvas');
  const tplCtx = tplCanvas.getContext('2d');
  const x = radius;
  const y = radius;

  tplCanvas.width = tplCanvas.height = radius * 2;

  if (blurFactor === 1) {
    tplCtx.beginPath();
    tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
    tplCtx.fillStyle = 'black';
    tplCtx.fill();
  } else {
    const gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius);

    gradient.addColorStop(0, 'black');
    gradient.addColorStop(1, 'transparent');

    tplCtx.fillStyle = gradient;
    tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
  }

  return tplCanvas;
}

/**
 *
 * @param {HM_Line} line
 * @param {number} width
 * @param {number} blur
 * @returns {HTMLCanvasElement}
 * @private
 */
export function getLineTemplate(line, width, blur) {
  const tplCanvas = document.createElement('canvas');
  const tplCtx = tplCanvas.getContext('2d');

  const Xs = line.map(p => p.x);
  const Ys = line.map(p => p.y);
  const x0 = Math.min(...Xs);
  const x1 = Math.max(...Xs);
  const y0 = Math.min(...Ys);
  const y1 = Math.max(...Ys);

  tplCanvas.width = Math.max(x1 - x0, width);
  tplCanvas.height = Math.max(y1 - y0, width);

  if (blur === 1) {
    const [head, ...linesTo] = line;

    tplCtx.moveTo(0, 0);

    Array.isArray(linesTo) && linesTo.forEach(point => tplCtx.lineTo(point.x - head.x, point.y - head.y));

    tplCtx.strokeStyle = 'black';
    tplCtx.lineWidth = width;
    tplCtx.stroke();
  } else {
    const head = line[0];
    for (let i = 1; i < line.length; i++) {
      const prev = line[i - 1];
      const cur = line[i];
      drawGradientLine(tplCtx, prev.x - head.x, prev.y - head.y, cur.x - head.x, cur.y - head.y, width);
    }
  }

  return tplCanvas;
}

function drawGradientLine(ctx, x1, y1, x2, y2, width) {
  const isVertical = x1 === x2;
  const w = isVertical ? width : x2 - x1;
  const h = isVertical ? y2 - y1 : width;
  const gradient = ctx.createLinearGradient(x1, y1, Math.abs(h), Math.abs(w));

  //todo a few point for long dist
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.5, 'black');
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.fillRect(x1, y1, w, h);
}
