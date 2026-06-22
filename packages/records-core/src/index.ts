/**
 * @citeck/records-core — platform-agnostic SDK for the Citeck Records API.
 *
 * Call {@link configure} once at app startup to inject platform adapters
 * (http, i18n, workspace, optional storage), then use the default {@link Records}
 * singleton to query/load/mutate records.
 */

// --- configuration / adapters ---
export { configure, getConfig, isConfigured } from './config';
export type { RecordsAdapters, HttpClient, HttpResponse, HttpRequestOptions, KeyValueStorage, I18n, WorkspaceProvider } from './adapters/types';

// --- core ---
import Records from './Records';
export default Records;
export { registerGlobal } from './Records';
export type { RecordsContainerType } from './Records';

export { default as Record, EVENT_CHANGE } from './Record';
export type { RecordType } from './Record';

export { default as Attribute } from './Attribute';
export { default as RecordWatcher } from './RecordWatcher';
export { default as RecordUpdater } from './RecordUpdater';

// --- api ---
export { recordsQueryFetch, recordsMutateFetch, recordsDeleteFetch, loadAttribute } from './recordsApi';
export * from './constants';

// --- client ---
export { default as recordsClientManager } from './client';
export { default as RecordsClient } from './client/RecordsClient';
export { default as RecordsClientManager } from './client/RecordsClientManager';

// --- utils ---
export { getSourceId, prepareAttsToLoad, replaceAttributeValues, replaceAttrValuesForRecord } from './utils/recordUtils';
export { parseAttribute, mapValueToScalar, split, indexOf, SCALAR_FIELDS } from './utils/attStrUtils';
export { MapBooleanValues } from './utils/maps';

// --- predicates ---
export { Predicates } from './predicates';
export { convertValueByType, convertAttributeValues } from './predicates/util';

// --- types ---
export type {
  Scalar,
  AttributeLike,
  RecordWatcherLike,
  AttributesType,
  PreProcessAttsType,
  PreProcessAttsTypeNotNil,
  PreProcessAttsToLoadWithClientType,
  RequestRecordType,
  ParseAttributeType,
  RecordsQueryResponse
} from './types';
