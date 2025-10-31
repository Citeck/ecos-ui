import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';

import RecordActions from '../../../../../Records/actions/recordActions';
import InlineToolsDisconnected from '../../../../grid/InlineTools/InlineToolsDisconnected';
import { renderAction } from '../../../../grid/InlineTools/helpers';

import Records from '@/components/Records';
import DeleteAction from '@/components/Records/actions/handler/executor/DeleteAction';
import EditAction from '@/components/Records/actions/handler/executor/EditAction';
import { getFitnesseInlineToolsClassName } from '@/helpers/tools';
import { t } from '@/helpers/util';

const InlineActions = ({ context, rowId = null }) => {
  const {
    deleteSelectedItem,
    showEditForm,
    onEditFormSubmit,
    runCloneRecord,
    showPreview,
    showViewOnlyForm,
    createVariants,
    controlProps
  } = context;
  const { disabled, viewOnly, displayElements, selectedRows, isUsedJournalActions, journalActions } = controlProps;

  const shouldShowViewButton = isBoolean(get(displayElements, 'view')) ? displayElements.view : true;
  const shouldShowPreviewButton = isBoolean(get(displayElements, 'preview')) ? displayElements.preview : false;
  const shouldShowEditButton = !disabled && !viewOnly && (isBoolean(get(displayElements, 'edit')) ? displayElements.edit : true);
  const shouldShowCloneButton =
    !disabled && !viewOnly && !isEmpty(createVariants) && (isBoolean(get(displayElements, 'clone')) ? displayElements.clone : false);
  const shouldShowDeleteButton = !disabled && !viewOnly && (isBoolean(get(displayElements, 'delete')) ? displayElements.delete : true);

  const renderButtons = useMemo(() => {
    const keyRender = act => `${act.id}-${act.key}`;

    let actions = [];

    if (isUsedJournalActions) {
      actions = get(journalActions, ['forRecord', rowId], []);
      actions = actions.map(act => {
        let recordAction = { ...act };

        if (recordAction.type === 'edit') {
          recordAction.config = {
            ...(recordAction.config || {}),
            saveOnSubmit: !!viewOnly
          };
        }

        return {
          ...act,
          onClick: async () => {
            if (recordAction.type === EditAction.ACTION_ID) {
              const record = Records.getRecordToEdit(rowId);
              const recordWasChanged = await RecordActions.execForRecord(record, recordAction);

              if (recordWasChanged) {
                onEditFormSubmit(record);
              }
            } else if (recordAction.type === DeleteAction.ACTION_ID) {
              const record = Records.get(rowId);
              const recordWasChanged = await RecordActions.execForRecord(record, recordAction);

              if (recordWasChanged) {
                deleteSelectedItem(rowId);
              }
            } else {
              await RecordActions.execForRecord(rowId, recordAction);
            }
          }
        };
      });
    } else {
      //todo: should use action service for inline buttons

      shouldShowViewButton &&
        actions.push({
          key: 'view',
          icon: 'icon-eye-show',
          name: t('ecos-table-form.view.btn'),
          className: getFitnesseInlineToolsClassName('view'),
          onClick: () => showViewOnlyForm(rowId)
        });

      shouldShowPreviewButton &&
        actions.push({
          key: 'preview',
          icon: 'icon-eye-show',
          name: t('ecos-table-form.preview.btn'),
          className: getFitnesseInlineToolsClassName('preview'),
          onClick: () => showPreview(rowId)
        });

      shouldShowEditButton &&
        actions.push({
          key: 'edit',
          icon: 'icon-edit',
          className: getFitnesseInlineToolsClassName('edit'),
          onClick: () => showEditForm(rowId)
        });

      shouldShowCloneButton &&
        actions.push({
          key: 'clone',
          icon: 'icon-copy',
          className: getFitnesseInlineToolsClassName('clone'),
          onClick: () => runCloneRecord(rowId)
        });

      shouldShowDeleteButton &&
        actions.push({
          key: 'delete',
          icon: 'icon-delete',
          className: getFitnesseInlineToolsClassName('delete'),
          onClick: () => {
            deleteSelectedItem(rowId);
          }
        });
    }

    return actions.map(action => renderAction(action, keyRender(action), !!action.name));
  }, [displayElements, journalActions, rowId]);

  return <InlineToolsDisconnected selectedRecords={selectedRows} rowId={rowId} tools={renderButtons} />;
};

export default InlineActions;
