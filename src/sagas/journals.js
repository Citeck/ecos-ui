import cloneDeep from 'lodash/cloneDeep';
import concat from 'lodash/concat';
import getFirst from 'lodash/first';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import omit from 'lodash/omit';
import set from 'lodash/set';
import * as queryString from 'query-string';
import { call, put, all, race, select, take, takeEvery, takeLatest } from 'redux-saga/effects';

import {
  applyJournalSetting,
  cancelGoToPageJournal,
  cancelInitJournal,
  cancelLoadGrid,
  cancelReloadGrid,
  checkConfig,
  createJournalSetting,
  deleteJournalSetting,
  editJournalSetting,
  execJournalAction,
  execRecordsAction,
  execRecordsActionComplete,
  getDashletConfig,
  getDashletEditorData,
  getJournalsData,
  getJournalWidgetsConfig,
  getNextPage,
  goToJournalsPage,
  initJournal,
  initJournalSettingData,
  initPreview,
  openSelectedJournal,
  openSelectedPreset,
  reloadGrid,
  reloadJournalConfig,
  reloadTreeGrid,
  resetFiltering,
  resetJournalSettingData,
  runSearch,
  saveDashlet,
  saveJournalSetting,
  saveRecords,
  selectJournal,
  selectPreset,
  setCheckLoading,
  setColumnsSetup,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setFooterValue,
  setForceUpdate,
  setGrid,
  setGridInlineToolSettings,
  setGrouping,
  setJournalConfig,
  setJournalExistStatus,
  setJournalExpandableProp,
  setJournalSetting,
  setJournalSettings,
  setJournalWidgetsConfig,
  setLoading,
  setLoadingGrid,
  setOriginGridSettings,
  setPredicate,
  setPreviewFileName,
  setPreviewUrl,
  setSearching,
  setSelectAllPageRecords,
  setSelectAllRecordsVisible,
  setSelectedJournals,
  setSelectedRecords,
  setUrl,
  toggleViewMode
} from '../actions/journals';
import { applyPreset, clearFiltered, reloadBoardData, selectTemplateId, setKanbanSettings } from '../actions/kanban';
import { setIsEnabledPreviewList, setLoadingPreviewList, setPreviewListConfig } from '../actions/previewList';
import { ParserPredicate } from '../components/Filters/predicates';
import {
  DEFAULT_INLINE_TOOL_SETTINGS,
  DEFAULT_PAGINATION,
  isKanban,
  JOURNAL_DASHLET_CONFIG_VERSION
} from '../components/Journals/constants';
import JournalsService, { EditorService, PresetsServiceApi } from '../components/Journals/service';
import Records from '../components/Records';
import ActionsRegistry from '../components/Records/actions/actionsRegistry';
import { ActionTypes } from '../components/Records/actions/constants';
import { PREDICATE_EQ } from '../components/Records/predicates/predicates';
import { convertAttributeValues } from '../components/Records/predicates/util';
import { JournalUrlParams, SourcesId } from '../constants';
import { GROUPING_COUNT_ALL } from '../constants/journal';
import JournalsConverter from '../dto/journals';
import { wrapArgs, wrapSaga } from '../helpers/redux';
import { decodeLink, getFilterParam, getSearchParams, getUrlWithoutOrigin, removeUrlSearchParams } from '../helpers/urls';
import { beArray, hasInString, isNodeRef, t } from '../helpers/util';
import { emptyJournalConfig, initialStateGrouping } from '../reducers/journals';
import {
  selectGridPaginationMaxItems,
  selectJournalConfig,
  selectJournalData,
  selectJournalPagination,
  selectJournalSetting,
  selectJournalSettings,
  selectJournalTotalCount,
  selectNewVersionDashletConfig,
  selectUrl,
  selectViewMode
} from '../selectors/journals';
import { selectKanban } from '../selectors/kanban';
import { selectIsViewNewJournal } from '../selectors/view';
import PageService from '../services/PageService';

import { NotificationManager } from '@/services/notifications';

const attsForListView = {
  creator: '_creator{id:?id,disp:?disp}',
  created: '_created'
};

const getDefaultSortBy = config => {
  const params = config.params || {};
  // eslint-disable-next-line
  const defaultSortBy = params.defaultSortBy ? eval('(' + params.defaultSortBy + ')') : [];

  return defaultSortBy.map(item => ({
    attribute: item.id,
    ascending: item.order !== 'desc'
  }));
};

function* getColumnsSum(api, w, columns, journalId, predicates) {
  try {
    if (!columns || !columns.length || !journalId) {
      return;
    }

    const countFields = [];

    columns.forEach(column => {
      if (column.hasTotalSumField) {
        countFields.push(column.attribute);
      }
    });

    if (countFields.length) {
      const sumFieldsLoading = {};

      countFields.forEach(countField => {
        sumFieldsLoading[countField] = 'loading';
      });

      yield put(setFooterValue(w(sumFieldsLoading)));

      let query;

      if (predicates) {
        const cleanPredicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(predicates));
        query = convertAttributeValues(cleanPredicates, columns);
        query = JournalsConverter.optimizePredicate({ t: 'and', val: query });
      }

      const journalType = yield Records.get(`uiserv/rjournal@${journalId}`).load('typeRef?str');
      const result = yield call(api.journals.getTotalSum, journalType, countFields, query);
      const sumFields = {};

      if (result) {
        Object.keys(result).forEach(key => {
          const attributeName = key.replace('sum(', '').replace(')', '');

          sumFields[attributeName] = result[key];
        });
      }

      yield put(setFooterValue(w(sumFields)));
    } else {
      yield put(setFooterValue(w(null)));
    }
  } catch (e) {
    yield put(setFooterValue(w(null)));
    NotificationManager.error(t('journal.footer-sum.error'));
    console.error('[journals getColumnsSum saga error', e);
  }
}

export function getDefaultJournalSetting(journalConfig) {
  const { groupBy } = get(journalConfig, 'meta', {});
  const columns = get(journalConfig, 'columns', []);

  return {
    sortBy: getDefaultSortBy(journalConfig).map(sort => ({ ...sort })),
    groupBy: groupBy ? Array.from(groupBy) : [],
    grouping: {
      needCount: false,
      columns: [],
      groupBy: []
    },
    needCount: false,
    columns: columns.map(col => ({ ...col })),
    predicate: ParserPredicate.getDefaultPredicates(columns, undefined, journalConfig.defaultFilters)
  };
}

export function getGridParams({ journalConfig = {}, journalSetting = {}, pagination = DEFAULT_PAGINATION }) {
  const { createVariants, actions: journalActions, groupActions } = get(journalConfig, 'meta', {});
  const { sourceId, id: journalId, columns: columnsConfig, listViewInfo = {} } = journalConfig;
  const { sortBy = [], groupBy = [], columns: columnsSetting, predicate: journalSettingPredicate } = journalSetting;
  const predicates = beArray(journalSettingPredicate);

  const columns = columnsConfig || columnsSetting || [];

  const listViewAttrs = Object.keys(listViewInfo).reduce((result, key) => {
    if (listViewInfo[key] && !listViewInfo[key].includes('undefined')) {
      return { ...result, [key]: listViewInfo[key] };
    }

    return result;
  }, {});

  return {
    attributes: { ...attsForListView, ...listViewAttrs },
    groupActions: groupActions || [],
    journalId,
    journalActions,
    createVariants,
    sourceId,
    sortBy: sortBy.map(sort => ({ ...sort })),
    columns: columns.map(col => ({ ...col })),
    groupBy: Array.from(groupBy),
    isExpandedFromGrouped: false,
    predicates,
    pagination: { ...pagination },
    grouping: journalSetting.grouping
  };
}

