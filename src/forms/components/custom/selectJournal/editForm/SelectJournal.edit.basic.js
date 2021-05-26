import get from 'lodash/get';

import SelectJournalEditDisplay from './SelectJournal.edit.display';
import { processEditFormConfig } from '../../../../utils';

const advancedConfig = {
  display: {
    isSelectedValueAsText: { weight: 300 }
  }
};
const tabsByKey = [{ key: 'display', content: SelectJournalEditDisplay }];

processEditFormConfig(advancedConfig, tabsByKey);

export default get(advancedConfig, 'display.components', []);
