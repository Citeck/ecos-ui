import { FormText } from 'reactstrap';
import React, { useState, useEffect } from 'react';
import get from 'lodash/get';
import classNames from 'classnames';

import { Loader } from '../index';
import Btn from '../btns/Btn';
import ChevronDown from '../icons/ChevronDown';
import Success from '../icons/Success';
import File from '../icons/File';
import Close from '../icons/Close';
import Error from '../icons/Error';
import { t } from '../../../helpers/util';
import { Input, Radio } from '../form';
import { sendToWorker } from '../../../workers/docLib';
import { NODE_TYPES } from '../../../constants/docLib';

import './styles.scss';

const UploadStatus = () => {
  const [isReadyLoadData, setIsReadyLoadData] = useState(false);
  const [titleRenamingItem, setTitleRenamingItem] = useState('');
  const [parentDirTitle, setParentDirTitle] = useState('');
  const [expansionCurrentFile, setExpansionCurrentFile] = useState(null);
  const [parentItemsTitles, setParentItemsTitles] = useState([]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplaceAllFiles, setIsReplaceAllFiles] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmRenameDirModal, setShowConfirmRenameDirModal] = useState(false);
  const [status, setStatus] = useState(null);
  const [fileDataConfirm, setFileDataConfirm] = useState(null);
  const [fileStatuses, setFileStatuses] = useState({});

  const [totalCountFiles, setTotalCountFiles] = useState(0);
  const [successCountFiles, setSuccessCountFiles] = useState(0);

  useEffect(
    () => {
      const handleBeforeUnload = e => {
        if (status !== 'success') {
          e.preventDefault();
          e.returnValue = ''; // Required for some browsers to show a warning
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    },
    [status]
  );

  useEffect(() => {
    navigator.serviceWorker.addEventListener('message', event => {
      const {
        type,
        status,
        file: fileData,
        totalCount,
        successFileCount,
        requestId,
        isCancelled = false,
        currentItemTitle,
        targetDirTitle,
        parentDirTitles,
        typeCurrentItem
      } = event.data;

      if (type === 'UPDATE_UPLOAD_STATUS') {
        setStatus(status);

        const fileId = `file-${get(fileData, 'file.name', 0)}-${get(fileData, 'file.name', '')}-${get(fileData, 'file.lastModified')}`;

        switch (status) {
          case 'start':
            setStatus(null);
            setFileStatuses({});
            setIsReplaceAllFiles(false);
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
                requestId,
                cancelRequest
              }
            }));
            break;

          case 'error':
            setFileStatuses(prevState => ({
              ...prevState,
              [fileId]: {
                file: get(fileData, 'file'),
                isLoading: get(fileData, 'isLoading', false),
                isError: get(fileData, 'isError', true),
                isCancelled
              }
            }));
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

  const isDisabledInputRenaming =
    parentItemsTitles &&
    titleRenamingItem &&
    parentItemsTitles.includes(expansionCurrentFile ? titleRenamingItem + `.${expansionCurrentFile}` : titleRenamingItem);

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
            <h4 className="citeck-file-replacement-modal__card-header_text">{t('document-library.actions.replacement-item')}</h4>
            <div className="citeck-file-replacement-modal__card-header_btn" onClick={() => handleConfirmResponseRenameItem(false)}>
              <Close width={16} height={16} />
            </div>
          </div>
          <div className="citeck-file-replacement-modal__card-field">
            <Input value={titleRenamingItem} onChange={onChangeRenameItem} isValid={!isDisabledInputRenaming} needValidCheck />
            {isDisabledInputRenaming && (
              <FormText color="red" className="citeck-file-replacement-modal__card-field_label">
                {t('document-library.actions.replacement-item-warning', { parentDirTitle })}
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

  if (!status || !totalCountFiles) {
    return null;
  }

  return (
    <div className="citeck-upload-status">
      <div className="citeck-upload-status__header">
        <h4 className="citeck-upload-status__header-title">
          {t('document-library.files-loader')}: {successCountFiles}/{totalCountFiles}
        </h4>
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
          {Object.entries(fileStatuses).map(
            ([fileId, { file, isLoading, isError, cancelRequest, isCancelled }]) =>
              file &&
              file.name && (
                <div
                  key={fileId}
                  className={classNames('citeck-upload-status__file', {
                    'citeck-upload-status__file_loading': isLoading
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
                  {isLoading && (
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
