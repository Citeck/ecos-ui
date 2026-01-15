import React, { useContext, useEffect, useState } from 'react';

import PanelTitle from '../../../components/common/PanelTitle';
import { Grid } from '../../../components/common/grid';
import DateTimeFormatter from '../../../components/common/grid/formatters/gql/DateTimeFormatter';
import ErrorText from '../ErrorText';
import Loader from '../Loader';

import { BuildContext } from './BuildContext';

import Records from '@/components/Records';
import { SourcesId } from '@/constants';
import { t } from '@/helpers/export/util';

export const Labels = {
  title: 'dev-tools.build.system.panel-title',
  alfrescoTitle: 'dev-tools.build.alfresco.panel-title'
};

const BuildTab = () => {
  const context = useContext(BuildContext);

  const [bundleVersion, setBundleVersion] = useState('');

  const { state, getBuildInfo } = context;
  const { alfresco, system } = state;

  useEffect(() => {
    Records.get(`${SourcesId.EAPPS_BUNDLE_INFO}@`)
      .load('version?str!')
      .then((version: string) => setBundleVersion(version))
      .catch(_error => setBundleVersion(''));

    getBuildInfo();
  }, []);

  const columns = [
    { dataField: 'label', text: 'ID' },
    {
      dataField: 'version',
      get text() {
        return t('dev-tools.columns.version');
      }
    },
    {
      dataField: 'buildDate',
      get text() {
        return t('dev-tools.columns.build-date');
      },
      formatExtraData: { formatter: DateTimeFormatter, params: { format: 'DD.MM.YYYY HH:mm:ss' } }
    }
  ];

  let systemModules = null;

  if (system.error) {
    systemModules = <ErrorText>{system.error}</ErrorText>;
  } else if (!system.isReady) {
    systemModules = <Loader />;
  } else {
    systemModules = <Grid scrollable={false} data={system.items} columns={columns} />;
  }

  let alfrescoModules = null;
  if (alfresco.error) {
    if (alfresco.enabled) {
      alfrescoModules = <ErrorText>{alfresco.error}</ErrorText>;
    }
  } else if (!alfresco.isReady) {
    alfrescoModules = <Loader />;
  } else {
    alfrescoModules = <Grid scrollable={false} data={alfresco.items} columns={columns} />;
  }

  return (
    <>
      <PanelTitle>
        {t(Labels.title)}
        {bundleVersion ? <small className="pull-right">v{bundleVersion}</small> : null}
      </PanelTitle>
      {systemModules}
      {alfresco.enabled && (
        <>
          <PanelTitle>{t(Labels.alfrescoTitle)}</PanelTitle>
          {alfrescoModules}
        </>
      )}
    </>
  );
};

export default BuildTab;
