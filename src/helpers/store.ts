import { getWorkspaceId } from './urls';
import { getEnabledWorkspaces } from './util';

export function wrapArgs<T>(stateId: string) {
  return (args: T): { _args: T; stateId: string } => ({ _args: args, stateId });
}

export function getStateId({ tabId = '', id = '' }) {
  const baseId = `[${tabId}]-[${id}]`;

  if (getEnabledWorkspaces()) {
    return baseId + `-[${getWorkspaceId()}]`;
  }

  return baseId;
}