function* sagaGetDashletEditorData({ api, stateId, w }, action) {
  try {
    const config = action.payload || {};
    yield getJournalSettings(api, config.journalId, w, stateId);
  } catch (e) {
    console.error('[journals sagaGetDashletEditorData saga error', e);
  }
}

function* sagaGetDashletConfig({ api, stateId, w }, action) {
  try {
    const config = yield call(api.journals.getDashletConfig, action.payload);

    if (config) {
      const { journalId, journalSettingId = '', customJournal, customJournalMode, journalsListIds } = config;

      yield put(setEditorMode(w(isEmpty(journalsListIds))));
      yield put(setDashletConfig(w(config)));
      yield put(initJournal(w({ journalId, journalSettingId, customJournal, customJournalMode })));
    } else {
      yield put(setEditorMode(w(true)));
    }
  } catch (e) {
    console.error('[journals sagaGetDashletConfig saga error', e);
  }
}

function* sagaSetDashletConfigFromParams({ api, stateId, w }, action) {
  try {
    const { config = {}, lsJournalId, recordRef } = action.payload;
    const configByVersion = config[JOURNAL_DASHLET_CONFIG_VERSION];

    if (isEmpty(config) || (config.version !== JOURNAL_DASHLET_CONFIG_VERSION && isEmpty(configByVersion))) {
      yield put(setEditorMode(w(true)));
      yield put(setLoading(w(false)));
      return;
    }

    const { journalId: configJournalId, journalSettingId = '', customJournal, customJournalMode, journalsListIds } = configByVersion;
    const headJournalsListId = getFirst(journalsListIds);

    let editorMode = false;
    let journalId = configJournalId || lsJournalId;
    let dataInitJournal;

    switch (true) {
      case !!(customJournalMode && customJournal):
        journalId = yield _resolveTemplate(recordRef, customJournal);
        dataInitJournal = { journalId };
        break;
      case !!headJournalsListId:
        let selectedJournals = yield call(api.journals.getJournalsByIds, journalsListIds, { id: 'id', title: '.disp' });
        yield put(setSelectedJournals(w(selectedJournals)));
        journalId = headJournalsListId;
        dataInitJournal = { journalId, journalSettingId };
        break;
      case !!journalId:
        dataInitJournal = { journalId, journalSettingId };
        break;
      default:
        editorMode = true;
        yield put(setLoading(w(false)));
        break;
    }

    yield put(setDashletConfig(w(config)));
    dataInitJournal && (yield put(initJournal(w(dataInitJournal))));
    yield put(setEditorMode(w(editorMode)));
  } catch (e) {
    console.error('[journals sagaSetDashletConfigFromParams saga error', e);
  }
}

function* _resolveTemplate(recordRef, template) {
  if (!recordRef || template.indexOf('$') === -1) {
    return template;
  }

  let keyExp = /\${(.+?)}/g;
  let attributesMap = {};
  let it = keyExp.exec(template);

  while (it) {
    attributesMap[it[1]] = true;
    it = keyExp.exec(template);
  }

  let attributes = Object.keys(attributesMap);

  if (!attributes.length) {
    return template;
  }

  let attsValues = yield Records.get(recordRef).load(attributes);

  for (let att in attsValues) {
    if (attsValues.hasOwnProperty(att)) {
      let value = attsValues[att] || '';
      template = template.split('${' + att + '}').join(value);
    }
  }

  return template;
}

function* sagaGetJournalsData({ api, stateId, w }, { payload }) {
  try {
    if (get(payload, 'force')) {
      yield put(cancelGoToPageJournal());
      yield put(cancelReloadGrid());
    }

    const url = yield select(selectUrl, stateId);
    const isViewNewJournal = yield select(selectIsViewNewJournal);
    const { journalId, journalSettingId = '', userConfigId } = url;

    yield put(setJournalExpandableProp(w(false)));

    if (!isViewNewJournal) {
      yield put(setGrid(w({ pagination: DEFAULT_PAGINATION })));
    }

    yield put(initJournal(w({ journalId, journalSettingId, userConfigId, ...payload })));
  } catch (e) {
    console.error('[journals sagaGetJournalsData saga error', e);
  }
}

function* getJournalSettings(api, journalId, w, stateId) {
  const settings = yield call([PresetsServiceApi, PresetsServiceApi.getJournalPresets], { journalId });
  const journalConfig = yield select(selectJournalConfig, stateId);
  if (isArray(settings)) {
    settings.forEach(preset => {
      set(preset, 'settings.columns', JournalsConverter.filterColumnsByConfig(get(preset, 'columns'), journalConfig.columns));
    });
  }

  yield put(setJournalSettings(w(settings)));
  return settings;
}

export function* getJournalConfig({ api, w, force, callback, stateId }, action) {
  const url = yield select(selectUrl, stateId);
  const { journalSettingId = '' } = url;

  const journalId = isString(action) ? action : get(action, 'payload.journalId');
  w = w || get(action, 'payload.w');
  force = get(action, 'payload.force') || force;
  callback = get(action, 'payload.callback') || callback;
  const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], journalId, force, journalSettingId);

  yield put(setJournalConfig(w(journalConfig)));
  if (isFunction(callback)) {
    yield call(callback, journalConfig.createVariants);
  }

  return journalConfig;
}

function* getColumns({ stateId, force = false }) {
  const { grid = {}, journalConfig = {}, journalSetting = {}, grouping = {} } = yield select(selectJournalData, stateId);
  const groupingColumns = get(grouping, 'columns');
  const columns = yield JournalsService.resolveColumns(isEmpty(groupingColumns) || force ? journalConfig.columns : groupingColumns);

  if (grid.isExpandedFromGrouped) {
    return grid.columns;
  }

  if (columns.length) {
    const finalCols = columns.map(column => {
      const config = get(journalSetting, 'columns', []).find(setting => setting.attribute === column.attribute);
      return config ? { ...column, ...config } : column;
    });

    if (isArray(get(journalSetting, 'columns')) && journalSetting.columns !== 0) {
      const journalColAttributes = journalSetting.columns.map(journalCol => journalCol.attribute);

      const orderedCols = journalSetting.columns
        .map(journalCol => finalCols.find(finalCol => finalCol.attribute === journalCol.attribute))
        .filter(Boolean);

      const remainingCols = finalCols.filter(finalCol => !journalColAttributes.includes(finalCol.attribute));

      return [...orderedCols, ...remainingCols];
    }

    return finalCols;
  }

  return columns;
}

export function* getJournalSettingFully(api, { journalConfig, stateId }, w) {
  const url = yield select(selectUrl, stateId);
  const { journalSettingId = '', userConfigId } = url;

  const sharedSettings = yield getJournalSharedSettings(api, userConfigId) || {};

  if (!isEmpty(sharedSettings) && !isEmpty(sharedSettings.columns)) {
    sharedSettings.columns = yield JournalsService.resolveColumns(sharedSettings.columns);
  }

  return yield getJournalSetting(api, { journalSettingId, journalConfig, sharedSettings, stateId }, w);
}

