import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import Checkbox from './override/checkbox';

import SelectJournal from './custom/selectJournal';
import SelectOrgstruct from './custom/selectOrgstruct';
import EcosSelect from './custom/ecosSelect';
import AsyncData from './custom/asyncData';

Components.setComponents({
  ...DefaultComponents,
  checkbox: Checkbox,

  selectJournal: SelectJournal,
  selectOrgstruct: SelectOrgstruct,
  ecosSelect: EcosSelect,
  asyncData: AsyncData
});
