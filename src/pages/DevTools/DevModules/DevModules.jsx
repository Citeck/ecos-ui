import React, { useContext, useEffect } from 'react';

import PanelTitle from '../../../components/common/PanelTitle/PanelTitle';
import { t } from '../../../helpers/util';

import { DevModulesContext } from './DevModulesContext';
import Loader from '../Loader';
import ErrorText from '../ErrorText';
import DevModulesGrid from './DevModulesGrid';

const DevModulesTab = () => {
  const context = useContext(DevModulesContext);
  const { state, getDevModulesData } = context;
  const { isReady, error } = state;

  useEffect(() => {
    getDevModulesData();
  }, []);

  let devModulesContent = null;
  if (error) {
    devModulesContent = <ErrorText>{error}</ErrorText>;
  } else if (!isReady) {
    devModulesContent = <Loader />;
  } else {
    devModulesContent = <DevModulesGrid />;
  }

  return (
    <>
      <PanelTitle>{t('dev-tools.dev-modules.panel-title')}</PanelTitle>
      {devModulesContent}
    </>
  );
};

export default DevModulesTab;