function* getJournalSetting(api, { journalSettingId, journalConfig, sharedSettings, stateId, initPredicate }, w) {
  try {
    const { journalSetting: _journalSetting = {} } = yield select(selectJournalData, stateId);
    let journalSetting = null;

    if (sharedSettings) {
      journalSetting = sharedSettings;
    } else {
      journalSettingId = journalSettingId || journalConfig.journalSettingId;

      if (!journalSettingId) {
        journalSettingId = yield call(api.journals.getLsJournalSettingId, journalConfig.id);
      }

      if (journalSettingId) {
        const preset = yield call([PresetsServiceApi, PresetsServiceApi.getPreset], { id: journalSettingId });
        const _journalConfig = yield call(
          [JournalsService, JournalsService.getJournalConfig],
          get(preset, 'journalId'),
          false,
          journalSettingId
        );

        if (isEmpty(preset) || isEmpty(preset.settings)) {
          NotificationManager.error(t('journal.presets.error.get-one'));
          journalSetting = getDefaultJournalSetting(journalConfig);
        } else {
          if (!get(preset.settings, 'grouping') && !isEmpty(get(preset.settings, 'journalSetting'))) {
            if (!get(preset.settings, 'journalSetting.grouping')) {
              journalSetting = {
                ...preset.settings,
                grouping: initialStateGrouping,
                groupBy: [],

                journalSetting: {
                  ...preset.settings.journalSetting,
                  grouping: initialStateGrouping,
                  groupBy: []
                }
              };
            } else {
              journalSetting = {
                ...preset.settings,
                grouping: initialStateGrouping,
                groupBy: []
              };
            }
          } else {
            journalSetting = { ...preset.settings };
          }
        }

        if (!journalSetting) {
          yield call(api.journals.setLsJournalSettingId, journalConfig.id, '');
        }

        if (journalSetting && _journalConfig && journalSetting.columns && _journalConfig.columns) {
          journalSetting.columns.forEach(column => {
            if (column) {
              const columnConfig = _journalConfig.columns.find(c => c.name === column.name);

              if (columnConfig && columnConfig.width) {
                column.width = columnConfig.width;
              }
            }
          });
        }
      }

      if (!journalSetting && hasInString(window.location.href, JournalUrlParams.JOURNAL_SETTING_ID)) {
        const url = removeUrlSearchParams(window.location.href, JournalUrlParams.JOURNAL_SETTING_ID);
        window.history.replaceState({ path: url }, '', url);

        journalSetting = getDefaultJournalSetting(journalConfig);
      }

      if (isEmpty(journalSettingId) && isEmpty(journalSetting)) {
        journalSetting = getDefaultJournalSetting(journalConfig);
      }
    }

    journalSetting = { ..._journalSetting, ...journalSetting, id: journalSettingId };

    /* It is necessary to synchronize the filter when switching from kanban to log initialization */
    if (initPredicate && _journalSetting.predicate && !isEqual(_journalSetting.predicate, journalSetting.predicate)) {
      journalSetting.predicate = _journalSetting.predicate;
    }

    journalSetting.columns = yield JournalsService.resolveColumns(journalSetting.columns);
    journalSetting.columns = JournalsConverter.filterColumnsByConfig(journalSetting.columns, journalConfig.columns);

    if (!isEmpty(journalSetting.predicate)) {
      JournalsConverter.filterPredicatesByConfigColumns(journalSetting.predicate, journalSetting.columns);
    }

    yield put(setJournalSetting(w(journalSetting)));
    yield put(initJournalSettingData(w({ journalSetting })));

    return journalSetting;
  } catch (e) {
    console.error('[journals getJournalSetting saga error', e);
  }
}

function* getJournalSharedSettings(api, id) {
  return id ? yield call(api.userConfig.getConfig, { id }) : null;
}

function* sagaInitJournalSettingData({ api, stateId, w }, action) {
  try {
    const { journalSetting = {}, predicate: _predicate } = action.payload;
    const journalConfig = yield select(selectJournalConfig, stateId);

    const { predicate: defaultPredicate } = getDefaultJournalSetting(journalConfig);
    let predicate = _predicate || journalSetting.predicate;

    const columns = yield getColumns({ stateId, force: true });

    const handleVal = p =>
      isArray(get(p, 'val')) &&
      get(p, 'val').length === 1 &&
      isArray(get(p, 'val[0].val')) &&
      get(p, 'val[0].val').length === 1 &&
      get(p, 'val[0].val[0].val');

    const predicateVal = handleVal(predicate);
    const defaultPredicateVal = handleVal(defaultPredicate);

    if (isArray(predicateVal) && isArray(defaultPredicateVal) && predicateVal.length < defaultPredicateVal.length) {
      defaultPredicateVal
        .filter(predicate => get(predicate, 'att') && !predicateVal.find(p => p.att === predicate.att))
        .forEach(diffPredicate => {
          predicate.val[0].val[0].val.push(diffPredicate);
        });
    }

    const columnsSetup = {
      isExpandedFromGrouped: false,
      columns: JournalsConverter.injectId(columns),
      sortBy: cloneDeep(journalSetting.sortBy)
    };
    const grouping = {
      needCount: get(journalSetting, 'grouping.needCount', false),
      columns: cloneDeep(journalSetting.groupBy.length ? journalSetting.grouping.columns : []),
      groupBy: cloneDeep(journalSetting.groupBy)
    };

    const filteredPredicate = JournalsConverter.filterPredicatesByConfigColumns(cloneDeep(predicate), columns);

    yield put(setJournalExpandableProp(w(false)));
    yield put(setPredicate(w(filteredPredicate)));
    yield put(setColumnsSetup(w(columnsSetup)));
    yield put(setGrouping(w(grouping)));

    yield put(
      setOriginGridSettings(
        w({
          predicate: filteredPredicate,
          columnsSetup,
          grouping
        })
      )
    );
  } catch (e) {
    console.error('[journals sagaInitJournalSettingData saga error', e);
  }
}

function* sagaResetJournalSettingData({ api, stateId, w }, action) {
  try {
    const { journalConfig, originGridSettings, predicate, columnsSetup, grouping } = yield select(selectJournalData, stateId);

    if (!isEqual(originGridSettings, { predicate, columnsSetup, grouping })) {
      const journalConfig = yield select(selectJournalConfig, stateId);
      const filteredPredicate = JournalsConverter.filterPredicatesByConfigColumns(
        cloneDeep(originGridSettings.predicate),
        journalConfig.columns
      );

      yield put(setPredicate(w(filteredPredicate)));
      yield put(setColumnsSetup(w(originGridSettings.columnsSetup)));
      yield put(setGrouping(w(originGridSettings.grouping)));

      return;
    }

    const journalSettingId = action.payload;

    yield getJournalSetting(api, { journalSettingId, journalConfig, stateId }, w);
  } catch (e) {
    console.error('[journals sagaResetJournalSettingData saga error', e);
  }
}

