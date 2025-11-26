const primary = getComputedStyle(document.documentElement).getPropertyValue('--colors-primary').trim();
const success = getComputedStyle(document.documentElement).getPropertyValue('--colors-success').trim();

export const BASE_HEIGHT = 21;
export const typeInternal = 'INTERNAL';

export const AllowedTagTypes = ['task', 'action'];

export const TagColorByType = {
  TASK: primary,
  ACTION: success
};
