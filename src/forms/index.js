import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import Button from './components/override/button';
import { Column, Columns } from './components/override/columns';
import Checkbox from './components/override/checkbox';
import Currency from './components/override/currency';
import DataMap from './components/override/datamap';
import DateTime from './components/override/datetime';
import Email from './components/override/email';
import File from './components/override/file';
import HTML from './components/override/html';
import Number from './components/override/number';
import Panel from './components/override/panel';
import PhoneNumber from './components/override/phonenumber';
import Radio from './components/override/radio';
import Select from './components/override/select';
import Tabs from './components/override/tabs';
import TextArea from './components/override/textarea';
import TextField from './components/override/textfield';
import Url from './components/override/url';

import AsyncData from './components/custom/asyncData';
import DataGridAssoc from './components/custom/datagridAssoc';
import EcosSelect from './components/custom/ecosSelect';
import HorizontalLine from './components/custom/horizontalLine';
import MLText from './components/custom/mlText';
import SelectJournal from './components/custom/selectJournal';
import SelectAction from './components/custom/selectAction';
import SelectOrgstruct from './components/custom/selectOrgstruct';
import TableForm from './components/custom/tableForm';
import TaskOutcome from './components/custom/taskOutcome/index';

import './prototypeMutation';

Components.setComponents({
  ...DefaultComponents,
  asyncData: AsyncData,
  button: Button,
  checkbox: Checkbox,
  column: Column,
  columns: Columns,
  currency: Currency,
  datagridAssoc: DataGridAssoc,
  datamap: DataMap,
  datetime: DateTime,
  ecosSelect: EcosSelect,
  email: Email,
  file: File,
  horizontalLine: HorizontalLine,
  htmlelement: HTML,
  mlText: MLText,
  number: Number,
  panel: Panel,
  phoneNumber: PhoneNumber,
  radio: Radio,
  select: Select,
  selectJournal: SelectJournal,
  selectAction: SelectAction,
  selectOrgstruct: SelectOrgstruct,
  tableForm: TableForm,
  tabs: Tabs,
  taskOutcome: TaskOutcome,
  textarea: TextArea,
  textfield: TextField,
  url: Url
});

export { Components };