export function* getGridData(api, params, stateId, isOnlyData = false) {
  const w = wrapArgs(stateId);

  if (!isOnlyData) {
    yield put(setLoadingGrid(w(true)));
  }

  const { recordRef, journalConfig, journalSetting } = yield select(selectJournalData, stateId);
  const { id } = journalConfig || {};

  const config = yield select(state => selectNewVersionDashletConfig(state, stateId));
  const journalId = get(config, 'journalId', id?.includes('@') ? id.split('@')[1] : id);

  const onlyLinked = get(config, ['onlyLinkedJournals', journalId]) ?? get(config, 'onlyLinked');

  let attrsToLoad;
  if (isObject(get(config, 'attrsToLoad')) && journalId) {
    attrsToLoad = get(config, ['attrsToLoad', journalId]);
  } else {
    attrsToLoad = get(config, 'attrsToLoad');
  }

  const { pagination: _pagination, predicates: _predicates = [], searchPredicate, fromGroupBy = false, grouping, ...forRequest } = params;
  const predicateRecords = yield call(api.journals.fetchLinkedRefs, recordRef, attrsToLoad);

  if (predicateRecords) {
    _predicates.push({
      t: PREDICATE_EQ,
      att: 'id',
      val: predicateRecords
    });
  }

  const predicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate(_predicates));
  const pagination = get(forRequest, 'groupBy.length') ? { ..._pagination, maxItems: undefined } : _pagination;
  // debugger;
  const settings = JournalsConverter.getSettingsForDataLoaderServer({
    ...forRequest,
    recordRef,
    pagination,
    predicates,
    onlyLinked: predicateRecords.length ? false : onlyLinked,
    searchPredicate,
    attrsToLoad,
    journalSetting
  });

  if (get(grouping, 'groupBy', []).length) {
    settings.columns = grouping.columns;
  }

  if (fromGroupBy) {
    settings.grouping = {};
    settings.groupBy = [];
  }

  const aggregateWorkspaces = get(config, 'aggregateWorkspaces');
  if (isArray(aggregateWorkspaces)) {
    settings.workspaces = aggregateWorkspaces.map(wsId => (wsId.includes('@') ? wsId.split('@')[1] : wsId));
  }

  const resultData = yield call([JournalsService, JournalsService.getJournalData], journalConfig, settings);
  const journalData = JournalsConverter.getJournalDataWeb(resultData);

  if (!get(grouping, 'groupBy', []).length && !isOnlyData) {
    const gridParams = { ...params, ...journalData };
    delete gridParams.fromGroupBy;

    yield put(setGrid(w(gridParams)));
    yield put(setLoadingGrid(w(false)));
  }

  const recordRefs = journalData.data.map(d => d.id);
  const resultActions = yield call([JournalsService, JournalsService.getRecordActions], journalConfig, recordRefs);
  const actions = JournalsConverter.getJournalActions(resultActions);

  let columns = yield getColumns({ stateId });

  if (fromGroupBy) {
    columns = params.columns;
  }

  for (const column of columns) {
    if (isString(column.attribute) && column.attribute.startsWith('_custom_')) {
      const predicate = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate([column.customPredicate]));
      const customData = yield call([JournalsService, JournalsService.getJournalData], journalConfig, {
        ...settings,
        predicate: getFirst(predicate) || {},
        attributes: [column.originSchema]
      });

      const originColumn = journalConfig.columns.find(i => column.originAttribute === i.attribute);

      set(column, 'newFormatter', originColumn.newFormatter);
      set(column, 'newEditor', originColumn.newEditor);

      const _groupBy = get(grouping, 'groupBy[0]', '').split('&');

      get(journalData, 'data', []).map((record, _index) => {
        const originRecord = {};

        _groupBy.forEach(att => {
          originRecord[att] = record[att];
        });

        const additionalRecord = get(customData, 'records', []).find(customRecord => {
          const originCustomRecord = {};

          _groupBy.forEach(att => {
            originCustomRecord[att] = customRecord[att];
          });

          return isEqual(originRecord, originCustomRecord);
        });

        record[column.column] = additionalRecord ? additionalRecord['0'] : '0';

        return record;
      });
    }
  }

  return { ...journalData, columns, actions };
}

function* loadGrid(api, { journalSettingId, journalConfig, userConfigId, stateId, savePredicate, forcePagination }, w) {
  const { canceled } = yield race({
    task: call(function* () {
      const initPredicate = savePredicate || false;
      const isResetPagination = forcePagination || false;
      const sharedSettings = yield getJournalSharedSettings(api, userConfigId) || {};

      if (!isEmpty(sharedSettings) && !isEmpty(sharedSettings.columns)) {
        sharedSettings.columns = yield JournalsService.resolveColumns(sharedSettings.columns);
      }

      const journalSetting = yield getJournalSetting(api, { journalSettingId, journalConfig, sharedSettings, stateId, initPredicate }, w);
      const settings = yield select(selectJournalSettings, stateId);
      const preset = settings.find(preset => preset.id === journalSettingId);
      const url = yield select(selectUrl, stateId);
      const journalData = yield select(selectJournalData, stateId);

      const dataPagination = get(sharedSettings, 'pagination') || get(journalData, 'grid.pagination') || DEFAULT_PAGINATION;

      const pagination = !isResetPagination ? dataPagination : { ...dataPagination, page: 1, skipCount: 0 };
      const params = getGridParams({ journalConfig, journalSetting: get(preset, 'settings', journalSetting), pagination });
      const search = url.search || journalSetting.search;
      const isSearching = get(journalData, 'searching', false);

      yield put(setLoading(w(true)));
      let gridData = isSearching && search ? {} : yield getGridData(api, { ...params }, stateId);
      let searchData = {};

      const headerSearchEnabled = get(journalConfig, 'searchConfig.headerSearchEnabled', true);

      if (headerSearchEnabled && search) {
        yield put(setGrid(w({ search })));
        searchData = { search };
      }

      if (search && !url.search) {
        yield put(setUrl({ stateId, ...url, search }));
      }

      const searchPredicate = yield getSearchPredicate({ ...w({ stateId }), grid: { ...gridData, ...searchData } });

      if (headerSearchEnabled && !isEmpty(searchPredicate)) {
        params.searchPredicate = searchPredicate;
        gridData = yield getGridData(api, params, stateId);

        if (isSearching) {
          yield put(setSearching(w(false)));
        }
      }

      const editingRules = yield getGridEditingRules(api, gridData);
      let selectedRecords = [];

      if (!!userConfigId) {
        if (isEmpty(get(sharedSettings, 'selectedItems'))) {
          selectedRecords = get(gridData, 'data', []).map(item => item.id);
        } else {
          selectedRecords = sharedSettings.selectedItems;
        }
      }

      if (!isEmpty(gridData.columns)) {
        gridData.columns = JournalsConverter.filterColumnsByConfig(gridData.columns, journalConfig.columns);
      }

      if (!isEmpty(gridData.predicate)) {
        JournalsConverter.filterPredicatesByConfigColumns(gridData.predicates, journalConfig.columns);
      }

      if (!isEmpty(params.predicate)) {
        JournalsConverter.filterPredicatesByConfigColumns(params.predicates, journalConfig.columns);
      }

      yield put(setGrid(w({ ...params, ...gridData, editingRules })));

      if (get(params, 'grouping.groupBy', []).length) {
        yield put(setLoadingGrid(w(false)));
      }

      yield put(setSelectedRecords(w(selectedRecords)));
      yield put(setSelectAllRecordsVisible(w(false)));
      yield put(setGridInlineToolSettings(w(DEFAULT_INLINE_TOOL_SETTINGS)));
      yield put(setPreviewUrl(w('')));
      yield put(setPreviewFileName(w('')));
    }),
    canceled: take(cancelLoadGrid().type)
  });

  if (canceled) {
    yield put(setLoading(w(false)));
  }
}

function* getGridEditingRules(api, gridData) {
  const { data = [], columns = [] } = gridData;
  let editingRules = yield all(
    data.map(function* (row) {
      const canEditing = yield call(api.journals.checkRowEditRules, row.id);
      let byColumns = false;

      if (canEditing) {
        byColumns = yield all(
          columns.map(function* (column) {
            const isProtected = yield call(api.journals.checkCellProtectedFromEditing, row.id, column.dataField);

            return {
              [column.dataField]: !isProtected
            };
          })
        );

        byColumns = byColumns.reduce(
          (current, result) => ({
            ...result,
            ...current
          }),
          {}
        );
      }

      return {
        [row.id]: byColumns
      };
    })
  );

  editingRules = editingRules.reduce(
    (current, result) => ({
      ...result,
      ...current
    }),
    {}
  );

  return editingRules;
}

