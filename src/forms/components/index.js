import SelectJournal from './custom/selectJournal';
import SelectOrgstruct from './custom/selectOrgstruct';
import EcosSelect from './custom/ecosSelect';
import AsyncData from './custom/asyncData';

import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import Tabs from './override/tabs/Tabs';
import TabsEditor from 'formiojs/components/tabs/Tabs.form';
Tabs.editForm = TabsEditor;

Components.setComponents({
  ...DefaultComponents,
  selectJournal: SelectJournal,
  selectOrgstruct: SelectOrgstruct,
  ecosSelect: EcosSelect,
  asyncData: AsyncData,
  tabs: Tabs
});
