import UserNameLinkFormatter from './gql/UserNameLinkFormatter';
import FunctionFormatter from './gql/FunctionFormatter';
import FunctionFormatterV2 from './gql/FunctionFormatterV2';
import DateTimeFormatter from './gql/DateTimeFormatter';
import DateFormatter from './gql/DateFormatter';
import DefaultGqlFormatter from './gql/DefaultGqlFormatter';
import CardDetailsLinkFormatter from './gql/CardDetailsLinkFormatter';
import WorkflowPriorityFormatter from './gql/WorkflowPriorityFormatter/WorkflowPriorityFormatter';
import TaskTitleFormatter from './gql/TaskTitleFormatter';
import DocumentLinkFormatter from './gql/DocumentLinkFormatter';
import DateOrDateTimeFormatter from './gql/DateOrDateTimeFormatter';
import PercentFormatter from './gql/PercentFormatter';
import AssocFormatter from './gql/AssocFormatter';
import BooleanFormatter from './gql/BooleanFormatter';
import SelectFormatter from './gql/SelectFormatter';
import FormFieldFormatter from './gql/FormFieldFormatter';
import StrAndDispFormatter from './gql/StrAndDispFormatter';
import ColoredFormatter from './gql/ColoredFormatter/ColoredFormatter';
import NumberFormatter from './gql/NumberFormatter';
import RejectionSignTaskFormatter from './gql/RejectionSignTaskFormatter';
import TaskLinkFormatter from './gql/TaskLinkFormatter';
import LocaleFormatter from './gql/LocaleFormatter';
import ActionFormatter from './gql/ActionFormatter';
import FileFormatter from './gql/FileFormatter';

/**
 * @deprecated
 * actual until version 2.0
 * use {@link src/components/Journals/service/formatters}
 */
const formatterStore = {
  UserNameLinkFormatter,
  FunctionFormatter,
  FunctionFormatterV2,
  DateTimeFormatter,
  DateFormatter,
  DefaultGqlFormatter,
  CardDetailsLinkFormatter,
  WorkflowPriorityFormatter,
  TaskTitleFormatter,
  DocumentLinkFormatter,
  DateOrDateTimeFormatter,
  PercentFormatter,
  AssocFormatter,
  BooleanFormatter,
  SelectFormatter,
  FormFieldFormatter,
  StrAndDispFormatter,
  ColoredFormatter,
  NumberFormatter,
  RejectionSignTaskFormatter,
  TaskLinkFormatter,
  LocaleFormatter,
  ActionFormatter,
  FileFormatter
};

export default formatterStore;
