/**
 * @param args
 * @returns {string}
 */
export function getFitnesseClassName(...args) {
  args = args.filter(item => !!item);

  const postfix = args.pop();
  const parts = [args.join('-'), postfix].filter(item => !!item);

  return `fitnesse-${parts.join('__')}`.toLowerCase();
}

export function getFitnesseInlineToolsClassName(actionId) {
  const classNames = [`fitnesse-inline-tools-actions-btn__${actionId}`];

  if (actionId === 'view') {
    classNames.push('fitnesse-inline-tools-actions-btn__on');
  }

  return classNames.join(' ');
}
