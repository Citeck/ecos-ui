import { LOCAL_STORAGE_KEY_PAGE_POSITION } from '../constants/bpmn';
import { getDesignerPagePositionState, removeDesignerPagePositionState, saveDesignerPagePositionState } from './designer';

export function getPagePositionState() {
  return getDesignerPagePositionState(LOCAL_STORAGE_KEY_PAGE_POSITION);
}

export function savePagePositionState(value) {
  saveDesignerPagePositionState(LOCAL_STORAGE_KEY_PAGE_POSITION, JSON.stringify(value));
}

export function removePagePositionState() {
  removeDesignerPagePositionState(LOCAL_STORAGE_KEY_PAGE_POSITION);
}

export function compareOld(a, b) {
  if (a.modified > b.modified) {
    return 1;
  }

  if (a.modified < b.modified) {
    return -1;
  }

  return 0;
}

export function compareLastModified(a, b, asc = false) {
  if (a.modified < b.modified) {
    return asc ? -1 : 1;
  }

  if (a.modified > b.modified) {
    return asc ? 1 : -1;
  }

  return 0;
}

export function compareAZ(a, b) {
  if (a.label.localeCompare) {
    return a.label.localeCompare(b.label);
  }

  if (a.label > b.label) {
    return 1;
  }

  if (a.label < b.label) {
    return -1;
  }

  return 0;
}

export function compareZA(a, b) {
  if (b.label.localeCompare) {
    return b.label.localeCompare(a.label);
  }

  if (a.label < b.label) {
    return 1;
  }

  if (a.label > b.label) {
    return -1;
  }

  return 0;
}
