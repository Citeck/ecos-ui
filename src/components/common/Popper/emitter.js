import { EventEmitter } from 'events';

export const popupEmitter = new EventEmitter();

export const Events = {
  SHOW: 'ecos-popover-show',
  HIDE: 'ecos-popover-hide'
};
