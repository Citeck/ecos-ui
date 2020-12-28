export const compareAZ = (a, b) => {
  if (a.title.localeCompare) {
    return a.title.localeCompare(b.title);
  }
  if (a.title > b.title) {
    return 1;
  }
  if (a.title < b.title) {
    return -1;
  }
  return 0;
};
