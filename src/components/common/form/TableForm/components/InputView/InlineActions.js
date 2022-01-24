import React, { useContext, useMemo } from 'react';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';

import RecordActions from '../../../../../Records/actions/recordActions';
import { FitnesseClassNames } from '../../../../../Records/actions';
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
  const shouldShowEditButton = !disabled && !viewOnly && (isBoolean(get(displayElements, 'edit')) ? displayElements.edit : true);
  const shouldShowCloneButton =
    !disabled && !viewOnly && !isEmpty(createVariants) && (isBoolean(get(displayElements, 'clone')) ? displayElements.clone : false);
  const shouldShowDeleteButton = !disabled && !viewOnly && (isBoolean(get(displayElements, 'delete')) ? displayElements.delete : true);

  const renderButtons = useMemo(() => {
    const keyRender = act => `${act.id}-${act.key}`;
    let actions = [];

    if (isUsedJournalActions) {
      actions = get(journalActions, ['forRecord', inlineToolsOffsets.rowId], []);
      actions = actions.map(act => ({ ...act, onClick: () => RecordActions.execForRecord(inlineToolsOffsets.rowId, act) }));
    } else {
      //todo: should use action service for inline buttons

      shouldShowViewButton &&
        actions.push({
          key: 'view',
          icon: 'icon-eye-show',
          name: t('ecos-table-form.view.btn'),
          className: FitnesseClassNames.VIEW,
          onClick: () => showViewOnlyForm(inlineToolsOffsets.rowId)
        });

      shouldShowPreviewButton &&
        actions.push({
          key: 'preview',
          icon: 'icon-eye-show',
          name: t('ecos-table-form.preview.btn'),
          className: FitnesseClassNames.PREVIEW,
          onClick: () => showPreview(inlineToolsOffsets.rowId)
        });

      shouldShowEditButton &&
        actions.push({
          key: 'edit',
          icon: 'icon-edit',
          className: FitnesseClassNames.EDIT,
          onClick: () => showEditForm(inlineToolsOffsets.rowId)
        });

      shouldShowCloneButton &&
        actions.push({
          key: 'clone',
          icon: 'icon-copy',
          className: FitnesseClassNames.CLONE,
          onClick: () => runCloneRecord(inlineToolsOffsets.rowId)
        });

      shouldShowDeleteButton &&
        actions.push({
          key: 'delete',
          icon: 'icon-delete',
          className: FitnesseClassNames.DELETE,
          onClick: () => {
            setInlineToolsOffsets({ height: 0, top: 0, row: {} });
            deleteSelectedItem(inlineToolsOffsets.rowId);
          }
        });
    }

    return actions.map(action => renderAction(action, keyRender(action), !!action.name));
  }, [displayElements, journalActions, inlineToolsOffsets]);

  return <InlineToolsDisconnected selectedRecords={selectedRows} {...inlineToolsOffsets} tools={renderButtons} />;
};

export default InlineActions;
