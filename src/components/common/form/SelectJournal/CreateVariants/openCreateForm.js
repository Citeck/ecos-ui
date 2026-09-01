import FormManager from '@/components/forms/EcosForm/FormManager';
import { toWorkspaceRef } from '@/helpers/recordWorkspace';

/**
 * Opens the create form for a journal create variant.
 *
 * Create where we search, otherwise the new record immediately disappears from the list.
 * `getCreateWorkspaceId` is optional and may resolve to an empty string, which means
 * "don't set _workspace, let the backend decide".
 *
 * The workspace is merged into a copy of the variant rather than passed through the options of
 * FormManager.createRecordByVariant: there the options spread overwrites `attributes` as a whole,
 * dropping the `_parent` that FormManager derives from `variant.destination`.
 *
 * @param {object} variant - journal create variant
 * @param {object} params
 * @param {function} [params.getCreateWorkspaceId] - resolves the workspace to create in
 * @param {function} [params.onSubmit] - called with the created record
 * @returns {Promise<void>}
 */
export async function openCreateForm(variant, { getCreateWorkspaceId, onSubmit } = {}) {
  const workspaceId = getCreateWorkspaceId ? await getCreateWorkspaceId() : '';
  const variantToCreate = workspaceId
    ? { ...variant, attributes: { ...variant.attributes, _workspace: toWorkspaceRef(workspaceId) } }
    : variant;

  FormManager.createRecordByVariant(variantToCreate, {
    onSubmit,
    initiator: {
      type: 'form-component',
      name: 'CreateVariants'
    }
  });
}
