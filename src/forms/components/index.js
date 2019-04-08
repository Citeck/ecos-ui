import SelectJournal from './custom/selectJournal';
import SelectOrgstruct from './custom/selectOrgstruct';

import Select from './override/select';

import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

Components.setComponents({
  ...DefaultComponents,
  selectJournal: SelectJournal,
  selectOrgstruct: SelectOrgstruct,
  select: Select
});