function* sagaReloadGrid({ api, stateId, w }, { payload = {} }) {
  try {
    const { canceled } = yield race({
      task: call(function* () {
        yield put(setLoading(w(true)));
        yield put(setLoadingGrid(w(true)));

        const journalData = yield select(selectJournalData, stateId);

        if (get(payload, 'predicates')) {
          yield put(setGrid(w({ predicates: payload.predicates })));
        }

        const { grid, selectAllRecordsVisible, selectedRecords, excludedRecords, journalConfig } = journalData;
        const searchPredicate = get(payload, 'searchPredicate') || (yield getSearchPredicate({ stateId }));
        const params = { ...grid, ...payload, searchPredicate };

        params.attributes = {
          ...params.attributes,
          ...attsForListView,
          ...journalConfig.listViewInfo
        };

        const gridData = yield getGridData(api, params, stateId);
        const editingRules = yield getGridEditingRules(api, gridData);
        const pageRecords = get(gridData, 'data', []).map(item => item.id);

        let columns = get(params, 'columns');
        let _selectedRecords = isArray(selectedRecords) ? selectedRecords : [];
        let _selectAllPageRecords = false;

        if (selectAllRecordsVisible) {
          _selectedRecords = pageRecords.filter(rec => !excludedRecords.includes(rec));
        }

        if (pageRecords.every(rec => _selectedRecords.includes(rec))) {
          _selectAllPageRecords = true;
        }

        // We keep the column order from "params", but the arguments from "gridData".
        if (!columns || (isArray(columns) && columns.length === 0)) {
          columns = get(gridData, 'columns', []);
        } else {
          columns = columns.map(column => {
            const isSameName = col => col.name === column.name;
            const isGroupingCountAll = col => column.column === GROUPING_COUNT_ALL && column.column === col.column;

            const findCol = get(gridData, 'columns', []).find(col => isSameName(col) || (column.column && isGroupingCountAll(col)));

            if (findCol) {
              return findCol;
            }

            return column;
          });
        }

        yield put(setSelectAllPageRecords(w(_selectAllPageRecords)));
        yield put(setSelectedRecords(w(_selectedRecords)));
        yield put(setGrid(w({ ...params, ...gridData, editingRules, columns })));

        const predicates = [journalData?.predicate, journalData?.journalConfig.predicate];

        if (isEmpty(payload.groupBy)) {
          yield getColumnsSum(api, w, journalData?.journalConfig?.columns, journalData?.journalConfig?.id, predicates);
        } else {
          yield put(setFooterValue(w(null)));
        }

        yield put(setForceUpdate(w(true)));
        yield put(setLoading(w(false)));
        yield put(setLoadingGrid(w(false)));
      }),
      canceled: take(cancelReloadGrid().type)
    });

    if (canceled) {
      yield put(setLoading(w(false)));
      yield put(setLoadingGrid(w(false)));
    }
  } catch (e) {
    console.error('[journals sagaReloadGrid saga error', e);
  }
}

function* sagaReloadTreeGrid({ api, stateId, w }) {
  try {
    yield put(setLoading(w(true)));

    const gridData = yield call(api.journals.getTreeGridData);
    const editingRules = yield getGridEditingRules(api, gridData);

    yield put(setGrid(w({ ...gridData, editingRules })));

    yield put(setLoading(w(false)));
  } catch (e) {
    console.error('[journals sagaReloadTreeGrid saga error', e);
  }
}

function* sagaSaveDashlet({ api, stateId, w }, action) {
  try {
    const { id, config } = action.payload;

    yield call(api.journals.saveDashletConfig, config, id);
    yield put(getDashletConfig(w(id)));
  } catch (e) {
    console.error('[journals sagaSaveDashlet saga error', e);
  }
}

function* sagaInitJournal({ api, stateId, w }, { payload }) {
  try {
    yield race({
      task: call(function* () {
        yield put(setJournalExpandableProp(w(false)));
        yield put(setLoading(w(true)));

        const { journalId, userConfigId, customJournal, customJournalMode, force } = payload;
        const id = !customJournalMode || !customJournal ? journalId : customJournal;
        let { journalSettingId, savePredicate = true } = payload;
        let { journalConfig } = yield select(selectJournalData, stateId);

        const isEmptyConfig = isEqual(journalConfig, emptyJournalConfig);
        const isNotExistsJournal = yield call([JournalsService, JournalsService.isNotExistsJournal], id);

        yield put(setJournalExistStatus(w(isNotExistsJournal !== true)));

        if (isEmpty(journalConfig) || isEmptyConfig || force) {
          journalConfig = yield getJournalConfig({ api, w, force, stateId }, id);

          yield getJournalSettings(api, journalConfig.id, w, stateId);

          const settings = yield select(selectJournalSettings, stateId);
          const selectedPreset = settings.find(setting => setting.id === journalSettingId);

          if (isEmpty(selectedPreset)) {
            journalSettingId = get(settings, '0.id', '');
          }
        }

        if (!isEmpty(journalConfig.listViewInfo)) {
          yield put(setIsEnabledPreviewList(w(true)));
          yield put(setLoadingPreviewList(w(false)));
          yield put(setPreviewListConfig(w(journalConfig.listViewInfo)));
        }

        yield loadGrid(
          api,
          {
            journalSettingId,
            journalConfig,
            userConfigId,
            stateId,
            savePredicate
          },
          (...data) => ({ ...w(...data) })
        );

        const { predicate } = yield select(selectJournalData, stateId);
        const predicates = [predicate, journalConfig.predicate];

        yield getColumnsSum(api, w, journalConfig?.columns, journalId, predicates);
        yield put(setLoading(w(false)));
      }),
      canceled: take(cancelInitJournal().type)
    });
  } catch (e) {
    yield put(setLoading(w(false)));
    console.error('[journals sagaInitJournal saga error', e);
  }
}

function* sagaOpenSelectedPreset({ api, stateId, w }, action) {
  try {
    const selectedId = action.payload;
    const query = getSearchParams();
    const viewMode = yield select(selectViewMode, stateId);

    if (query[JournalUrlParams.JOURNAL_SETTING_ID] === undefined && selectedId === undefined) {
      return;
    }

    const { journalSetting, journalConfig } = yield select(selectJournalData, stateId);

    if (journalSetting.id === selectedId) {
      return;
    }

    query[JournalUrlParams.JOURNAL_SETTING_ID] = selectedId || undefined;
    query[JournalUrlParams.USER_CONFIG_ID] = undefined;

    const settings = yield select(selectJournalSettings, stateId);
    const preset = settings.find(preset => preset.id === selectedId);
    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });
    yield call([PageService, PageService.changeUrlLink], url, { updateUrl: true });

    yield put(selectPreset(w(selectedId)));
    yield put(setLoading(w(true)));

    yield put(selectTemplateId(w(selectedId)));
    yield put(setPredicate(w(get(preset, 'settings.predicate', {}))));

    const { originKanbanSettings } = yield select(selectKanban, stateId);
    const kanbanSettings = get(preset, 'settings.kanban', { columns: originKanbanSettings.statuses });

    let predicates;
    switch (true) {
      case !!journalConfig?.predicate && !!preset?.settings?.predicate:
        predicates = [journalConfig.predicate, preset.settings.predicate];
        break;
      case !!journalConfig?.predicate:
        predicates = [journalConfig.predicate];
        break;
      case !!preset?.settings?.predicate:
        predicates = [preset.settings.predicate];
        break;
      default:
        predicates = [];
    }
    const settingsKanban = { predicate: predicates, kanban: kanbanSettings };

    yield getColumnsSum(api, w, journalConfig.columns, journalConfig?.id, predicates);

    yield put(applyPreset({ stateId, settings: settingsKanban }));

    if (isKanban(viewMode) && !!selectedId) {
      yield put(clearFiltered(w()));
    }
  } catch (e) {
    console.error('[journals sagaOpenSelectedJournal saga error', e);
  }
}

function* sagaSelectPreset({ api, stateId, w }, action) {
  try {
    const journalSettingId = action.payload;
    const { journalConfig } = yield select(selectJournalData, stateId);

    yield put(setLoading(w(true)));
    yield put(cancelGoToPageJournal());
    yield put(cancelReloadGrid());
    yield put(cancelLoadGrid());

    yield call(api.journals.setLsJournalSettingId, journalConfig.id, journalSettingId);
    yield loadGrid(api, { journalSettingId, journalConfig, stateId, forcePagination: true }, w);
    yield put(setLoading(w(false)));
  } catch (e) {
    console.error('[journals sagaSelectPreset saga error', e);
  }
}

