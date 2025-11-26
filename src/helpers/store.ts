import get from 'lodash/get';

import { getWorkspaceId } from './urls';
import { getEnabledWorkspaces } from './util';

export function wrapArgs(stateId?: string): {
  (): { _args: void; stateId: string };
  <T>(args: T): { _args: T; stateId: string };
} {
  function _fn(): { _args: undefined; stateId: string };
  function _fn<T>(args: T): { _args: T; stateId: string };

  function _fn<T>(args?: T) {
    if (arguments.length === 0) {
      return { _args: undefined as void, stateId };
    }
    return { _args: args as T, stateId };
  }

  return _fn;
}

export function getStateId({ tabId = '', id = '' }) {
  const baseId = `[${tabId}]-[${id}]`;

  if (getEnabledWorkspaces()) {
    return baseId + `-[${getWorkspaceId()}]`;
  }

  return baseId;
}

export function handleAction<T>(action: T) {
  return { payload: get(action, 'payload._args') };
}
