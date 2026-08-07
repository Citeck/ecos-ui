import { DEFAULT_WORKSPACE_ID } from '@citeck/constants';
import Records from '@citeck/records-core';

import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces } from '@/helpers/util';

/**
 * Workspace to search related records in for the given record.
 *
 * Without a ref (create form, call outside a record context) the workspace from the URL
 * is used: that is where the new record will be created. For an existing record it is its
 * own workspace; an empty `_workspace` means a global record, so `default` is used.
 *
 * When workspaces are disabled it returns whatever getWorkspaceId() returned before —
 * an empty string — without making an extra request.
 */
export async function resolveRecordWorkspaceId(recordRef?: string): Promise<string> {
  if (!recordRef || !getEnabledWorkspaces()) {
    return getWorkspaceId();
  }

  try {
    const workspaceId: string = await Records.get(recordRef).load('_workspace?localId');

    return workspaceId || DEFAULT_WORKSPACE_ID;
  } catch (e) {
    console.error(`[resolveRecordWorkspaceId] cannot resolve workspace of record "${recordRef}"`, e);

    return getWorkspaceId();
  }
}