function* sagaOpenSelectedJournal({ api, stateId, w }, action) {
  try {
    const query = getSearchParams();

    if (query[JournalUrlParams.JOURNAL_ID] === (action.payload || undefined)) {
      return;
    }

    yield put(setLoading(w(true)));

    const exceptionalParams = [JournalUrlParams.JOURNALS_LIST_ID];

    for (let key in query) {
      if (!exceptionalParams.includes(key)) {
        query[key] = undefined;
      }
    }

    query[JournalUrlParams.JOURNAL_ID] = action.payload;

    const url = queryString.stringifyUrl({ url: getUrlWithoutOrigin(), query });

    yield call(PageService.changeUrlLink, url, { openNewTab: true, pushHistory: true });
  } catch (e) {
    console.error('[journals sagaOpenSelectedJournal saga error', e);
  }
}

function* sagaSelectJournal({ api, stateId, w }, action) {
  try {
    const journalId = action.payload;

    yield put(setLoading(w(true)));

    const journalConfig = yield getJournalConfig({ api, w, stateId }, journalId);

    yield getJournalSettings(api, journalConfig.id, w, stateId);
    yield loadGrid(api, { journalConfig, stateId }, w);
    yield put(setLoading(w(false)));
  } catch (e) {
    console.error('[journals sagaSelectJournal saga error', e);
  }
}

function* sagaExecRecordsAction({ api, w }, action) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, action.payload);
    const check = isArray(actionResult) ? actionResult.some(res => res !== false) : actionResult !== false;

    if (check) {
      if (get(action, 'payload.action.type', '') !== ActionTypes.BACKGROUND_VIEW) {
        yield put(reloadGrid(w()));
      }

      const executeCallback = get(action, 'payload.action.executeCallback');
      isFunction(executeCallback) && executeCallback();
    }
  } catch (e) {
    console.error('[journals sagaExecRecordsAction saga error', e);
  }
}

function* sagaSaveRecords({ api, stateId, w }, action) {
  try {
    const { grid } = yield select(selectJournalData, stateId);
    const editingRules = yield getGridEditingRules(api, grid);
    const { id, attributes } = action.payload;
    const attribute = getFirst(Object.keys(attributes));
    const value = attributes[attribute];
    const tempAttributes = {};

    const currentColumn = grid.columns.find(item => item.attribute === attribute);

    const valueToSave = EditorService.getValueToSave(value, currentColumn.multiple);

    if (isNodeRef(id)) {
      yield call(api.journals.saveRecords, {
        id,
        attributes: {
          [attribute]: valueToSave
        }
      });
    } else {
      const record = yield Records.get(id);
      for (const att in attributes) {
        if (attributes.hasOwnProperty(att)) {
          const attributeValue = attributes[att];

          if (isObject(attributeValue) && !!get(attributeValue, 'value')) {
            record.att(att, attributeValue.value);
          } else {
            record.att(att, attributeValue);
          }
        }
      }
      yield record.save();
    }

    grid.columns.forEach(c => {
      tempAttributes[c.attribute] = c.attSchema;
    });

    const savedRecord = yield call(api.journals.getRecord, { id, attributes: tempAttributes, noCache: true });

    grid.data = grid.data.map(record => {
      if (record.id === id) {
        const savedValue = EditorService.getValueToSave(savedRecord[attribute], currentColumn.multiple);

        if (!isEqual(savedValue, valueToSave)) {
          savedRecord.error = attribute;
        }

        return { ...savedRecord, id };
      }

      return record;
    });

    yield put(setGrid(w({ ...grid, editingRules })));
  } catch (e) {
    console.error('[journals sagaSaveRecords saga error', e);
  }
}

function* sagaSaveJournalSetting({ api, stateId, w }, action) {
  try {
    const { callback, settings } = action.payload;

    const { id } = yield select(selectJournalSetting, stateId);
    const { journalConfig } = yield select(selectJournalData, stateId);

    if (settings.kanban) {
      yield put(setJournalSetting({ stateId, kanban: settings.kanban }));
      yield put(setKanbanSettings({ stateId, kanbanSettings: settings.kanban }));
    }
    yield call([PresetsServiceApi, PresetsServiceApi.saveSettings], { id, settings });

    yield getJournalSettings(api, journalConfig.id, w, stateId);
    isFunction(callback) && callback();
  } catch (e) {
    const { callback } = action.payload;
    isFunction(callback) && callback(true);

    NotificationManager.error(t('journal.presets.modal.save-error.title'), t('journal.presets.modal.save-error'));
    console.error('[journals sagaSaveJournalSetting saga error', e);
  }
}

function* sagaCreateJournalSetting({ api, stateId, w }, action) {
  try {
    const { callback, ...data } = action.payload;
    const { journalConfig } = yield select(selectJournalData, stateId);

    const executor = ActionsRegistry.getHandler(ActionTypes.EDIT_JOURNAL_PRESET);
    const actionResult = yield call([executor, executor.execForRecord], `${SourcesId.PRESETS}@`, { config: { data } });

    yield getJournalSettings(api, journalConfig.id, w, stateId);
    if (actionResult && actionResult.id) {
      yield put(openSelectedPreset(w(actionResult.id)));
    }

    isFunction(callback) && callback(actionResult);
  } catch (e) {
    console.error('[journals sagaCreateJournalSetting saga error', e);
  }
}

function* sagaDeleteJournalSetting({ api, stateId, w }, { payload }) {
  try {
    const { journalConfig } = yield select(selectJournalData, stateId);
    const executor = ActionsRegistry.getHandler(ActionTypes.DELETE);
    const actionResult = yield call([executor, executor.execForRecord], payload, { config: { withoutConfirm: true } });

    if (actionResult) {
      NotificationManager.success(t('record-action.edit-journal-preset.msg.deleted-success'));
    }

    const settings = yield select(selectJournalSettings, stateId);
    const selectedPreset = settings.find(setting => setting.id === stateId);
    let presetId = stateId;

    if (isEmpty(selectedPreset)) {
      presetId = get(settings, '0.id', '');
    }

    yield getJournalSettings(api, journalConfig.id, w, payload || stateId);
    yield put(openSelectedPreset(w(presetId)));
  } catch (e) {
    console.error('[journals sagaDeleteJournalSetting saga error', e);
  }
}

function* sagaEditJournalSetting({ api, stateId, w }, action) {
  try {
    const recordId = action.payload;
    const { journalConfig } = yield select(selectJournalData, stateId);
    const data = yield call([PresetsServiceApi, PresetsServiceApi.getPreset], { id: recordId });

    if (!data) {
      throw Error(data);
    }

    const executor = ActionsRegistry.getHandler(ActionTypes.EDIT_JOURNAL_PRESET);

    yield call([executor, executor.execForRecord], recordId, { config: { data } });
    yield getJournalSettings(api, journalConfig.id, w, stateId);
  } catch (e) {
    NotificationManager.error(t('journal.presets.error.get-one'));
    console.error('[journals sagaEditJournalSetting saga error', e);
  }
}

function* sagaApplyJournalSetting({ api, stateId, w }, action) {
  try {
    yield put(cancelReloadGrid());

    const { settings } = action.payload;
    const { columns, groupBy = [], sortBy, predicate, grouping } = settings;
    const predicates = beArray(predicate);
    const maxItems = yield select(selectGridPaginationMaxItems, stateId);
    const pagination = { ...DEFAULT_PAGINATION, maxItems };
    const url = yield select(selectUrl, stateId);
    if (!isEmpty(groupBy)) {
      settings.sortBy = settings.sortBy.filter(predicate => groupBy.includes(predicate.attribute));
    }
    yield put(setJournalSetting(w(settings)));
    if (settings.kanban) {
      yield put(setKanbanSettings({ stateId, kanbanSettings: settings.kanban }));
    }
    yield put(setPredicate(w(predicate)));

    yield put(setColumnsSetup(w({ columns, sortBy })));
    yield put(setGrouping(w(grouping)));
    const newCols = grouping.groupBy.length ? grouping.columns : columns;
    yield put(setGrid(w({ columns: newCols })));

    yield put(
      setUrl(
        w({
          ...omit(url, 'search')
        })
      )
    );

    yield put(
      reloadGrid(
        w({
          columns: newCols,
          groupBy,
          sortBy,
          predicates,
          pagination,
          grouping,
          search: ''
        })
      )
    );
  } catch (e) {
    NotificationManager.error(t('journal.presets.modal.apply-error.title'), t('journal.presets.modal.apply-error'));
    console.error('[journals sagaApplyJournalSetting saga error', e);
  }
}

