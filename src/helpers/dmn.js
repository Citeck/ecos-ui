import { LOCAL_STORAGE_KEY_PAGE_POSITION } from '../constants/dmn';
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
