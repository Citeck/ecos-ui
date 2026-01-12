/* eslint-disable */
import actionsRegistry from './actionsRegistry';

import AttributeActionsResolver from './handler/resolver/AttributeActionsResolver';
import TasksActionsResolver from './handler/resolver/TasksActionsResolver';

import ViewBusinessProcessAction from './handler/executor/workflow/ViewBusinessProcessAction';
import CancelBusinessProcessAction from './handler/executor/workflow/CancelBusinessProcessAction';
import EditTaskAssignee from './handler/executor/workflow/EditTaskAssignee';
import SetTaskAssignee from './handler/executor/workflow/SetTaskAssignee';
import TaskOutcomeAction from './handler/executor/workflow/TaskOutcomeAction';
import OpenSubmitAction from './handler/executor/workflow/OpenSubmitAction';
import OpenTaskActions from './handler/executor/workflow/OpenTaskActions';

import EditAction from './handler/executor/EditAction';
import EditMenuAction from './handler/executor/EditMenuAction';
import EditPasswordAction from './handler/executor/EditPasswordAction';
import EditPermissionsAction from './handler/executor/EditPermissionsAction';
import ViewAction from './handler/executor/ViewAction';
import ViewCardTemplateAction from './handler/executor/ViewCardTemplateAction';
import ViewMenuAction from './handler/executor/ViewMenuAction';
import AssocAction from './handler/executor/AssocAction';
import FetchAction from './handler/executor/FetchAction';
import DeleteAction from './handler/executor/DeleteAction';
import ScriptAction from './handler/executor/ScriptAction';
import CreateAction from './handler/executor/CreateAction';
import OpenUrlAction from './handler/executor/OpenUrlAction';
import DownloadAction from './handler/executor/DownloadAction';
import PreviewModalAction from './handler/executor/PreviewModalAction';
import CaseRequestAction from './handler/executor/case/CaseRequestAction';
import BackgroundOpenAction from './handler/executor/BackgroundOpenAction';
import CaseRedirectAction from './handler/executor/case/CaseRedirectAction';
import UploadNewVersionAction from './handler/executor/UploadNewVersionAction';
import ModuleCopyAction from './handler/executor/ecos-module/ModuleCopyAction';
import CaseCreateNodeAction from './handler/executor/case/CaseCreateNodeAction';
import SaveAsCaseTemplateAction from './handler/executor/SaveAsCaseTemplateAction';
import DownloadCardTemplateAction from './handler/executor/DownloadCardTemplateAction';
import DownloadZipAction from './handler/executor/DownloadZipAction';
import ServerGroupAction from './handler/executor/ServerGroupAction';
import ServerGroupActionV2 from './handler/executor/ServerGroupActionV2';
import MutateAction from './handler/executor/MutateAction';
import EditTypePermissionsAction from './handler/executor/EditTypePermissionsAction';
import DebugFormAction from './handler/executor/DebugFormAction';
import EditJsonAction from './handler/executor/EditJsonAction';
import RecordsExport from './handler/executor/RecordsExport';
import EditJournalPresetAction from './handler/executor/EditJournalPresetAction';
import DownloadByTemplateAction from './handler/executor/DownloadByTemplateAction';
import RecordCopyAction from './handler/executor/RecordCopyAction';
import TransformAction from './handler/executor/TransformAction';
import CustomUiAction from './handler/executor/CustomUiAction';
import MigrateTokenAction from './handler/executor/MigrateTokenAction';
import UserEventAction from './handler/executor/UserEventAction';

export { default } from './recordActions';

// Executors - Common

export const registerAllActions = () => {
  actionsRegistry.register(new DeleteAction());
  actionsRegistry.register(new EditAction());
  actionsRegistry.register(new EditMenuAction());
  actionsRegistry.register(new EditPermissionsAction());
  actionsRegistry.register(new AssocAction());
  actionsRegistry.register(new BackgroundOpenAction());
  actionsRegistry.register(new CreateAction());
  actionsRegistry.register(new DownloadAction());
  actionsRegistry.register(new DownloadCardTemplateAction());
  actionsRegistry.register(new FetchAction());
  actionsRegistry.register(new OpenUrlAction());
  actionsRegistry.register(new PreviewModalAction());
  actionsRegistry.register(new SaveAsCaseTemplateAction());
  actionsRegistry.register(new ScriptAction());
  actionsRegistry.register(new UploadNewVersionAction());
  actionsRegistry.register(new ViewAction());
  actionsRegistry.register(new ViewCardTemplateAction());
  actionsRegistry.register(new ViewMenuAction());
  actionsRegistry.register(new DownloadZipAction());
  actionsRegistry.register(new ServerGroupAction());
  actionsRegistry.register(new ServerGroupActionV2());
  actionsRegistry.register(new MutateAction());
  actionsRegistry.register(new EditTypePermissionsAction());
  actionsRegistry.register(new EditPasswordAction());
  actionsRegistry.register(new DebugFormAction());
  actionsRegistry.register(new EditJsonAction());
  actionsRegistry.register(new RecordsExport());
  actionsRegistry.register(new EditJournalPresetAction());
  actionsRegistry.register(new DownloadByTemplateAction());
  actionsRegistry.register(new RecordCopyAction());
  actionsRegistry.register(new TransformAction());
  actionsRegistry.register(new CustomUiAction());
  actionsRegistry.register(new MigrateTokenAction());
  actionsRegistry.register(new UserEventAction());

  // Executors - Case

  actionsRegistry.register(new CaseCreateNodeAction());
  actionsRegistry.register(new CaseRedirectAction());
  actionsRegistry.register(new CaseRequestAction());

  // Executors - Workflow

  actionsRegistry.register(new CancelBusinessProcessAction());
  actionsRegistry.register(new EditTaskAssignee());
  actionsRegistry.register(new SetTaskAssignee());
  actionsRegistry.register(new TaskOutcomeAction());
  actionsRegistry.register(new ViewBusinessProcessAction());
  actionsRegistry.register(new OpenSubmitAction());
  actionsRegistry.register(new OpenTaskActions());

  // Executors - ECOS Module

  actionsRegistry.register(new ModuleCopyAction());

  // Resolvers

  actionsRegistry.register(new AttributeActionsResolver());
  actionsRegistry.register(new TasksActionsResolver());
};
