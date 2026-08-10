import { DEFAULT_WORKSPACE_ID, SourcesId } from '@citeck/constants';
import Records from '@citeck/records-core';
import get from 'lodash/get';

import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces } from '@/helpers/util';

const WORKSPACE_REF_PREFIX = `${SourcesId.WORKSPACE}@`;

/**
 * Workspace held by a `_workspace` component of a form, as a local id.
 *
 * Only meaningful on create/clone forms, where the value is derived from the project the user
 * picks (project and workspace map one to one). On an edit form the same computation falls back
 * to the first project of the current workspace when the record has no project link, which would
 * shadow the real workspace of the record — so callers must not use it there.
 *
 * Returns an empty string when the form has no usable value.
 */
export function getFormDataWorkspaceId(formData: unknown): string {
  if (!getEnabledWorkspaces()) {
    return '';
  }

  let value: unknown = get(formData, '_workspace');

  if (Array.isArray(value)) {
    value = value[0];
  }

  if (value && typeof value === 'object') {
    value = get(value, 'id') || get(value, 'value') || '';
  }

  if (typeof value !== 'string' || !value) {
    return '';
  }

  return value.startsWith(WORKSPACE_REF_PREFIX) ? value.slice(WORKSPACE_REF_PREFIX.length) : value;
}

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
