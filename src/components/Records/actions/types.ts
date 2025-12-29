type RecordsActionBoolResult = boolean;

interface RecordsActionObjResult {
  type: string;
  config: NonNullable<unknown>;
}

type RecordsActionResult = RecordsActionBoolResult | RecordsActionObjResult;

interface RecordActionFeatures {
  execForQuery: boolean;
  execForRecord: boolean;
  execForRecords: boolean;
}

interface ExecForQueryOptions {
  execAsForRecords: boolean;
}

interface RecordAction {
  id: string;
  type: string;
  icon: string;
  name: string;
  pluralName: string;
  config: RecordActionConfig;
  confirm?: ConfirmAction;
  execForRecordsBatchSize: number;
  execForRecordsParallelBatchesCount: number;
  features: RecordActionFeatures;
  execForQueryConfig: ExecForQueryOptions;
  preActionModule: string;
}

interface TaskOutcomeActionConfig {
  label: string;
  outcome: string;
  formRef: string;
  taskRef: string;
  hideConfirmEmptyForm?: boolean;
}

type RecordActionConfig = TaskOutcomeActionConfig | NonNullable<unknown>;

interface ConfirmAction {
  title: string;
  message: string;
  formRef: string;
  modalClass: string;
}

interface RecordActionCtxData {
  context: NonNullable<unknown>;
  recordsMask: number;
}

type RecActionWithCtx = RecordAction & RecordActionCtxData;

interface ForRecordsRes {
  actions: RecActionWithCtx[];
  records: Record<string, number>;
}

interface RecordsActionsRes {
  forRecord: Record<string, Array<RecActionWithCtx>>;
  forRecords: ForRecordsRes;
  forQuery: Record<string, string> | { actions: Array<RecActionWithCtx> };
}

interface RecordsQuery {
  sourceId: string;
  language: string;
  consistency: string;
  query: NonNullable<unknown>;
  page: NonNullable<unknown>;
}

interface PreProcessActionResult {
  preProcessed: boolean;
  configMerged: boolean;
  hasError: boolean;
  config?: NonNullable<unknown>;
  preProcessedRecords?: unknown[];
  results?: unknown[];
}

interface ActionResultInfo {
  type: string;
}

/**
 * @see ResultTypes
 * @property {{message?: String, url?: String, results?: Array}} data
 */

interface ActionResultOptions {
  callback: () => void;
  title: string;
  withConfirm: boolean;
}

interface IterableRecordsConfig {
  amountPerIteration?: number;
}
