import get from 'lodash/get';

import { JOURNAL_MIN_HEIGHT, JOURNAL_MIN_HEIGHT_MOB } from '../Journals/constants';

export const getMinHeight = isMobile => (isMobile ? JOURNAL_MIN_HEIGHT_MOB : JOURNAL_MIN_HEIGHT);

export const getMaxHeight = (isMobile, _headerRef, _footerRef) => {
  const headH = (_headerRef && get(_headerRef.getBoundingClientRect?.(), 'bottom')) || 0;
  const jFooterH = (_footerRef && get(_footerRef, 'offsetHeight')) || 0;
  const footerH = get(document.querySelector('.app-footer'), 'offsetHeight') || 0;
  const scrollHeight = get(document.querySelector('.ecos-kanban__scroll_h'), 'offsetHeight') || 0;
  const height = document.documentElement.clientHeight - headH - jFooterH - footerH - scrollHeight - 48;

  const minHeight = getMinHeight(isMobile);
  return Math.max(height, minHeight);
};
