import React, { useState, useEffect } from 'react';
import { NotificationManager } from 'react-notifications';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isNumber from 'lodash/isNumber';
import classNames from 'classnames';

import { Loader } from '../index';
import ChevronDown from '../icons/ChevronDown';
import Success from '../icons/Success';
import File from '../icons/File';
import Close from '../icons/Close';
import Error from '../icons/Error';
import { t } from '../../../helpers/util';

import './styles.scss';

const UploadStatus = () => {
  const [isReadyLoadData, setIsReadyLoadData] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [status, setStatus] = useState(null);
  const [fileStatuses, setFileStatuses] = useState({});

  const [totalCountFiles, setTotalCountFiles] = useState(0);
  const [successCountFiles, setSuccessCountFiles] = useState(0);

  useEffect(
    () => {
      const handleBeforeUnload = e => {
        if (status === 'in-progress') {
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
        errorStatus,
        file: fileData,
        totalCount,
        successFileCount,
        requestId,
        isCancelled = false,
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
            setIsReadyLoadData(false);
            break;

          case 'in-progress':
            setTotalCountFiles(totalCount);
            setSuccessCountFiles(successFileCount);

            setFileStatuses(prevState => ({
              ...prevState,
              [fileId]: {
                file: get(fileData, 'file'),
                isLoading: get(fileData, 'isLoading', true),
                isError: get(fileData, 'isError', false),
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
                NotificationManager.error(t('document-library.uploading-file.message.error', { file: fileName }));
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
    });
  }, []);

  const onClose = () => {
    setStatus(null);
    setFileStatuses({});
  };

  const onCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!status || !totalCountFiles) {
    return null;
  }

  return (
    <div className="citeck-upload-status">
      <div className="citeck-upload-status__header">
        <h4 className="citeck-upload-status__header-title">
          {isImporting ? t('document-library.file-loader') : t('document-library.files-loader')}: {successCountFiles}/{totalCountFiles}
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
