import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import Button from './override/button';
import { Column, Columns } from './override/columns';
import Checkbox from './override/checkbox';
import DateTime from './override/datetime';
import File from './override/file';
import Number from './override/number';
import Panel from './override/panel';
import Tabs from './override/tabs';

import SelectJournal from './custom/selectJournal';
import SelectOrgstruct from './custom/selectOrgstruct';
import EcosSelect from './custom/ecosSelect';
import AsyncData from './custom/asyncData';
import TableForm from './custom/tableForm';
import HorizontalLine from './custom/horizontalLine';
import DataGridAssoc from './custom/datagridAssoc';

import './prototypeMutation';

Components.setComponents({
  ...DefaultComponents,
  button: Button,
  column: Column,
  columns: Columns,
  checkbox: Checkbox,
  datetime: DateTime,
  file: File,
  number: Number,
  panel: Panel,
  tabs: Tabs,
  selectJournal: SelectJournal,
  selectOrgstruct: SelectOrgstruct,
  ecosSelect: EcosSelect,
  asyncData: AsyncData,
  tableForm: TableForm,
  horizontalLine: HorizontalLine,
  datagridAssoc: DataGridAssoc
});
