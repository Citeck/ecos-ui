import React, { useContext, useMemo } from 'react';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../../../../helpers/export/util';
import { renderAction } from '../../../../grid/InlineTools/helpers';
import InlineToolsDisconnected from '../../../../grid/InlineTools/InlineToolsDisconnected';
import { TableFormContext } from '../../TableFormContext';

const InlineActions = () => {
  const context = useContext(TableFormContext);
  const {
    deleteSelectedItem,
    showEditForm,
    runCloneRecord,
    showPreview,
    showViewOnlyForm,
    inlineToolsOffsets,
    setInlineToolsOffsets,
    createVariants,
    controlProps
  } = context;
  const { disabled, viewOnly, displayElements, selectedRows, isUsedJournalActions, journalActions } = controlProps;

  const shouldShowViewButton = isBoolean(get(displayElements, 'view')) ? displayElements.view : true;
  const shouldShowPreviewButton = isBoolean(get(displayElements, 'preview')) ? displayElements.preview : false;
  const shouldShowEditButton = isBoolean(get(displayElements, 'edit')) ? displayElements.edit : true;
  const shouldShowCloneButton = isBoolean(get(displayElements, 'clone')) ? displayElements.clone : false;
  const shouldShowDeleteButton = isBoolean(get(displayElements, 'delete')) ? displayElements.delete : true;

  const renderButtons = useMemo(() => {
    let renderButtons;
    let actions = [];

    if (isUsedJournalActions) {
      actions = get(journalActions, ['forRecord', inlineToolsOffsets.rowId], []);
      console.log(actions);
    } else {
      shouldShowViewButton &&
        actions.push({
          key: 'view',
          icon: 'icon-eye-show',
          name: t('ecos-table-form.view.btn'),
          onClick: () => showViewOnlyForm(inlineToolsOffsets.rowId)
        });

      shouldShowPreviewButton &&
        actions.push({
          key: 'preview',
          icon: 'icon-eye-show',
          name: t('ecos-table-form.preview.btn'),
          onClick: () => showPreview(inlineToolsOffsets.rowId)
        });

      !disabled &&
        !viewOnly &&
        shouldShowEditButton &&
        actions.push({
          key: 'edit',
          icon: 'icon-edit',
          onClick: () => showEditForm(inlineToolsOffsets.rowId)
        });

      !disabled &&
        !viewOnly &&
        !isEmpty(createVariants) &&
        shouldShowCloneButton &&
        actions.push({
          key: 'clone',
          icon: 'icon-copy',
          onClick: () => runCloneRecord(inlineToolsOffsets.rowId)
        });

      !disabled &&
        !viewOnly &&
        shouldShowDeleteButton &&
        actions.push({
          key: 'delete',
          icon: 'icon-delete',
          onClick: () => {
            setInlineToolsOffsets({ height: 0, top: 0, row: {} });
            deleteSelectedItem(inlineToolsOffsets.rowId);
          }
        });
    }

    renderButtons = actions.map(action => renderAction(action, action.key, !!action.name));

    return renderButtons;
  }, [displayElements, journalActions, inlineToolsOffsets]);

  return <InlineToolsDisconnected selectedRecords={selectedRows} {...inlineToolsOffsets} tools={renderButtons} />;
};

export default InlineActions;
