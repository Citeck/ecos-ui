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
 * @param {number} radius
 * @param {number} blur
 * @returns {HTMLCanvasElement}
 * @private
 */
export function getLineTemplate(line, radius, blur) {
  const tplCanvas = document.createElement('canvas');
  const tplCtx = tplCanvas.getContext('2d');

  tplCanvas.width = window.innerWidth;
  tplCanvas.height = window.innerHeight;

  if (blur === 1) {
    const [head, ...linesTo] = line;
    const indentation = radius / 2;

    tplCtx.moveTo(indentation, indentation);
    Array.isArray(linesTo) && linesTo.forEach(point => tplCtx.lineTo(point.x - head.x + indentation, point.y - head.y + indentation));

    tplCtx.strokeStyle = 'black';
    tplCtx.lineWidth = radius;
    tplCtx.stroke();
  } else {
    const head = line[0];
    for (let i = 1; i < line.length; i++) {
      const prev = line[i - 1];
      const cur = line[i];

      drawGradientLine(tplCtx, prev.x - head.x, prev.y - head.y, cur.x - head.x, cur.y - head.y, radius);
    }
  }

  return tplCanvas;
}

function drawGradientLine(ctx, x1, y1, x2, y2, radius) {
  const isVertical = x1 === x2;
  const width = isVertical ? y2 - y1 : x2 - x1;
  const gradient = ctx.createLinearGradient(y1, 0, y2, radius);

  //todo: add a few points for long dist
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.5, 'black');
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  if (isVertical) {
    //todo: vertical lines (translate + rotate)
  }

  ctx.fillRect(x1, y1, Math.abs(width), radius);
}
