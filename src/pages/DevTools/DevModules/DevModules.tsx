import React, { useContext, useEffect } from 'react';

import PanelTitle from '../../../components/common/PanelTitle/PanelTitle';
import { t } from '../../../helpers/util';
import ErrorText from '../ErrorText';
import Loader from '../Loader';

import { DevModulesContext } from './DevModulesContext';
import DevModulesGrid from './DevModulesGrid';

export const Labels = {
  title: 'dev-tools.dev-modules.panel-title',
};

const DevModulesTab = (): React.JSX.Element => {
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
      <PanelTitle>{t(Labels.title)}</PanelTitle>
      {devModulesContent}
    </>
  );
};

export default DevModulesTab;
