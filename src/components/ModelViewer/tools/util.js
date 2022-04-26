export const getTaskShapePoints = (x, y, w, h, value) => {
  return [
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 1) / 4)),
      y: Math.round(Math.abs(y) + Math.floor((h * 1) / 4)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 1) / 2)),
      y: Math.round(Math.abs(y) + Math.floor((h * 1) / 4)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 3) / 4)),
      y: Math.round(Math.abs(y) + Math.floor((h * 1) / 4)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 1) / 4)),
      y: Math.round(Math.abs(y) + Math.floor((h * 1) / 2)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 1) / 2)),
      y: Math.round(Math.abs(y) + Math.floor((h * 1) / 2)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 3) / 4)),
      y: Math.round(Math.abs(y) + Math.floor((h * 1) / 2)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 1) / 4)),
      y: Math.round(Math.abs(y) + Math.floor((h * 3) / 4)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 1) / 2)),
      y: Math.round(Math.abs(y) + Math.floor((h * 3) / 4)),
      value
    },
    {
      x: Math.round(Math.abs(x) + Math.floor((w * 3) / 4)),
      y: Math.round(Math.abs(y) + Math.floor((h * 3) / 4)),
      value
    }
  ];
};

export const getUnknownShapePoints = (x, y, w, h, value) => {
  return [
    {
      x: Math.round(Math.abs(x) + Math.floor(w / 2)),
      y: Math.round(Math.abs(y) + Math.floor(h / 2)),
      value
    }
  ];
};

// export const getWayShapePoints = (x, y, w, h, value) => {
//   return [
//     {
//       x: Math.abs(X - item.x),
//       y: Math.abs(item.y),
//       value: 0
//     }
//   ];
// };

export const getLegendNum = (num, isMax) => {
  const str = `${num}`;

  if (!isMax || +num === 0 || num % 10 === 0) {
    return num;
  }

  if (str.length === 1) {
    if (isMax) {
      return 10;
    }
  } else {
    if (num % 10 > 0) {
      // eslint-disable-line
      return +`${parseInt(num / 10) + 1}0`; // eslint-disable-line
    }
  }
};
