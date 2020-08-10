import React, { useContext } from 'react';
import classNames from 'classnames';
import isBoolean from 'lodash/isBoolean';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../../../../helpers/export/util';
import { IcoBtn } from '../../../../btns';
import InlineToolsDisconnected from '../../../../grid/InlineTools/InlineToolsDisconnected';
import { TableFormContext } from '../../TableFormContext';

const InlineActions = () => {
  const iconButtons = [];
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
  const { disabled, viewOnly, displayElements, selectedRows } = controlProps;

  const onClickDelete = () => {
    setInlineToolsOffsets({ height: 0, top: 0, row: {} });
    deleteSelectedItem(inlineToolsOffsets.rowId);
  };

  const onClickEdit = () => {
    showEditForm(inlineToolsOffsets.rowId);
  };

  const onClickClone = () => {
    runCloneRecord(inlineToolsOffsets.rowId);
  };

  const onClickView = () => {
    showViewOnlyForm(inlineToolsOffsets.rowId);
  };

  const onClickPreview = () => {
    showPreview(inlineToolsOffsets.rowId);
  };

  const shouldShowViewButton = isBoolean(get(displayElements, 'view')) ? displayElements.view : true;
  const shouldShowPreviewButton = isBoolean(get(displayElements, 'preview')) ? displayElements.preview : false;
  const shouldShowEditButton = isBoolean(get(displayElements, 'edit')) ? displayElements.edit : true;
  const shouldShowCloneButton = isBoolean(get(displayElements, 'clone')) ? displayElements.clone : false;
  const shouldShowDeleteButton = isBoolean(get(displayElements, 'delete')) ? displayElements.delete : true;

  const inlineToolsActionClassName = classNames('ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_x-step_10 ecos-inline-tools-btn');

  if (shouldShowViewButton) {
    iconButtons.push(
      <IcoBtn
        key={'view'}
        icon={'icon-eye-show'}
        title={t('ecos-table-form.view.btn')}
        className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__on')}
        onClick={onClickView}
      />
    );
  }

  if (shouldShowPreviewButton) {
    iconButtons.push(
      <IcoBtn
        key={'preview'}
        icon={'icon-eye-show'}
        title={t('ecos-table-form.preview.btn')}
        className={classNames(inlineToolsActionClassName, 'fitnesse-inline-tools-actions-btn__preview')}
        onClick={onClickPreview}
      />
    );
  }

  if (!disabled && !viewOnly && shouldShowEditButton) {
    iconButtons.push(
      <IcoBtn
        key={'edit'}
        icon={'icon-edit'}
        className={classNames(inlineToolsActionClassName, 'ecos-btn_hover_t-dark-brown fitnesse-inline-tools-actions-btn__edit')}
        onClick={onClickEdit}
      />
    );
  }

  if (!disabled && !viewOnly && !isEmpty(createVariants) && shouldShowCloneButton) {
    iconButtons.push(
      <IcoBtn
        key={'clone'}
        icon={'icon-copy'}
        className={classNames(inlineToolsActionClassName, 'ecos-btn_hover_t-dark-brown fitnesse-inline-tools-actions-btn__clone')}
        onClick={onClickClone}
      />
    );
  }

  if (!disabled && !viewOnly && shouldShowDeleteButton) {
    iconButtons.push(
      <IcoBtn
        key={'delete'}
        icon={'icon-delete'}
        className={classNames(inlineToolsActionClassName, 'ecos-btn_hover_t_red fitnesse-inline-tools-actions-btn__delete')}
        onClick={onClickDelete}
      />
    );
  }

  return <InlineToolsDisconnected selectedRecords={selectedRows} {...inlineToolsOffsets} tools={iconButtons} />;
};

export default InlineActions;
