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
