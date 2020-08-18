import actionsRegistry from './actionsRegistry';

import EditAction from './handler/executor/EditAction';
import ViewAction from './handler/executor/ViewAction';
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
import EditTaskAssignee from './handler/executor/workflow/EditTaskAssignee';
import UploadNewVersionAction from './handler/executor/UploadNewVersionAction';
import ViewCardTemplateAction from './handler/executor/ViewCardTemplateAction';
import ModuleCopyAction from './handler/executor/ecos-module/ModuleCopyAction';
import CaseCreateNodeAction from './handler/executor/case/CaseCreateNodeAction';
import SaveAsCaseTemplateAction from './handler/executor/SaveAsCaseTemplateAction';
import DownloadCardTemplateAction from './handler/executor/DownloadCardTemplateAction';
import ViewBusinessProcessAction from './handler/executor/workflow/ViewBusinessProcessAction';
import CancelBusinessProcessAction from './handler/executor/workflow/CancelBusinessProcessAction';

import AttributeActionsResolver from './handler/resolver/AttributeActionsResolver';
import DownloadZipAction from './handler/executor/DownloadZipAction';
import ServerGroupAction from './handler/executor/ServerGroupAction';
import MutateAction from './handler/executor/MutateAction';

export { default } from './recordActions';

export const ActionTypes = {
  DOWNLOAD: DownloadAction.ACTION_ID,
  CREATE: CreateAction.ACTION_ID,
  EDIT: EditAction.ACTION_ID,
  VIEW: ViewAction.ACTION_ID,
  BACKGROUND_VIEW: BackgroundOpenAction.ACTION_ID,
  CANCEL_WORKFLOW: CancelBusinessProcessAction.ACTION_ID
};

// Executors - Common

actionsRegistry.register(new DeleteAction());
actionsRegistry.register(new EditAction());
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
actionsRegistry.register(new DownloadZipAction());
actionsRegistry.register(new ServerGroupAction());
actionsRegistry.register(new MutateAction());

// Executors - Case

actionsRegistry.register(new CaseCreateNodeAction());
actionsRegistry.register(new CaseRedirectAction());
actionsRegistry.register(new CaseRequestAction());

// Executors - Workflow

actionsRegistry.register(new CancelBusinessProcessAction());
actionsRegistry.register(new EditTaskAssignee());
actionsRegistry.register(new ViewBusinessProcessAction());

// Executors - ECOS Module

actionsRegistry.register(new ModuleCopyAction());

// Resolvers

actionsRegistry.register(new AttributeActionsResolver());
