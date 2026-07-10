import { useCallback } from 'react';

import DocLibService from '../DocLibService';
import { DocLibLabels } from '../constants';
import { CreateVariant } from '../types';

import { useDocLibDispatch } from './useDocLibDispatch';

import { createNode } from '@/actions/docLib';
import DialogManager from '@/components/common/dialogs/Manager/DialogManager';
import { t } from '@/helpers/export/util';

export function useCreateDialog(stateId: string) {
  const dispatchW = useDocLibDispatch(stateId);

  const openCreateForm = useCallback(
    async (createVariant: CreateVariant) => {
      const formDefinition = await DocLibService.getCreateFormDefinition(createVariant);

      // showFormDialog accepts more props at runtime than its JSDoc FormDialog typedef declares
      const dialogProps = {
        title: t(DocLibLabels.CREATE_NODE_TITLE, { name: createVariant.name }),
        formDefinition,
        formData: {
          ...(createVariant.attributes || {})
        },
        formRef: createVariant.formRef,
        onSubmit: (submission: { data: Record<string, unknown> }) => {
          dispatchW(createNode, { createVariant, submission: submission.data });
        }
      };

      DialogManager.showFormDialog(dialogProps as unknown as Parameters<typeof DialogManager.showFormDialog>[0]);
    },
    [dispatchW]
  );

  return { openCreateForm };
}
