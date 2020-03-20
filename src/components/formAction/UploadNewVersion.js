import React, { useEffect, useState } from 'react';
import get from 'lodash/get';

import { VersionsJournalApi } from '../../api';
import { t } from '../../helpers/util';
import VersionsJournalConverter from '../../dto/versionsJournal';
import { AddModal } from '../widgets/VersionsJournal';

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
        body: VersionsJournalConverter.getAddVersionFormDataForServer({ ...data, record }),
        handleProgress
      })
      .then(r => {
        setLoadDoc(true);
        setShow(false);
      })
      .catch(e => setErrorMessage(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setShow(true);

    if (record) {
      const _versions = versionsJournalApi.getVersions(record);

      Promise.all([_versions])
        .then(response => {
          const [versions] = response;

          if (!versions) {
            throw new Error(t('record-action.upload-new-version.error.no-version'));
          }

          if (versions.errors && versions.errors.length) {
            throw new Error(versions.errors.map(item => item.msg).join('; '));
          }

          setCurrentVersion(get(versions, 'records.[0].version', 1));
        })
        .catch(e => setErrorMessage(e.message))
        .finally(() => setLoadingModal(false));
    } else {
      setErrorMessage(t('record-action.upload-new-version.error.no-record'));
    }
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
