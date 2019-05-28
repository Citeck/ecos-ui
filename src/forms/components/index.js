import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import { Column, Columns } from './override/columns';
import Checkbox from './override/checkbox';
import Panel from './override/panel';
import Tabs from './override/tabs';

import SelectJournal from './custom/selectJournal';
import SelectOrgstruct from './custom/selectOrgstruct';
import EcosSelect from './custom/ecosSelect';
import AsyncData from './custom/asyncData';
import TableForm from './custom/tableForm';

Components.setComponents({
  ...DefaultComponents,
  column: Column,
  columns: Columns,
  checkbox: Checkbox,
  panel: Panel,
  tabs: Tabs,
  selectJournal: SelectJournal,
  selectOrgstruct: SelectOrgstruct,
  ecosSelect: EcosSelect,
  asyncData: AsyncData,
  tableForm: TableForm
});
