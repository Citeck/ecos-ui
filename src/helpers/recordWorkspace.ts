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

  if (value.startsWith(WORKSPACE_REF_PREFIX)) {
    return value.slice(WORKSPACE_REF_PREFIX.length);
  }

  // A ref of any other source is not a workspace: searching by its local id would silently
  // scope the query to a workspace that does not exist, so let the caller fall back instead
  return value.includes('@') ? '' : value;
}

/**
 * Reference of a workspace by its local id, the form `_workspace` expects.
 */
export function toWorkspaceRef(workspaceId: string): string {
  return `${WORKSPACE_REF_PREFIX}${workspaceId}`;
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
  // A ref with no local id ("@", "emodel/task@") is a record that does not exist yet: it has no
  // workspace to load, and reading one would scope the lookup to global records
  if (!recordRef || recordRef.endsWith('@') || !getEnabledWorkspaces()) {
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
