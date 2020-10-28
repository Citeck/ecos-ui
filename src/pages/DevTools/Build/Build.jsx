import React, { useContext, useEffect } from 'react';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';

import DateTimeFormatter from '../../../components/common/grid/formatters/gql/DateTimeFormatter';
import PanelTitle from '../../../components/common/PanelTitle';
import { Grid } from '../../../components/common/grid';
import { t } from '../../../helpers/util';

import { BuildContext } from './BuildContext';
import ErrorText from '../ErrorText';
import Loader from '../Loader';

const BuildTab = () => {
  const context = useContext(BuildContext);
  const { state, getBuildInfo } = context;
  const { alfresco, system } = state;

  useEffect(() => {
    getBuildInfo();
  }, []);

  const columns = [
    { dataField: 'label', text: 'ID' },
    { dataField: 'version', text: 'Version' },
    { dataField: 'buildDate', text: 'Build Date', formatExtraData: { formatter: DateTimeFormatter } }
  ];

  let systemModules = null;
  if (!system.isReady) {
    systemModules = <Loader />;
  } else if (system.error) {
    systemModules = <ErrorText>{system.error}</ErrorText>;
  } else {
    systemModules = (
      <Grid
        scrollable={false}
        data={system.items}
        columns={cloneDeep(columns).map(column => {
          if (column.dataField === 'buildDate') {
            set(column, 'formatExtraData.params.format', 'DD.MM.YYYY HH:mm:ss');
          }
          return column;
        })}
      />
    );
  }

  let alfrescoModules = null;
  if (!alfresco.isReady) {
    alfrescoModules = <Loader />;
  } else if (alfresco.error) {
    alfrescoModules = <ErrorText>{alfresco.error}</ErrorText>;
  } else {
    alfrescoModules = <Grid scrollable={false} data={alfresco.items} columns={columns} />;
  }

  return (
    <>
      <PanelTitle>{t('dev-tools.build.system.panel-title')}</PanelTitle>
      {systemModules}
      <PanelTitle>{t('dev-tools.build.alfresco.panel-title')}</PanelTitle>
      {alfrescoModules}
    </>
  );
};

export default BuildTab;