function* sagaInitPreview({ api, stateId, w }, action) {
  try {
    const nodeRef = action.payload;
    const previewUrl = yield call(api.journals.getPreviewUrl, nodeRef);

    yield put(setPreviewUrl(w(previewUrl)));
  } catch (e) {
    console.error('[journals sagaInitPreview saga error', e);
  }
}

function* sagaGoToJournalsPage({ api, stateId, w }, action) {
  try {
    const { canceled } = yield race({
      task: call(function* () {
        yield put(setLoading(w(true)));

        const journalData = yield select(selectJournalData, stateId);
        const isViewNewJournal = yield select(selectIsViewNewJournal);
        const { journalConfig = {}, grid = {} } = journalData || {};
        const { columns, groupBy = [] } = grid;
        const { criteria = [], predicate = {} } = journalConfig.meta || {};

        let settingColumns = get(journalData, 'journalSetting.columns', columns);
        let row = cloneDeep(action.payload);
        let id = journalConfig.id || '';
        let filter = '';

        if (id === 'event-lines-stat') {
          //todo: move to journal config
          let eventTypeId = row['groupBy__type'];

          if (eventTypeId) {
            eventTypeId = eventTypeId.replace(`${SourcesId.TYPE}@line-`, '');
            id = 'event-lines-' + eventTypeId;
            NotificationManager.info('', t('notification.journal-will-be-opened-soon'), 1000);
            PageService.changeUrlLink('/v2/journals?journalId=' + id, { updateUrl: true });

            return;
          } else {
            console.error("[journals sagaGoToJournalsPage] Target journal can't be resolved", row);
          }
        } else {
          const journalType = (getFirst(criteria) || {}).value || predicate.val;

          if (journalType && journalConfig.groupBy && journalConfig.groupBy.length) {
            const config = yield call(JournalsService.getJournalConfig, `alf_${encodeURI(journalType)}`);
            id = config.id;
          }

          if (groupBy.length) {
            for (let key in row) {
              if (!row.hasOwnProperty(key)) {
                continue;
              }

              const value = row[key];

              if (value && value.str) {
                //row[key] = value.str;
              }
            }
          } else {
            let attributes = {};

            columns.forEach(c => (attributes[c.attribute] = `${c.attribute}?str`));
            row = yield call(api.journals.getRecord, { id: row.id, attributes: attributes }) || row;
          }

          let originFilter = [];
          const cleanPredicates = ParserPredicate.replacePredicatesType(JournalsConverter.cleanUpPredicate([journalData.predicate]));

          originFilter = convertAttributeValues(cleanPredicates, columns);
          originFilter = JournalsConverter.optimizePredicate({ t: 'and', val: originFilter });
          filter = getFilterParam({ row, columns, groupBy, predicate: journalData.predicate });

          if (!isEmpty(originFilter)) {
            if (Array.isArray(originFilter.val)) {
              filter = concat(filter, originFilter.val);
            } else {
              filter = concat(filter, originFilter);
            }
          }
        }

        if (filter) {
          yield call(api.journals.setLsJournalSettingId, get(journalData, 'journalSetting.id', id), '');
        }

        if (isArray(journalConfig.columns) && isArray(settingColumns) && settingColumns.length < journalConfig.columns.length) {
          const settingColumnsIds = settingColumns.map(item => JournalsConverter.getColumnId(item));
          journalConfig.columns.forEach(
            column => !settingColumnsIds.includes(JournalsConverter.getColumnId(column)) && settingColumns.push(column)
          );
        }

        const gridColumns = JournalsConverter.filterColumnsByConfig(settingColumns, journalConfig.columns);
        const pagination = isViewNewJournal ? get(journalData, 'grid.pagination', DEFAULT_PAGINATION) : DEFAULT_PAGINATION;

        const params = getGridParams({
          journalConfig,
          journalSetting: {
            ...journalData.journalSetting,
            groupBy: [],
            grouping: {}
          },
          pagination
        });
        const predicateValue = ParserPredicate.setPredicateValue(get(params, 'predicates[0]') || [], filter);
        set(params, 'predicates', [predicateValue]);
        set(params, 'columns', gridColumns);
        const gridData = yield getGridData(api, { ...params, fromGroupBy: true }, stateId);
        const editingRules = yield getGridEditingRules(api, gridData);
        yield put(setPredicate(w(predicateValue)));
        yield put(setJournalSetting(w({ ...journalData.journalSetting, predicate: predicateValue })));
        yield put(setSelectedRecords(w([])));
        yield put(setSelectAllRecordsVisible(w(false)));
        yield put(setGridInlineToolSettings(w(DEFAULT_INLINE_TOOL_SETTINGS)));
        yield put(setPreviewUrl(w('')));
        yield put(setPreviewFileName(w('')));
        yield put(
          setGrid(
            w({
              ...params,
              ...gridData,
              columns: gridColumns,
              editingRules,
              isExpandedFromGrouped: true
            })
          )
        );

        const predicates = [journalData.predicate, journalData.journalConfig.predicate, ...params.predicates];

        yield getColumnsSum(api, w, journalConfig.columns, journalData.journalConfig?.id, predicates);
      }),
      canceled: take(cancelGoToPageJournal().type)
    });

    if (canceled) {
      yield put(setLoading(w(false)));
    }
  } catch (e) {
    console.error('[journals sagaGoToJournalsPage saga error]', e);
  } finally {
    yield put(setLoading(w(false)));
  }
}

function* getSearchPredicate({ stateId, grid }) {
  try {
    const journalData = yield select(selectJournalData, stateId);
    let { journalConfig, grid: gridData = {} } = journalData;
    const fullSearch = get(journalConfig, ['params', 'full-search-predicate']);
    let predicate;

    if (!isEmpty(grid)) {
      gridData = { ...gridData, ...grid };
    }

    const { groupBy = [], search } = gridData;
    let { columns = [] } = gridData;

    columns = ParserPredicate.getAvailableSearchColumns(columns);

    if (fullSearch) {
      predicate = JSON.parse(fullSearch);
      predicate.val = search;
    } else {
      predicate = ParserPredicate.getSearchPredicates({ text: search, columns, groupBy });
    }

    if (predicate) {
      predicate = [predicate];
    }

    if (isEmpty(search)) {
      predicate = [];
    }

    return predicate;
  } catch (e) {
    console.error('[journals getSearchPredicate saga error', e);
  }
}

function* sagaSearch({ w, stateId }, { payload }) {
  try {
    const urlData = queryString.parseUrl(getUrlWithoutOrigin());
    const searchText = get(payload, 'text') || undefined;

    if (get(urlData, ['query', JournalUrlParams.SEARCH]) !== searchText) {
      set(urlData, ['query', JournalUrlParams.SEARCH], searchText);
    }

    if (!isEqual(getSearchParams(), urlData.query)) {
      yield put(setSearching(w(true)));
      yield put(setLoading(w(true)));
      yield call(PageService.changeUrlLink, decodeLink(queryString.stringifyUrl(urlData)), { updateUrl: true });
    }
  } catch (e) {
    console.error('[journals sagaSearch saga error', e);
  }
}

