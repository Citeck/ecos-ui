import React, { useContext } from 'react';
import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';

import { t } from '../../../../../../helpers/export/util';
import { IcoBtn } from '../../../../btns';
import InlineToolsDisconnected from '../../../../grid/InlineTools/InlineToolsDisconnected';
import { TableFormContext } from '../../TableFormContext';

const InlineActions = () => {
  const iconButtons = [];
  const context = useContext(TableFormContext);

  const { disabled, viewOnly, displayElements, selectedRows } = context.controlProps;
  const {
    deleteSelectedItem,
    showEditForm,
    showCloneForm,
    showPreview,
    showViewOnlyForm,
    inlineToolsOffsets,
    setInlineToolsOffsets
  } = context;

  const onClickDelete = () => {
    setInlineToolsOffsets({ height: 0, top: 0, row: {} });
    deleteSelectedItem(inlineToolsOffsets.rowId);
  };

  const onClickEdit = () => {
    showEditForm(inlineToolsOffsets.rowId);
  };

  const onClickClone = () => {
    showCloneForm(inlineToolsOffsets.rowId);
  };

  const onClickView = () => {
    showViewOnlyForm(inlineToolsOffsets.rowId);
  };

  const onClickPreview = () => {
    showPreview(inlineToolsOffsets.rowId);
  };

  const inlineToolsActionClassName =
    'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_hover_t-dark-brown ecos-btn_x-step_10 ecos-inline-tools-btn';

  const shouldShowViewButton = isBoolean(get(displayElements, 'view')) ? displayElements.view : true;
  if (shouldShowViewButton) {
    iconButtons.push(
      <IcoBtn
        key={'view'}
        icon={'icon-preview'}
        title={t('ecos-table-form.view.btn')}
        className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__on')}
        onClick={onClickView}
      />
    );
  }

  const shouldShowPreviewButton = isBoolean(get(displayElements, 'preview')) ? displayElements.preview : false;
  if (shouldShowPreviewButton) {
    iconButtons.push(
      <IcoBtn
        key={'preview'}
        icon={'icon-preview'}
        title={t('ecos-table-form.preview.btn')}
        className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__preview')}
        onClick={onClickPreview}
      />
    );
  }

  const shouldShowEditButton = isBoolean(get(displayElements, 'edit')) ? displayElements.edit : true;
  if (!disabled && !viewOnly && shouldShowEditButton) {
    iconButtons.push(
      <IcoBtn
        key={'edit'}
        icon={'icon-edit'}
        className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__edit')}
        onClick={onClickEdit}
      />
    );
  }

  const shouldShowCloneButton = isBoolean(get(displayElements, 'clone')) ? displayElements.clone : false;
  if (!disabled && !viewOnly && shouldShowCloneButton) {
    iconButtons.push(
      <IcoBtn
        key={'clone'}
        icon={'icon-copy'}
        className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__clone')}
        onClick={onClickClone}
      />
    );
  }

  const shouldShowDeleteButton = isBoolean(get(displayElements, 'delete')) ? displayElements.delete : true;
  if (!disabled && !viewOnly && shouldShowDeleteButton) {
    iconButtons.push(
      <IcoBtn
        key={'delete'}
        icon={'icon-delete'}
        className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__delete')}
        onClick={onClickDelete}
      />
    );
  }

  return <InlineToolsDisconnected selectedRecords={selectedRows} {...inlineToolsOffsets} tools={iconButtons} />;
};

export default InlineActions;
