import DefaultComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

import Base from './override/base';
import Button from './override/button';
import { Column, Columns } from './override/columns';
import Checkbox from './override/checkbox';
import Currency from './override/currency';
import DataMap from './override/datamap';
import DateTime from './override/datetime';
import Email from './override/email';
import File from './override/file';
import HTML from './override/html';
import Nested from './override/nested/NestedComponent';
import Number from './override/number';
import Panel from './override/panel';
import PhoneNumber from './override/phonenumber';
import Radio from './override/radio';
import Select from './override/select';
import Tabs from './override/tabs';
import TextArea from './override/textarea';
import TextField from './override/textfield';
import Url from './override/url';
import Hidden from './override/hidden';

import AsyncData from './custom/asyncData';
import DataGridAssoc from './custom/datagridAssoc';
import EcosSelect from './custom/ecosSelect';
import HorizontalLine from './custom/horizontalLine';
import MLText from './custom/mlText';
import MLTextarea from './custom/mlTextarea';
import SelectJournal from './custom/selectJournal';
import SelectAction from './custom/selectAction';
import SelectOrgstruct from './custom/selectOrgstruct';
import TableForm from './custom/tableForm';
import TaskOutcome from './custom/taskOutcome/index';
import ImportButton from './custom/importButton';

Components.setComponents({
  ...DefaultComponents,
  asyncData: AsyncData,
  base: Base,
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
  mlTextarea: MLTextarea,
  nested: Nested,
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
  url: Url,
  hidden: Hidden,
  importButton: ImportButton
});

export { Components };
