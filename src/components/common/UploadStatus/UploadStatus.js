import React, { useState, useEffect } from 'react';
import get from 'lodash/get';
import { Loader } from '../index';
import Btn from '../btns/Btn';
import ChevronDown from '../icons/ChevronDown';
import Success from '../icons/Success';
import File from '../icons/File';
import Close from '../icons/Close';
import Error from '../icons/Error';
import { t } from '../../../helpers/util';
import { Radio } from '../form';

import './styles.scss';

const UploadStatus = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplaceAllFiles, setIsReplaceAllFiles] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [status, setStatus] = useState(null);
  const [fileDataConfirm, setFileDataConfirm] = useState(null);
  const [fileStatuses, setFileStatuses] = useState({});
  const [totalCountFiles, setTotalCountFiles] = useState(0);
  const [successCountFiles, setSuccessCountFiles] = useState(0);

  useEffect(() => {
    navigator.serviceWorker.addEventListener('message', event => {
      const { type, status, file: fileData, totalCount, successFileCount } = event.data;

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

            setFileStatuses(prevState => ({
              ...prevState,
              [fileId]: {
                file: get(fileData, 'file'),
                isLoading: get(fileData, 'isLoading', true),
                isError: get(fileData, 'isError', false)
              }
            }));
            break;

          case 'error':
            setFileStatuses(prevState => ({
              ...prevState,
              [fileId]: {
                file: get(fileData, 'file'),
                isLoading: get(fileData, 'isLoading', false),
                isError: get(fileData, 'isError', true)
              }
            }));
            break;

          default:
            break;
        }
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
          <div className="citeck-upload-status__header-actions_btn" onClick={onClose}>
            <Close width={18} height={18} />
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <div className="citeck-upload-status__files">
          {Object.entries(fileStatuses).map(
            ([fileId, { file, isLoading, isError }]) =>
              file &&
              file.name && (
                <div className="citeck-upload-status__file" key={fileId}>
                  <div className="citeck-upload-status__file-info">
                    <File />
                    <p className="citeck-upload-status__file-name">{file.name}</p>
                  </div>
                  <div className="citeck-upload-status__file-status">
                    {isLoading ? <Loader height="18px" type="points" /> : isError ? <Error /> : <Success />}
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default UploadStatus;