function* sagaCheckConfig({ w, stateId }, { payload }) {
  try {
    yield put(setCheckLoading(w(true)));

    const config = get(payload, get(payload, 'version'));
    const customJournalMode = get(config, 'customJournalMode');
    const id = get(config, customJournalMode ? 'customJournal' : 'journalId', '');
    const isNotExistsJournal = !!id && (yield call([JournalsService, JournalsService.isNotExistsJournal], id));

    yield put(setJournalExistStatus(w(!isNotExistsJournal)));
    yield put(setCheckLoading(w(false)));
    yield put(setEditorMode(w(isEmpty(id))));
  } catch (e) {
    console.error('[journals sagaCheckConfig saga error', e);
  }
}

function* sagaExecJournalAction({ api, w }, { payload }) {
  try {
    const actionResult = yield call(api.recordActions.executeAction, payload);

    if (actionResult) {
      yield put(getJournalsData(w({ force: true })));
      yield put(execRecordsActionComplete(w({ ...payload })));
    }
  } catch (e) {
    console.error('[journals sagaExecJournalAction saga error', e);
  }
}

function* sagaResetFiltering({ w, stateId }) {
  try {
    const url = yield select(selectUrl, stateId);
    const isViewNewJournal = yield select(selectIsViewNewJournal);
    const journalData = yield select(selectJournalData, stateId);
    const { grid = {} } = journalData || {};
    const { pagination = {} } = grid;
    const { journalId, journalSettingId = '', userConfigId } = url;

    yield put(setJournalExpandableProp(w(false)));

    if (isViewNewJournal) {
      yield put(setGrid(w({ pagination: { ...pagination, skipCount: 0, page: 1 } })));
    } else {
      yield put(setGrid(w({ pagination: DEFAULT_PAGINATION })));
    }

    yield put(initJournal(w({ journalId, journalSettingId, userConfigId, force: true, savePredicate: false })));
  } catch (e) {
    console.error('[journals sagaResetFiltering saga error', e);
  }
}

export function* sagaToggleViewMode({ w }, { payload }) {
  try {
    const { stateId } = payload;
    const journalData = yield select(selectJournalData, stateId);

    if (isKanban(journalData.viewMode)) {
      yield put(reloadBoardData({ stateId }));
      yield put(setForceUpdate(w(false)));
    }
  } catch (e) {
    console.error('[journals sagaToggleViewMode saga error', e);
  }
}

export function* sagaGetJournalWidgetsConfig({ w, api }, { payload }) {
  try {
    const widgetsConfig = yield call(api.journals.getConfigWidgets, payload);
    if (widgetsConfig) {
      yield put(setJournalWidgetsConfig(w(widgetsConfig)));
    }
  } catch (e) {
    console.error('[journals sagaGetJournalWidgetsConfig saga error', e);
  }
}

export function* sagaGetNextPage({ w, api }, { payload }) {
  try {
    const { stateId } = payload;
    yield put(setLoadingGrid(w(true)));

    const journalData = yield select(selectJournalData, stateId);
    const { grid, journalConfig } = journalData;

    const searchPredicate = get(payload, 'searchPredicate') || (yield getSearchPredicate({ stateId }));
    const params = { ...grid, ...payload, searchPredicate };
    params.attributes = {
      ...params.attributes,
      ...attsForListView,
      ...journalConfig.listViewInfo
    };

    const pagination = yield select(selectJournalPagination, stateId);
    const totalCount = yield select(selectJournalTotalCount, stateId);

    const nextSkipCount = pagination.page * pagination.maxItems;
    pagination.skipCount = nextSkipCount;
    pagination.page += 1;

    params.pagination = pagination;

    if (totalCount > nextSkipCount) {
      const newGridData = yield getGridData(api, params, stateId, true);
      yield put(setGrid(w({ ...newGridData, data: [...grid.data, ...newGridData.data] })));
    }
  } catch (e) {
    console.error('[journals sagaGetNextPage saga error', e);
  } finally {
    yield put(setLoadingGrid(w(false)));
  }
}

function* saga(ea) {
  yield takeEvery(getDashletConfig().type, wrapSaga, { ...ea, saga: sagaGetDashletConfig });
  yield takeEvery(setDashletConfigByParams().type, wrapSaga, { ...ea, saga: sagaSetDashletConfigFromParams });
  yield takeEvery(getDashletEditorData().type, wrapSaga, { ...ea, saga: sagaGetDashletEditorData });
  yield takeLatest(getJournalsData().type, wrapSaga, { ...ea, saga: sagaGetJournalsData });
  yield takeEvery(saveDashlet().type, wrapSaga, { ...ea, saga: sagaSaveDashlet });
  yield takeEvery(initJournal().type, wrapSaga, { ...ea, saga: sagaInitJournal });

  yield takeEvery(reloadGrid().type, wrapSaga, { ...ea, saga: sagaReloadGrid });
  yield takeEvery(reloadTreeGrid().type, wrapSaga, { ...ea, saga: sagaReloadTreeGrid });

  yield takeEvery(execRecordsAction().type, wrapSaga, { ...ea, saga: sagaExecRecordsAction });
  yield takeEvery(saveRecords().type, wrapSaga, { ...ea, saga: sagaSaveRecords });

  yield takeEvery(reloadJournalConfig().type, wrapSaga, { ...ea, saga: getJournalConfig });

  yield takeEvery(saveJournalSetting().type, wrapSaga, { ...ea, saga: sagaSaveJournalSetting });
  yield takeEvery(createJournalSetting().type, wrapSaga, { ...ea, saga: sagaCreateJournalSetting });
  yield takeEvery(deleteJournalSetting().type, wrapSaga, { ...ea, saga: sagaDeleteJournalSetting });
  yield takeEvery(editJournalSetting().type, wrapSaga, { ...ea, saga: sagaEditJournalSetting });
  yield takeEvery(applyJournalSetting().type, wrapSaga, { ...ea, saga: sagaApplyJournalSetting });
  yield takeEvery(resetFiltering().type, wrapSaga, { ...ea, saga: sagaResetFiltering });
  yield takeEvery(execJournalAction().type, wrapSaga, { ...ea, saga: sagaExecJournalAction });

  yield takeEvery(selectJournal().type, wrapSaga, { ...ea, saga: sagaSelectJournal });
  yield takeEvery(openSelectedJournal().type, wrapSaga, { ...ea, saga: sagaOpenSelectedJournal });
  yield takeEvery(selectPreset().type, wrapSaga, { ...ea, saga: sagaSelectPreset });
  yield takeEvery(openSelectedPreset().type, wrapSaga, { ...ea, saga: sagaOpenSelectedPreset });

  yield takeEvery(initJournalSettingData().type, wrapSaga, { ...ea, saga: sagaInitJournalSettingData });
  yield takeEvery(resetJournalSettingData().type, wrapSaga, { ...ea, saga: sagaResetJournalSettingData });

  yield takeEvery(initPreview().type, wrapSaga, { ...ea, saga: sagaInitPreview });
  yield takeEvery(goToJournalsPage().type, wrapSaga, { ...ea, saga: sagaGoToJournalsPage });
  yield takeEvery(getJournalWidgetsConfig().type, wrapSaga, { ...ea, saga: sagaGetJournalWidgetsConfig });
  yield takeEvery(runSearch().type, wrapSaga, { ...ea, saga: sagaSearch });
  yield takeEvery(checkConfig().type, wrapSaga, { ...ea, saga: sagaCheckConfig });

  yield takeEvery(toggleViewMode().type, wrapSaga, { ...ea, saga: sagaToggleViewMode });
  yield takeEvery(getNextPage().type, wrapSaga, { ...ea, saga: sagaGetNextPage });
}

export default saga;
