import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import Button from './components/override/button';
import { Column, Columns } from './components/override/columns';
import Checkbox from './components/override/checkbox';
import Currency from './components/override/currency';
import DateTime from './components/override/datetime';
import Email from './components/override/email';
import File from './components/override/file';
import HTML from './components/override/html';
import Number from './components/override/number';
import Panel from './components/override/panel';
import PhoneNumber from './components/override/phonenumber';
import Radio from './components/override/radio';
import Tabs from './components/override/tabs';
import TextArea from './components/override/textarea';
import TextField from './components/override/textfield';
import Url from './components/override/url';

import AsyncData from './components/custom/asyncData';
import DataGridAssoc from './components/custom/datagridAssoc';
import EcosSelect from './components/custom/ecosSelect';
import HorizontalLine from './components/custom/horizontalLine';
import SelectJournal from './components/custom/selectJournal';
import SelectAction from './components/custom/selectAction';
import SelectOrgstruct from './components/custom/selectOrgstruct';
import TableForm from './components/custom/tableForm';
import TaskOutcome from './components/custom/taskOutcome/index';
import MLInput from './components/custom/multiLangInput';

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
  datetime: DateTime,
  ecosSelect: EcosSelect,
  email: Email,
  file: File,
  horizontalLine: HorizontalLine,
  htmlelement: HTML,
  number: Number,
  panel: Panel,
  phoneNumber: PhoneNumber,
  radio: Radio,
  selectJournal: SelectJournal,
  selectAction: SelectAction,
  selectOrgstruct: SelectOrgstruct,
  tableForm: TableForm,
  tabs: Tabs,
  textarea: TextArea,
  textfield: TextField,
  url: Url,
  taskOutcome: TaskOutcome,
  multiLangInput: MLInput
});
