import { EventEmitter2 } from 'eventemitter2';

export const popupEmitter = new EventEmitter2();

export const Events = {
  SHOW: 'ecos-popover-show',
  HIDE: 'ecos-popover-hide'
};
