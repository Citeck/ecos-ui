import get from 'lodash/get';
import React, { useEffect, useState } from 'react';

import { VersionsJournalApi } from '../../api/versionsJournal';
import VersionsJournalConverter from '../../dto/versionsJournal';
import { t } from '../../helpers/util';
import { AddModal } from '../widgets/VersionsJournal';

import { NotificationManager } from '@/services/notifications';

import './style.scss';

const versionsJournalApi = new VersionsJournalApi();

export default function UploadNewVersion({ record, onClose }) {
  const [currentVersion, setCurrentVersion] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShow, setShow] = useState(undefined);
  const [isLoadingModal, setLoadingModal] = useState(true);
  const [isLoading, setLoading] = useState(false);
  const [isLoadDoc, setLoadDoc] = useState(undefined);

  const onHideModal = () => {
    setShow(false);
  };

  const onCreate = ({ handleProgress, ...data }) => {
    setLoading(true);
    versionsJournalApi
      .addNewVersion({
        body: VersionsJournalConverter.getAddVersionFormDataForServer({ ...data, record: record.id }),
        handleProgress
      })
      .then(r => {
        setLoadDoc(true);
        setShow(false);
      })
      .catch(e => {
        setErrorMessage(e.message);
        NotificationManager.error(t('documents-widget.error.upload-filed'), t('error'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let isExist = true;

    setShow(true);

    if (record.id) {
      const _versions = versionsJournalApi.getVersions(record.id);

      Promise.all([_versions])
        .then(response => {
          if (isExist) {
            const [versions] = response;

            if (!versions) {
              throw new Error(t('record-action.upload-new-version.error.no-version'));
            }

            if (versions.errors && versions.errors.length) {
              throw new Error(versions.errors.map(item => item.msg).join('; '));
            }

            setCurrentVersion(get(versions, 'records.[0].version', 1));
          }
        })
        .catch(e => isExist && setErrorMessage(e.message))
        .finally(() => isExist && setLoadingModal(false));
    } else {
      setErrorMessage(t('record-action.upload-new-version.error.no-record'));
    }

    return () => {
      isExist = false;
    };
  }, [record]);

  useEffect(() => {
    if (isShow === false) {
      onClose(isLoadDoc);
    }
  }, [isShow]);

  return (
    <AddModal
      isShow={isShow}
      title={t('record-action.upload-new-version.title.upload-model')}
      currentVersion={currentVersion}
      onHideModal={onHideModal}
      onCreate={onCreate}
      errorMessage={errorMessage}
      isLoading={isLoading}
      isLoadingModal={isLoadingModal}
      className="upload-new-version__add-modal"
    />
  );
}
