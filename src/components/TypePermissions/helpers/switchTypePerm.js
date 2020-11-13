import { TYPE_PERM_NONE, TYPE_PERM_READ, TYPE_PERM_WRITE } from '../constants';

export const switchTypePerm = perm => {
  switch (perm) {
    case TYPE_PERM_READ:
      return TYPE_PERM_WRITE;
    case TYPE_PERM_WRITE:
      return TYPE_PERM_NONE;
    case TYPE_PERM_NONE:
    default:
      return TYPE_PERM_READ;
  }
};
