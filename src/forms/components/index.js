import SelectJournal from './custom/selectJournal';
import SelectOrgstruct from './custom/selectOrgstruct';
import EcosSelect from './custom/ecosSelect';

import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

Components.setComponents({
  ...DefaultComponents,
  selectJournal: SelectJournal,
  selectOrgstruct: SelectOrgstruct,
  ecosSelect: EcosSelect
});
