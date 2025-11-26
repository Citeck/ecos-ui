import classNames from 'classnames';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isNumber from 'lodash/isNumber';
import React, { useState, useEffect } from 'react';
import { FormText } from 'reactstrap';

import { NODE_TYPES } from '../../../constants/docLib';
import { t } from '../../../helpers/util';
import { sendToWorker } from '../../../workers/docLib';
import Btn from '../btns/Btn';
import { Input, Radio } from '../form';
import Close from '../icons/Close';
import Error from '../icons/Error';
import File from '../icons/File';
import ChevronDown from '../icons/FillChevronDown';
import Success from '../icons/Success';
import { Loader } from '../index';

import { NotificationManager } from '@/services/notifications';

import './styles.scss';

const STORAGE_KEY_ACTIVE_TAB = 'uploadStatus_currentTabActive';

const UploadStatus = () => {
  const [isReadyLoadData, setIsReadyLoadData] = useState(false);
  const [titleRenamingItem, setTitleRenamingItem] = useState('');
  const [parentDirTitle, setParentDirTitle] = useState('');
  const [expansionCurrentFile, setExpansionCurrentFile] = useState(null);
  const [parentItemsTitles, setParentItemsTitles] = useState([]);

  const [isImporting, setIsImporting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplaceAllFiles, setIsReplaceAllFiles] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmRenameDirModal, setShowConfirmRenameDirModal] = useState(false);
  const [isReplacement, setIsReplacement] = useState(false);

  const [status, setStatus] = useState(null);
  const [fileDataConfirm, setFileDataConfirm] = useState(null);
  const [fileStatuses, setFileStatuses] = useState({});

  const [totalCountFiles, setTotalCountFiles] = useState(0);
  const [successCountFiles, setSuccessCountFiles] = useState(0);

  useEffect(() => {
    const handleBeforeUnload = e => {
      if (status === 'in-progress') {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers to show a warning
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, 'false');
        handleConfirmResponseRenameItem(false);
      } else {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, 'true');
      }
    };

    // When switching to the same tab, disable the name conflict warning
    const handleStorageEvent = event => {
      if (event.key === STORAGE_KEY_ACTIVE_TAB && event.newValue === 'false') {
        handleConfirmResponseRenameItem(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('storage', handleStorageEvent);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageEvent);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);

  useEffect(() => {
    navigator.serviceWorker &&
      navigator.serviceWorker.addEventListener('message', event => {
        const {
          type,
          status,
          errorStatus,
          file: fileData,
          totalCount,
          successFileCount,
          requestId,
          isCancelled = false,
          currentItemTitle,
          targetDirTitle,
          parentDirTitles,
          typeCurrentItem,
          isReplacementItem,
          isImporting
        } = event.data;

        if (type === 'UPDATE_UPLOAD_STATUS') {
          setStatus(status);

          if (isBoolean(isImporting)) {
            setIsImporting(isImporting);
          }

          const fileName = get(fileData, 'file.name', '');
          const fileId = `file-${get(fileData, 'file.size', 0)}-${fileName}-${get(fileData, 'file.lastModified', 0)}`;

          switch (status) {
            case 'start':
              setStatus(null);
              setFileStatuses({});
              setIsReplaceAllFiles(false);
              setIsReadyLoadData(false);
              break;

            case 'confirm-file-replacement':
              setFileDataConfirm(get(fileData, 'file', null));
              setShowConfirmModal(true);
              break;

            case 'in-progress':
              setTotalCountFiles(totalCount);
              setSuccessCountFiles(successFileCount);

              const cancelRequest = () => sendToWorker({ type: 'CANCEL_REQUEST', requestId });

              setFileStatuses(prevState => ({
                ...prevState,
                [fileId]: {
                  file: get(fileData, 'file'),
                  isLoading: get(fileData, 'isLoading', true),
                  isError: get(fileData, 'isError', false),
                  cancelRequest,
                  requestId
                }
              }));
              break;

            case 'error':
              if (isNumber(totalCount) && isNumber(successFileCount)) {
                setTotalCountFiles(totalCount);
                setSuccessCountFiles(successFileCount);
              }

              setFileStatuses(prevState => ({
                ...prevState,
                [fileId]: {
                  file: get(fileData, 'file'),
                  isLoading: get(fileData, 'isLoading', false),
                  isError: get(fileData, 'isError', true),
                  isCancelled
                }
              }));

              if (errorStatus) {
                if (errorStatus === 413) {
                  NotificationManager.error(t('document-library.uploading-file.message.size-error', { fileName }));
                } else {
                  NotificationManager.error(t('document-library.uploading-file.message.error', { fileName }));
                }
              }

              break;

            case 'success':
              setIsReadyLoadData(true);
              break;

            default:
              break;
          }
        }

        if (type === 'CONFIRMATION_RENAME_DIR_REQUEST') {
          if (typeCurrentItem === NODE_TYPES.FILE) {
            const lastDotIndex = currentItemTitle.lastIndexOf('.');
            const extension = lastDotIndex !== -1 ? currentItemTitle.substring(lastDotIndex + 1) : null;

            if (extension) {
              setExpansionCurrentFile(extension);
              setTitleRenamingItem(currentItemTitle.substring(0, lastDotIndex));
            } else {
              setTitleRenamingItem(currentItemTitle);
            }
          } else {
            setTitleRenamingItem(currentItemTitle);
          }

          setIsReplacement(isReplacementItem);
          setParentItemsTitles(parentDirTitles);
          setParentDirTitle(targetDirTitle);
          setShowConfirmRenameDirModal(true);
        }
      });
  }, []);

  const onClose = () => {
    setStatus(null);
    setFileStatuses({});
  };

  const onCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleConfirmResponse = confirmed => {
    setShowConfirmModal(false);
    navigator.serviceWorker.controller.postMessage({
      type: 'CONFIRMATION_FILE_RESPONSE',
      confirmed,
      isReplaceAllFiles
    });
  };

  const handleConfirmResponseRenameItem = confirmedRenameItem => {
    setShowConfirmRenameDirModal(false);
    let title = titleRenamingItem;

    if (expansionCurrentFile) {
      title += `.${expansionCurrentFile}`;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'CONFIRMATION_RENAME_DIR_RESPONSE',
      confirmedRenameItem,
      titleRenamingItem: title
    });

    setExpansionCurrentFile(null);
  };

  const onChangeRenameItem = e => {
    if (e.target) {
      setTitleRenamingItem(e.target.value);
    }
  };

  const trimTitleRenamingItem = titleRenamingItem?.trim();
  const isEmptyInputRenaming = !trimTitleRenamingItem;
  const currentTitleRenaming = expansionCurrentFile ? trimTitleRenamingItem + `.${expansionCurrentFile}` : trimTitleRenamingItem;

  const isDisabledInputRenaming =
    isEmptyInputRenaming || (parentItemsTitles && titleRenamingItem && parentItemsTitles.includes(currentTitleRenaming.trim()));

  if (status && status === 'confirm-file-replacement') {
    return showConfirmModal && get(fileDataConfirm, 'file.name') ? (
      <div className="citeck-file-replacement-modal">
        <div className="citeck-file-replacement-modal__card">
          <div className="citeck-file-replacement-modal__card-header">
            <h4 className="citeck-file-replacement-modal__card-header_text">{t('document-library.settings-upload')}</h4>
          </div>
          <p className="citeck-file-replacement-modal__card-description">
            {t('document-library.warning-replace-file')}: "{fileDataConfirm.path || fileDataConfirm.file.name}"
          </p>
          <div className="citeck-file-replacement-modal__card-radio_list">
            <Radio
              className="citeck-file-replacement-modal__card-radio"
              name="radio-replacement-files"
              label={t('document-library.actions.apply-msg.all')}
              checked={isReplaceAllFiles}
              onChange={() => setIsReplaceAllFiles(true)}
            />
            <Radio
              className="citeck-file-replacement-modal__card-radio"
              name="radio-replacement-files"
              label={t('document-library.actions.apply-msg.one')}
              checked={!isReplaceAllFiles}
              onChange={() => setIsReplaceAllFiles(false)}
            />
          </div>
          <div className="citeck-file-replacement-modal__card-actions">
            <Btn className="citeck-file-replacement-modal__card-actions_btn skip" onClick={() => handleConfirmResponse(false)}>
              {t('document-library.actions.skip')}
            </Btn>
            <Btn className="citeck-file-replacement-modal__card-actions_btn replace" onClick={() => handleConfirmResponse(true)}>
              {t('document-library.actions.replace')}
            </Btn>
          </div>
        </div>
      </div>
    ) : null;
  }

  if (showConfirmRenameDirModal) {
    return (
      <div className="citeck-file-replacement-modal">
        <div className="citeck-file-replacement-modal__card">
          <div className="citeck-file-replacement-modal__card-header">
            <h4 className="citeck-file-replacement-modal__card-header_text">
              {isReplacement ? t('document-library.actions.replacement-item') : t('document-library.actions.specify-name')}
            </h4>
            <div className="citeck-file-replacement-modal__card-header_btn" onClick={() => handleConfirmResponseRenameItem(false)}>
              <Close width={16} height={16} />
            </div>
          </div>
          <div className="citeck-file-replacement-modal__card-field">
            <Input value={titleRenamingItem} onChange={onChangeRenameItem} isValid={!isDisabledInputRenaming} needValidCheck />
            {isDisabledInputRenaming && (
              <FormText color="red" className="citeck-file-replacement-modal__card-field_label">
                {isEmptyInputRenaming
                  ? t('document-library.actions.empty.replacement-item-warning')
                  : t('document-library.actions.replacement-item-warning', { parentDirTitle })}
              </FormText>
            )}
          </div>
          <div className="citeck-file-replacement-modal__card-actions">
            <Btn className="citeck-file-replacement-modal__card-actions_btn skip" onClick={() => handleConfirmResponseRenameItem(false)}>
              {t('document-library.actions.replacement-btn-cancel')}
            </Btn>
            <Btn
              className={classNames('citeck-file-replacement-modal__card-actions_btn replace', {
                disabled: isDisabledInputRenaming
              })}
              disabled={isDisabledInputRenaming}
              onClick={() => handleConfirmResponseRenameItem(true)}
            >
              {t('document-library.actions.replacement-btn-next')}
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  if (!status || (!totalCountFiles && !isImporting)) {
    return null;
  }

  const renderCounter = () => {
    if (isImporting) {
      return (
        <>
          {t('document-library.file-loader')}
          {totalCountFiles ? `: ${successCountFiles}/${totalCountFiles}` : ''}
        </>
      );
    }

    return (
      <>
        {t('document-library.files-loader')}: {successCountFiles}/{totalCountFiles}
      </>
    );
  };

  return (
    <div className="citeck-upload-status">
      <div className="citeck-upload-status__header">
        <h4 className="citeck-upload-status__header-title">{renderCounter()}</h4>
        <div className="citeck-upload-status__header-actions">
          <div className="citeck-upload-status__header-actions_btn" onClick={onCollapsed}>
            <ChevronDown />
          </div>
          {isReadyLoadData && (
            <div className="citeck-upload-status__header-actions_btn" onClick={onClose}>
              <Close width={18} height={18} />
            </div>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <div className="citeck-upload-status__files">
          {Object.entries(fileStatuses)
            .reverse()
            .map(
              ([fileId, { file, isLoading, isError, cancelRequest, isCancelled }]) =>
                file &&
                file.name && (
                  <div
                    key={fileId}
                    className={classNames('citeck-upload-status__file', {
                      'citeck-upload-status__file_loading': isLoading && !isImporting
                    })}
                  >
                    <div className="citeck-upload-status__file-info">
                      <File />
                      <p className="citeck-upload-status__file-name">{file.name}</p>
                    </div>
                    <div
                      className={classNames('citeck-upload-status__file-status', {
                        'citeck-upload-status__file-status_canceled': isCancelled
                      })}
                    >
                      {isLoading ? <Loader height="18px" type="points" /> : isError ? <Error /> : <Success />}
                    </div>
                    {!isImporting && isLoading && (
                      <div
                        className="citeck-upload-status__file-action_cancel"
                        onClick={cancelRequest}
                        title={t('document-library.actions.cancel-title')}
                      >
                        <Close width={18} height={18} />
                      </div>
                    )}
                  </div>
                )
            )}
        </div>
      )}
    </div>
  );
};

export default UploadStatus;
