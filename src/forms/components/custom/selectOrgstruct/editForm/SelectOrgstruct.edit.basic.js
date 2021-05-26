import get from 'lodash/get';

import SelectOrgstructEditDisplay from './SelectOrgstruct.edit.display';
import { processEditFormConfig } from '../../../../utils';

const advancedConfig = {
  display: {
    isSelectedValueAsText: { weight: 300 }
  }
};
const tabsByKey = [{ key: 'display', content: SelectOrgstructEditDisplay }];

processEditFormConfig(advancedConfig, tabsByKey);

export default get(advancedConfig, 'display.components', []);
