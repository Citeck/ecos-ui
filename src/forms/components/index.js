import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import Button from './override/button';
import { Column, Columns } from './override/columns';
import Checkbox from './override/checkbox';
import Currency from './override/currency';
import DateTime from './override/datetime';
import Email from './override/email';
import File from './override/file';
import HTML from './override/html';
import Number from './override/number';
import Panel from './override/panel';
import PhoneNumber from './override/phonenumber';
import Tabs from './override/tabs';
import TextArea from './override/textarea';
import TextField from './override/textfield';
import Url from './override/url';

import AsyncData from './custom/asyncData';
import DataGridAssoc from './custom/datagridAssoc';
import EcosSelect from './custom/ecosSelect';
import HorizontalLine from './custom/horizontalLine';
import SelectJournal from './custom/selectJournal';
import SelectOrgstruct from './custom/selectOrgstruct';
import TableForm from './custom/tableForm';

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
  selectJournal: SelectJournal,
  selectOrgstruct: SelectOrgstruct,
  tableForm: TableForm,
  tabs: Tabs,
  textarea: TextArea,
  textfield: TextField,
  url: Url
});
