import get from 'lodash/get';

import { t } from '../../../helpers/util';

export const getProcessLabel = option => {
  return option.disp;
};

export const getProcessValue = option => {
  return option.id;
};

export const getVersionLabel = option => {
  const version = option.version ? option.version : `${option.innerVersion} - ${t('bpmn-admin.inner-version')} `;

  return `${version} (${get(option, 'statistics.incidentCount', 0)}/${get(option, 'statistics.instancesCount', 0)})`;
};

export const getVersionValue = option => {
  const version = option.version ? option.version : `inner_${option.innerVersion}`;

  return String(version);
};
