import UserNameLinkFormatter from './gql/UserNameLinkFormatter';
import FunctionFormatter from './gql/FunctionFormatter';
import DateTimeFormatter from './gql/DateTimeFormatter';
import DefaultGqlFormatter from './gql/DefaultGqlFormatter';
import CardDetailsLinkFormatter from './gql/CardDetailsLinkFormatter';
import WorkflowPriorityFormatter from './gql/WorkflowPriorityFormatter/WorkflowPriorityFormatter';
import TaskTitleFormatter from './gql/TaskTitleFormatter';
import DocumentLinkFormatter from './gql/DocumentLinkFormatter';
import DateOrDateTimeFormatter from './gql/DateOrDateTimeFormatter';
import PercentFormatter from './gql/PercentFormatter';
import BooleanFormatter from './gql/BooleanFormatter';
import SelectFormatter from './gql/SelectFormatter';

const formatterStore = {
  UserNameLinkFormatter,
  FunctionFormatter,
  DateTimeFormatter,
  DefaultGqlFormatter,
  CardDetailsLinkFormatter,
  WorkflowPriorityFormatter,
  TaskTitleFormatter,
  DocumentLinkFormatter,
  DateOrDateTimeFormatter,
  PercentFormatter,
  BooleanFormatter,
  SelectFormatter
};

export default formatterStore;
