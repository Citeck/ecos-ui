import { DOC_PERM_NONE, DOC_PERM_READ, DOC_PERM_WRITE } from '../constants';

export const switchDocPerm = perm => {
  switch (perm) {
    case DOC_PERM_READ:
      return DOC_PERM_WRITE;
    case DOC_PERM_WRITE:
      return DOC_PERM_NONE;
    case DOC_PERM_NONE:
    default:
      return DOC_PERM_READ;
  }
};
