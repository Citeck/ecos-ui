import { Attributes, DEFAULT_WORKSPACE_ID, Permissions } from '@citeck/constants';
import Records from '@citeck/records-core';
import { PERMISSION_WRITE_ATTR } from '@citeck/records-core/constants';
import { PREDICATE_EQ } from '@citeck/records-core/predicates/predicates';
import { parseAttribute } from '@citeck/records-core/utils/attStrUtils';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Collapse } from 'reactstrap';

import { EcosModal, Icon, Loader, Pagination } from '../../../common';
import { Btn, IcoBtn } from '../../../common/btns';
import { Grid } from '../../../common/grid';
import { DialogManager } from '../../dialogs';
import { matchCardDetailsLinkFormatterColumn } from '../../grid/mapping/Mapper';

import CreateVariants from './CreateVariants';
import Filters from './Filters';
import FiltersProvider from './Filters/FiltersProvider';
import InputView from './InputView';
import Search from './Search';
import ViewMode from './ViewMode';
import { DataTypes, DisplayModes, Labels, SELECT_JOURNAL_MODAL_CLASSNAME } from './constants';

import { Checkbox } from '@/components/common/form';
import FormManager from '@/components/forms/EcosForm/FormManager';
import JournalsService from '@/components/journals/Journals/service';
import { mergeFilters } from '@/components/journals/Journals/service/util';
import JournalsConverter from '@/dto/journals';
import { SearchInWorkspacePolicy, TEMPLATE_REGEX } from '@/forms/components/custom/selectJournal/constants';
import { getIconUpDown } from '@/helpers/icon';
import { resolveRecordWorkspaceId } from '@/helpers/recordWorkspace';
import { getHtmlIdByUid, beArray, isMobileDevice, t, isNodeRef } from '@/helpers/util';

import './SelectJournal.scss';

const paginationInitState = {
  skipCount: 0,
  maxItems: 10,
  page: 1
};

// высота всего, что НЕ таблица (header + панель фильтров + пагинация/кнопки + отступы)
const SELECT_MODAL_RESERVED_HEIGHT = 260;
const SELECT_MODAL_GRID_MIN_HEIGHT = 200;

const emptyJournalConfig = Object.freeze({
  meta: {}
});

export default class SelectJournal extends Component {
  state = {
    isCollapsePanelOpen: false,
    isSelectModalOpen: false,
    isJournalConfigFetched: false,
    journalConfig: { ...emptyJournalConfig },
    isGridDataReady: false,
    gridData: {
      total: 0,
      data: [],
      inMemoryData: [],
      columns: [],
      selected: []
    },
    pagination: paginationInitState,
    filterPredicate: [],
    selectedRows: [],
    error: null,
    customPredicate: null,
    value: undefined,
    isLoading: false,
    searching: false,
    isLocaleData: false
  };

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (state.value === undefined) {
      newState.value = props.multiple ? [] : '';
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Optimize re-renders by checking if relevant props/state have changed
    if (nextProps.journalId !== this.props.journalId) return true;
    if (nextProps.workspaceId !== this.props.workspaceId) return true;
    if (nextProps.multiple !== this.props.multiple) return true;
    if (nextProps.disabled !== this.props.disabled) return true;
    if (nextProps.viewMode !== this.props.viewMode) return true;
    if (nextProps.defaultValue !== this.props.defaultValue) return true;
    if (nextState.value !== this.state.value) return true;
    if (nextState.selectedRows !== this.state.selectedRows) return true;
    if (nextState.isSelectModalOpen !== this.state.isSelectModalOpen) return true;
    if (nextState.isGridDataReady !== this.state.isGridDataReady) return true;
    if (nextState.gridData !== this.state.gridData) return true;
    if (nextProps.customValues !== this.props.customValues) return true;
    if (nextState.isCollapsePanelOpen !== this.props.isCollapsePanelOpen) return true;

    if (!this.state.isGridDataReady && nextState.isGridDataReady) return true;

    if (nextState.gridData.data !== this.state.gridData.data) return true;
    if (nextState.gridData.columns !== this.state.gridData.columns) return true;
    if (nextState.gridData.total !== this.state.gridData.total) return true;

    return false;
  }

  get isQuery() {
    return this.props.dataType === DataTypes.QUERY;
  }

  _recordWorkspaceRef = null;
  _recordWorkspacePromise = null;

  /**
   * Whether the search query is scoped to the record's workspace at all. For the `all` and
   * `only-aditional` policies the workspace plays no part in the query.
   * @returns {boolean}
   */
  get isWorkspaceScopedPolicy() {
    const policy = this.props.searchInWorkspacePolicy || SearchInWorkspacePolicy.CURRENT;

    return policy === SearchInWorkspacePolicy.CURRENT || policy === SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL;
  }

  /**
   * Workspace to search in. Form-based callers pass a ready `workspaceId`; the grid's inline
   * assoc editor has no form, so there it is resolved from the row ref and memoized.
   *
   * Not to be confused with the synchronous `getRecordWorkspaceId()` of the formio component,
   * which is what produces the `workspaceId` prop.
   *
   * The component is not re-rendered on a `recordRef` change (only `workspaceId` is watched):
   * the editors that pass a ref render one row each and are remounted. The memo key merely keeps
   * the method honest if that ever stops holding.
   *
   * @returns {Promise<string>}
   */
  resolveWorkspaceId = () => {
    const { workspaceId, recordRef } = this.props;

    if (workspaceId) {
      return Promise.resolve(workspaceId);
    }

    // Not memoized: with no ref the resolver just reads the URL workspace, which may change under
    // a long-lived instance, and there is no request to save
    if (!recordRef) {
      return resolveRecordWorkspaceId(recordRef);
    }

    if (!this._recordWorkspacePromise || this._recordWorkspaceRef !== recordRef) {
      this._recordWorkspaceRef = recordRef;
      this._recordWorkspacePromise = resolveRecordWorkspaceId(recordRef);
    }

    return this._recordWorkspacePromise;
  };

  /**
   * Workspaces to query journal data in. The "current" workspace is the workspace of the
   * record being edited, not the one the user is currently in.
   *
   * Every query of this control goes through here, so the list the user sees and the list
   * shouldResetValue probes the value against are built the same way.
   *
   * @returns {Promise<Array<string>>}
   */
  getSearchWorkspaces = async () => {
    const { searchInWorkspacePolicy, searchInAdditionalWorkspaces } = this.props;
    const { isLocaleData, journalConfig } = this.state;
    const currentWorkspaceId = await this.resolveWorkspaceId();
    const workspaces = JournalsService.getWorkspaceByPolicy(searchInWorkspacePolicy, searchInAdditionalWorkspaces, currentWorkspaceId);

    // A system journal also lists global records, which live in the default workspace. An empty
    // list already means every workspace — appending would narrow it down to the global ones
    if (!isLocaleData && !!journalConfig.system && workspaces.length && !workspaces.includes(DEFAULT_WORKSPACE_ID)) {
      workspaces.push(DEFAULT_WORKSPACE_ID);
    }

    return workspaces;
  };

  /**
   * Workspace to create a record in via the "Create" button of the select modal.
   * An empty string means "don't set _workspace, let the backend decide".
   * @returns {Promise<string>}
   */
  getCreateWorkspaceId = async () => {
    if (!this.isWorkspaceScopedPolicy) {
      return '';
    }

    const workspaceId = await this.resolveWorkspaceId();

    return workspaceId === DEFAULT_WORKSPACE_ID ? '' : workspaceId;
  };

  _getPresetFilterPredicates(journalConfig) {
    const { presetFilterPredicates, customValues } = this.props;
    const { value } = this.state;
    const filters = presetFilterPredicates || [];

    if (this.isQuery) {
      const queryFilters = get(value, 'query.val') || [];
      filters.push(...queryFilters);
    }

    if (customValues && Array.isArray(customValues) && customValues.length) {
      const predicate = {
        t: PREDICATE_EQ,
        att: 'id',
        val: customValues.map(value => {
          const fullId = String(value);

          const [, id] = fullId.split('@');
          return id;
        })
      };

      filters.push(predicate);
    }

    return mergeFilters(journalConfig.defaultFilters, filters);
  }

  componentDidMount() {
    this.liveComponent = true;
    const { defaultValue, multiple, isSelectModalOpen, initCustomPredicate } = this.props;
    const initValue = this.isQuery ? defaultValue : beArray(defaultValue);

    this.checkJournalId();

    if (!this.isQuery && !multiple) {
      initValue.splice(1);
    }

    if (initValue) {
      this.setValue(initValue, false);
    }

    if (isSelectModalOpen) {
      this.openSelectModal();
    }

    if (initCustomPredicate) {
      this.setCustomPredicate(initCustomPredicate);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!isEqual(prevProps.defaultValue, this.props.defaultValue) && !isEqual(this.props.defaultValue, this.state.value)) {
      this.updateSelectedValue();
    }

    if (this.props.journalId !== prevProps.journalId) {
      this.checkJournalId();

      if (prevProps.journalId) {
        this.resetJournalConfig();
      }
    }

    // Both ready flags stay true after the first successful open, so nothing would refetch on
    // reopen and the list would keep the previous workspace's rows. Only the fetched data is
    // dropped: clearing the value would destroy user input, and on a create form the very control
    // that drives the workspace (the project lookup) would reset itself and flip the workspace back.
    if (this.props.workspaceId !== prevProps.workspaceId && this.isWorkspaceScopedPolicy) {
      this.resetJournalData(this.refetchOpenSelectModal);
    }

    // A change of selected rows is not reloaded data: marking the grid as ready here would keep
    // the rows fetched with the previous custom predicate and suppress the refetch on modal open
    if (!isEqual(omit(prevState.gridData, 'selected'), omit(this.state.gridData, 'selected'))) {
      this.setState({ isGridDataReady: true });
    }
  }

  componentWillUnmount() {
    this.setState({
      pagination: paginationInitState,
      filterPredicate: []
    });
    this.liveComponent = false;
  }

  updateSelectedValue(value = this.props.defaultValue, shouldTriggerOnChange = false) {
    const { multiple } = this.props;
    let newValue;

    if (this.isQuery) {
      newValue = value;
    } else if (multiple && Array.isArray(value) && !!value.length) {
      newValue = [...value];
    } else if (!multiple && !!value) {
      newValue = beArray(value);
    }

    this.setValue(newValue, shouldTriggerOnChange);
  }

  setCustomPredicate(customPredicate) {
    if (!isEqual(this.state.customPredicate, customPredicate)) {
      this.setState({ customPredicate, isGridDataReady: false }, () => {
        this.shouldResetValue().then(({ shouldReset, matchedRows }) => this.liveComponent && shouldReset && this.setValue(matchedRows));
      });
    }
  }

  /**
   * Drops the fetched journal config and rows so the next open refetches them, keeping the
   * selected value. Used when only the query changed, not what the value may legally be.
   *
   * @param {Function} [callback] called once the state is dropped, to refetch right away
   */
  resetJournalData = callback => {
    // `selected` is kept in sync with `value` (see onCancelSelect) and is what
    // onSelectFromJournalPopup saves — dropping it here would make the next OK save an empty value
    this.setState(
      prevState => ({
        journalConfig: { ...emptyJournalConfig },
        isJournalConfigFetched: false,
        isGridDataReady: false,
        gridData: { total: 0, data: [], inMemoryData: [], columns: [], selected: prevState.gridData.selected }
      }),
      callback
    );
  };

  /**
   * Reloads a select modal that is already open. Nothing else would: the fetch is triggered by
   * opening the modal, so it would keep showing the rows of the previous workspace until closed.
   */
  refetchOpenSelectModal = () => {
    if (!this.state.isSelectModalOpen) {
      return;
    }

    // componentDidUpdate has just marked the emptied grid as ready again; without dropping the
    // flag the modal shows the empty result state instead of the loader while the data is fetched
    this.setState({ isGridDataReady: false }, this.fetchJournalData);
  };

  resetJournalConfig = () => {
    const { onChange, multiple } = this.props;

    this.setState(
      {
        journalConfig: { ...emptyJournalConfig },
        isJournalConfigFetched: false,
        isGridDataReady: false,
        filterPredicate: [],
        selectedRows: [],
        gridData: { total: 0, data: [], inMemoryData: [], columns: [], selected: [] },
        value: multiple ? [] : ''
      },
      () => isFunction(onChange) && onChange(multiple ? [] : '')
    );
  };

  checkJournalId = () => {
    const { journalId, onError } = this.props;
    let error = null;

    if (!journalId) {
      error = new Error(t(Labels.NO_JOURNAL_ID_ERROR));
      isFunction(onError) && onError(error);
    }

    this.setState({ error });
  };

  isEmptyJournalConfig(config) {
    const isEmptyEachItem = !Object.entries(config || {})
      .map(item => isEmpty(item[1]))
      .includes(false);

    return isEmpty(config) || isEqual(config, emptyJournalConfig) || isEmptyEachItem;
  }

  shouldResetValue = () => {
    return new Promise(async resolve => {
      const { sortBy, disableResetOnApplyCustomPredicate } = this.props;
      const { selectedRows, customPredicate, pagination, filterPredicate } = this.state;
      let { journalConfig } = this.state;

      if (disableResetOnApplyCustomPredicate || selectedRows.length < 1) {
        return resolve({ shouldReset: false });
      }

      const dbIDsArray = await Promise.all(
        selectedRows.map(({ id }) =>
          Records.get(id)
            .load(isNodeRef(id) ? Attributes.DBID : '?localId')
            .then(dbID => ({ id, dbID }))
        )
      );

      const dbIDsObj = {};
      dbIDsArray.forEach(({ id, dbID }) => (dbIDsObj[id] = dbID));

      const selectedRowsPredicate = customPredicate
        ? {
            t: 'or',
            val: selectedRows.map(item => ({
              t: 'eq',
              att: isNodeRef(item.id) ? Attributes.DBID : 'id',
              val: dbIDsObj[item.id]
            }))
          }
        : null;

      const settings = JournalsConverter.getSettingsForDataLoaderServer({
        sortBy,
        pagination,
        predicates: JournalsConverter.cleanUpPredicate([customPredicate, selectedRowsPredicate, ...(filterPredicate || [])]),
        permissions: { [Permissions.Write]: true }
      });

      if (this.isEmptyJournalConfig(journalConfig)) {
        await this.getJournalConfig();

        ({ journalConfig } = this.state);
      }

      const result = await JournalsService.getJournalData(journalConfig, {
        ...settings,
        workspaces: await this.getSearchWorkspaces()
      });

      const gridData = JournalsConverter.getJournalDataWeb(result);

      if (gridData.total && gridData.total === selectedRows.length) {
        return resolve({ shouldReset: false });
      }

      const matchedRows = Array.isArray(gridData.data)
        ? selectedRows.filter(row => gridData.data.findIndex(item => item.id === row.id) !== -1)
        : null;

      return resolve({ shouldReset: true, matchedRows });
    });
  };

  getJournalConfig = () => {
    const { journalId, displayColumns } = this.props;

    return new Promise(async (resolve, reject) => {
      if (!journalId) {
        reject();
      }

      const journalConfig = await JournalsService.getJournalConfig(journalId);
      let displayedColumns = cloneDeep(journalConfig.columns || []);

      displayedColumns = displayedColumns.map(item => {
        const column = { ...item };
        if (matchCardDetailsLinkFormatterColumn(item)) {
          column.disableFormatter = true;
        }
        return column;
      });

      if (Array.isArray(displayColumns) && displayColumns.length > 0) {
        displayedColumns = displayedColumns.map(item => ({ ...item, default: displayColumns.indexOf(item.attribute) !== -1 }));
      }

      if (this.isEmptyJournalConfig(journalConfig)) {
        this.showWarningMessage();
      }

      this.setState(
        state => ({
          filterPredicate: this._getPresetFilterPredicates(journalConfig),
          displayedColumns,
          journalConfig,
          isJournalConfigFetched: true,
          isSelectModalOpen: state.isSelectModalOpen && this.isEmptyJournalConfig(journalConfig) ? false : state.isSelectModalOpen
        }),
        () => resolve()
      );
    });
  };

  refreshGridData = () => {
    const getData = async resolve => {
      const { sortBy, queryData, customSourceId } = this.props;
      const { customPredicate, journalConfig, gridData, pagination, filterPredicate, displayedColumns } = this.state;
      const predicates = JournalsConverter.cleanUpPredicate([customPredicate, ...(filterPredicate || [])]);
      /** @type JournalSettings */
      const settings = JournalsConverter.getSettingsForDataLoaderServer({
        sourceId: customSourceId,
        sortBy,
        pagination,
        predicates,
        permissions: { [Permissions.Write]: true }
      });
      settings.queryData = queryData;

      const result = await JournalsService.getJournalData(journalConfig, {
        ...settings,
        workspaces: await this.getSearchWorkspaces()
      });
      const fetchedGridData = JournalsConverter.getJournalDataWeb(result);

      fetchedGridData.columns = displayedColumns;

      const mergedData = await this.mergeFetchedDataWithInMemoryData(fetchedGridData);
      const dataGridMerged = { ...gridData, ...mergedData };

      this.setState({
        gridData: dataGridMerged,
        isGridDataReady: true
      });

      resolve(dataGridMerged);
    };

    return new Promise(resolve => {
      this.setState({ isGridDataReady: false }, () =>
        getData(dataGrid => {
          resolve(dataGrid);
          this.setState({ searching: false });
        })
      );
    });
  };

  mergeFetchedDataWithInMemoryData = async fetchedGridData => {
    const { gridData, pagination } = this.state;
    const { inMemoryData = [] } = gridData;

    if (inMemoryData.length < 1) {
      return fetchedGridData;
    }

    let newInMemoryData = [...inMemoryData];

    for (let i = 0; i < inMemoryData.length; i++) {
      const memoryRecord = inMemoryData[i];
      const exists = fetchedGridData.data.find(item => item.id === memoryRecord.id);

      if (exists) {
        // if the record has been indexed, remove it from inMemoryData
        newInMemoryData = newInMemoryData.filter(item => item.id !== memoryRecord.id);
      } else if (fetchedGridData.data.length < pagination.maxItems) {
        // otherwise, try to load absent attributes
        const rec = Records.get(memoryRecord.id);

        await rec.load(fetchedGridData.attributes);

        const loadedAtts = rec.getRawAttributes();
        const formattedAtts = {}; // Cause: https://citeck.atlassian.net/browse/ECOSUI-908

        for (let attr in loadedAtts) {
          if (!loadedAtts.hasOwnProperty(attr)) {
            continue;
          }

          let newAttr = attr;

          if (newAttr.indexOf('(n:"') !== -1) {
            newAttr = newAttr.substring(newAttr.indexOf('(n:"') + 4, newAttr.indexOf('")'));
          }

          if (newAttr.indexOf('?') !== -1) {
            newAttr = newAttr.substr(0, newAttr.indexOf('?'));
          }

          if (newAttr.indexOf('{') !== -1 && newAttr.indexOf('}') !== -1) {
            newAttr = newAttr.substring(0, newAttr.indexOf('{'));
          }

          newAttr = newAttr.replace(':', '_');
          formattedAtts[newAttr] = loadedAtts[attr];
        }

        // add a temporary record to the fetchedData.data
        fetchedGridData.data.push({ ...memoryRecord, ...loadedAtts, ...formattedAtts });
      }
    }

    return {
      ...fetchedGridData,
      inMemoryData: newInMemoryData,
      total: fetchedGridData.total + newInMemoryData.length
    };
  };

  hideSelectModal = () => {
    const { onCancel } = this.props;

    this.setState({ isSelectModalOpen: false });
    isFunction(onCancel) && onCancel();
  };

  toggleCollapsePanel = () => {
    this.setState({ isCollapsePanelOpen: !this.state.isCollapsePanelOpen });
  };

  onSelectFromJournalPopup = () => {
    const {
      gridData: { query, selected }
    } = this.state;
    const value = this.isQuery ? query : selected;

    this.setValue(value).then(() => this.liveComponent && this.setState({ isSelectModalOpen: false, wasChangedFromPopup: true }));
  };

  fillCanEdit = rows => {
    return Records.get(rows.map(r => r.id))
      .load(PERMISSION_WRITE_ATTR)
      .then(permissions => {
        let result = [];

        for (let i = 0; i < rows.length; i++) {
          result.push({
            ...rows[i],
            canEdit: permissions[i]
          });
        }

        return result;
      });
  };

  fillWorkspaceId = rows => {
    return Records.get(rows.map(r => r.id))
      .load('_workspace?localId')
      .then(workspacesId => {
        let result = [];

        for (let i = 0; i < rows.length; i++) {
          result.push({
            ...rows[i],
            locatedWorkspaceId: workspacesId[i]
          });
        }

        return result;
      });
  };

  fetchTableAttributes = rows => {
    const { viewMode, forceReload } = this.props;
    const { isJournalConfigFetched, isGridDataReady } = this.state;

    if (viewMode !== DisplayModes.TABLE) {
      return rows;
    }

    let readyPromise = Promise.resolve();

    if (!isJournalConfigFetched) {
      readyPromise = this.getJournalConfig().then(this.refreshGridData);
    } else if (!isGridDataReady) {
      readyPromise = this.refreshGridData();
    }

    return readyPromise.then(dataGrid => {
      const atts = [];
      const noNeedParseIndices = [];
      const tableColumns = isEmpty(this.getColumns()) && !isEmpty(get(dataGrid, 'columns')) ? dataGrid.columns : this.getColumns();

      tableColumns.forEach((item, idx) => {
        const isFullName = item.attribute.startsWith('.att');
        const hasBracket = item.attribute.includes('{');
        const hasQChar = item.attribute.includes('?');

        if (isFullName || hasBracket || hasQChar) {
          atts.push(item.attribute);
          noNeedParseIndices.push(idx);
          return;
        }

        const multiplePostfix = item.multiple ? 's' : '';
        const schema = `.att${multiplePostfix}(n:"${item.attribute}"){disp}`;

        atts.push(schema);
      });

      return Promise.all(
        rows.map(r => {
          return Records.get(r.id)
            .load(atts, forceReload)
            .then(result => {
              const fetchedAtts = {};
              let currentAttIndex = 0;

              for (let attSchema in result) {
                if (!result.hasOwnProperty(attSchema)) {
                  continue;
                }

                if (noNeedParseIndices.includes(currentAttIndex)) {
                  fetchedAtts[attSchema] = result[attSchema];
                } else {
                  const attData = parseAttribute(attSchema);
                  if (!attData) {
                    currentAttIndex++;
                    continue;
                  }

                  fetchedAtts[attData.name] = result[attSchema];
                }
                currentAttIndex++;
              }

              return { ...fetchedAtts, ...r };
            });
        })
      );
    });
  };

  fetchDisplayNames = selectedRows => {
    let computedDispName = get(this.props, 'computed.valueDisplayName', null);
    return Promise.all(
      selectedRows.map(r => {
        if (r.disp) {
          return r.disp;
        }
        if (computedDispName) {
          return computedDispName(r);
        }
        return Records.get(r).load('.disp');
      })
    ).then(dispNames =>
      selectedRows.map((row, index) => {
        const id = get(row, 'id') || row;
        const disp = get(dispNames, [index]) || id;
        return { id, disp };
      })
    );
  };

  /**
   * @param {String|Array<String>|RecordsQuery} selected - value can be array or string - recordRef or query for selection
   * @param shouldTriggerOnChange - default TRUE
   * @param flags - default empty object
   * @returns {Promise<unknown>}
   */
  setValue = (selected, shouldTriggerOnChange = true, flags) => {
    const { onChange, multiple } = this.props;

    this.setState({ isLoading: true });

    if (this.isQuery) {
      !this.state.gridData.total && this.getJournalConfig().then(this.refreshGridData);
      return new Promise(resolve => {
        this.setState({ value: selected, isLoading: false }, () => shouldTriggerOnChange && isFunction(onChange) && onChange(selected));
        resolve();
      });
    }

    selected = beArray(selected);

    return this.fetchDisplayNames(selected)
      .then(this.fillCanEdit)
      .then(this.fetchTableAttributes)
      .then(this.fillWorkspaceId)
      .then(selected => {
        if (!this.liveComponent) {
          return;
        }

        const newValue = multiple ? selected.map(item => item.id) : get(selected, '[0].id', '');

        return new Promise(resolve => {
          this.setState(
            prevState => ({
              value: newValue,
              selectedRows: selected,
              gridData: {
                ...prevState.gridData,
                selected: selected.map(item => item.id)
              },
              isLoading: false
            }),
            () => {
              shouldTriggerOnChange && isFunction(onChange) && onChange(newValue, selected, flags);
              resolve();
            }
          );
        });
      });
  };

  onCancelSelect = () => {
    const { multiple, onCancel } = this.props;

    this.setState(prevState => ({
      gridData: {
        ...prevState.gridData,
        selected: multiple ? prevState.value : [prevState.value]
      },
      isSelectModalOpen: false
    }));
    isFunction(onCancel) && onCancel();
  };

  onSelectGridItem = value => {
    this.setState(prevState => ({
      gridData: {
        ...prevState.gridData,
        selected: value.selected
      }
    }));
  };

  onRowDoubleClick = ([, data]) => {
    const { multiple } = this.props;
    const val = data.id;
    const _selected = this.state.gridData.selected;
    const filtered = _selected.filter(v => v !== val);
    let selected;

    if (filtered.length !== _selected.length) {
      selected = filtered;
    } else {
      if (multiple) {
        filtered.push(val);
        selected = filtered;
      } else {
        selected = [val];
      }
    }
    this.setState(prevState => ({ gridData: { ...prevState.gridData, selected } }), this.onSelectFromJournalPopup);
  };

  openSelectModal = () => {
    const { isJournalConfigFetched, isGridDataReady, journalConfig } = this.state;

    if (this.isEmptyJournalConfig(journalConfig) && isJournalConfigFetched && isGridDataReady) {
      this.setState({ isSelectModalOpen: false });

      this.showWarningMessage();

      return;
    }

    this.setState({ isSelectModalOpen: true });

    if (!isJournalConfigFetched) {
      this.fetchJournalData();
    } else if (!isGridDataReady) {
      this.refreshGridData();
    }
  };

  fetchJournalData = () => this.getJournalConfig().then(this.refreshGridData);

  onCreateFormSubmit = (record, _form, alias) => {
    const { multiple } = this.props;
    const { gridData, pagination } = this.state;

    const prevSelected = gridData.selected || [];
    const createdSortObject = gridData.query.sortBy.find(el => el.attribute === '_created');
    const isAscending = createdSortObject && createdSortObject.ascending;
    const newSkipCount = isAscending
      ? Math.floor(gridData.total / pagination.maxItems) * pagination.maxItems
      : paginationInitState.skipCount;
    const newPageNum = isAscending ? Math.ceil((gridData.total + 1) / pagination.maxItems) : paginationInitState.page;

    if (!alias) {
      this.fetchJournalData();
      return;
    }

    alias.toJsonAsync(true).then(res => {
      const newData = cloneDeep(this.state);
      const aliasAttrs = alias.getRawAttributes();
      const resolvedAttrs = cloneDeep(res.attributes);
      const selected = multiple ? [...prevSelected, record.id] : [record.id];
      const inMemoryData = [{ id: record.id, ...aliasAttrs, ...resolvedAttrs }];

      merge(newData, {
        gridData: { selected, inMemoryData },
        filterPredicate: [],
        pagination: { skipCount: newSkipCount, page: newPageNum }
      });

      this.setState(newData, this.fetchJournalData);
    });
  };

  onValueEdit = record => {
    FormManager.openFormModal({
      record,
      onSubmit: () => {
        this.setValue(this.state.gridData.selected);
        this.refreshGridData();
      },
      initiator: {
        type: 'form-component',
        name: 'SelectJournal'
      }
    });
  };

  onValueDelete = id => {
    let newValue;

    if (this.isQuery) {
      newValue = null;
    } else {
      newValue = this.state.selectedRows.filter(item => item.id !== id);
    }

    this.setValue(newValue, true, { changeByUser: true });
  };

  onChangePage = _pagination_ => {
    const pagination = { ...this.state.pagination, ..._pagination_ };
    this.setState({ pagination }, this.refreshGridData);
  };

  onApplyFilters = filterPredicate => {
    this.setState(
      () => ({
        filterPredicate,
        pagination: paginationInitState,
        isJournalConfigFetched: true,
        searching: true
      }),
      this.refreshGridData
    );
  };

  onCreate = record => {
    this.setValue(record.id);
  };

  onChangeIsLocaleData = ({ checked }) => {
    const { isLocaleData } = this.state;

    if (isLocaleData !== checked) {
      this.setState({ isLocaleData: checked }, this.refreshGridData);
    }
  };

  getColumns = () => {
    const { columns } = this.props;
    const baseColumns = get(this.state, 'gridData.columns', []);

    if (!this._memoizedColumns || this._memoizedColumns.props !== columns || this._memoizedColumns.baseColumns !== baseColumns) {
      let result;

      if (isEmpty(columns)) {
        result = baseColumns;
      } else {
        result = columns.map(item => {
          const { dataField, ...otherData } = baseColumns.find(column => column.dataField === item.dataField) || {};

          return {
            ...otherData,
            ...item,
            dataField: dataField || item.attribute
          };
        });
      }

      this._memoizedColumns = {
        props: columns,
        baseColumns,
        result
      };

      return result;
    }

    return this._memoizedColumns.result;
  };

  showWarningMessage = () => {
    DialogManager.showInfoDialog({
      text: t(Labels.NO_JOURNAL_CONFIG_ERROR, { journalId: this.props.journalId })
    });
  };

  renderSelectModal() {
    const { multiple, hideCreateButton, searchField, isFullScreenWidthModal, title, journalId, customValues, viewMode } = this.props;
    const {
      isGridDataReady,
      isSelectModalOpen,
      isCollapsePanelOpen,
      gridData,
      journalConfig,
      pagination,
      isCreateModalOpen,
      isLocaleData,
      searching
    } = this.state;
    const extraProps = {};

    let selectModalTitle = t(Labels.DEFAULT_TITLE);

    if (get(journalConfig, 'meta.title')) {
      selectModalTitle += `: ${journalConfig.meta.title}`;
    }

    if (isMobileDevice()) {
      extraProps.scrollable = true;
      extraProps.autoHeight = true;
    }

    if (this.isQuery) {
      const demoSelected = get(gridData, 'data', []).map(item => item.id);

      extraProps.singleSelectable = false;
      extraProps.multiSelectable = true;
      extraProps.noSelectorMenu = true;
      extraProps.selected = isGridDataReady ? demoSelected : [];
      extraProps.nonSelectable = demoSelected;
      extraProps.onRowDoubleClick = undefined;
    }

    const hideSelectPanel = viewMode === DisplayModes.CUSTOM && customValues;
    const gridMaxHeight = Math.max(SELECT_MODAL_GRID_MIN_HEIGHT, window.innerHeight - SELECT_MODAL_RESERVED_HEIGHT);

    return (
      <EcosModal
        title={title || selectModalTitle}
        isOpen={isSelectModalOpen}
        hideModal={this.hideSelectModal}
        className={classNames(SELECT_JOURNAL_MODAL_CLASSNAME, {
          'ecos-modal_width-lg': !isFullScreenWidthModal,
          'ecos-modal_width-full': isFullScreenWidthModal
        })}
      >
        {!hideSelectPanel && (
          <div className="select-journal-collapse-panel">
            <div className="select-journal-collapse-panel__controls">
              <div className="select-journal-collapse-panel__controls-left">
                {!hideCreateButton && (
                  <CreateVariants
                    items={get(journalConfig, 'meta.createVariants')}
                    toggleCreateModal={this.toggleCreateModal}
                    isCreateModalOpen={isCreateModalOpen}
                    onCreateFormSubmit={this.onCreateFormSubmit}
                    getCreateWorkspaceId={this.getCreateWorkspaceId}
                  />
                )}
                <IcoBtn
                  invert
                  icon={getIconUpDown(isCollapsePanelOpen)}
                  className="ecos-btn_drop-down ecos-btn_r_8 ecos-btn_x-step_10 select-journal-collapse-panel__controls-left-btn-filter"
                  onClick={this.toggleCollapsePanel}
                >
                  {t(Labels.FILTER_BUTTON)}
                </IcoBtn>
                {!!journalConfig.system && (
                  <Checkbox
                    className="select-journal-collapse-panel__controls-left_checkbox"
                    checked={isLocaleData}
                    onChange={this.onChangeIsLocaleData}
                  >
                    {t(Labels.LOCAL_DATA)}
                  </Checkbox>
                )}
              </div>
              <div className="select-journal-collapse-panel__controls-right">
                {!this.isQuery && <Search searchField={searchField} onApply={this.onApplyFilters} />}
              </div>
            </div>

            <Collapse isOpen={isCollapsePanelOpen}>
              {journalConfig.columns && <Filters columns={journalConfig.columns} onApply={this.onApplyFilters} />}
            </Collapse>
          </div>
        )}

        {this.isQuery && (
          <div className="select-journal__info-msg">
            <Icon className="icon-filter" />
            {`${t(Labels.MSG_WHOLE_SELECTION)}. ${t(Labels.SELECTED_LABEL, { data: gridData.total })}`}
          </div>
        )}
        <div id={getHtmlIdByUid(journalId, 'container')} className="select-journal__grid-container">
          {!isGridDataReady && <Loader type="points" />}

          <Grid
            {...gridData}
            singleSelectable={!multiple}
            multiSelectable={multiple}
            onSelect={this.onSelectGridItem}
            className={classNames('select-journal__grid', { 'select-journal__grid_transparent': !isGridDataReady })}
            scrollable
            autoHeight
            maxHeight={gridMaxHeight}
            onRowDoubleClick={this.onRowDoubleClick}
            pageId={journalId}
            {...extraProps}
          />
        </div>

        <div className="select-journal-select-modal__buttons">
          <Pagination
            className="select-journal__pagination"
            total={gridData.total}
            {...pagination}
            onChange={this.onChangePage}
            searching={searching}
          />
          <div className="select-journal-select-modal__buttons-space" />
          <Btn className="select-journal-select-modal__buttons-cancel" onClick={this.onCancelSelect}>
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn className="ecos-btn_blue select-journal-select-modal__buttons-ok" onClick={this.onSelectFromJournalPopup}>
            {t(Labels.SAVE_BUTTON)}
          </Btn>
        </div>
      </EcosModal>
    );
  }

  render() {
    const {
      journalId,
      multiple,
      isCompact,
      viewOnly,
      placeholder,
      disabled,
      hideEditRowButton,
      hideDeleteRowButton,
      inputViewClass,
      autoFocus,
      onBlur,
      customActionRefs,
      renderView,
      enableCreateButton,
      isSelectedValueAsText,
      isInlineEditingMode,
      isModalMode,
      linkFormatter,
      viewMode
    } = this.props;
    const { journalConfig, selectedRows, error, gridData, value, isLoading } = this.state;
    const selectedQueryInfo = this.isQuery && !isEmpty(value) && t(Labels.SELECTED_LABEL, { data: gridData.total });

    const inputViewProps = {
      journalId,
      disabled,
      isCompact,
      multiple,
      placeholder,
      linkFormatter,
      viewOnly,
      error,
      selectedRows: this.isQuery ? value : selectedRows,
      editValue: this.onValueEdit,
      deleteValue: this.onValueDelete,
      openSelectModal: this.openSelectModal,
      className: inputViewClass,
      autoFocus,
      onBlur,
      hideEditRowButton,
      hideDeleteRowButton,
      isSelectedValueAsText,
      isInlineEditingMode,
      isModalMode,
      viewMode,
      customActionRefs,
      enableCreateButton,
      getCreateWorkspaceId: this.getCreateWorkspaceId,
      selectedQueryInfo,
      gridData: {
        columns: this.getColumns(),
        data: this.state.selectedRows,
        total: this.state.selectedRows.length,
        editable: false,
        singleSelectable: false,
        multiSelectable: false,
        selectAllRecords: null,
        selectAllRecordsVisible: null,
        className: 'select-journal__grid',
        scrollable: false
      },
      onCreate: this.onCreate
    };

    const DefaultView = viewOnly ? (
      <ViewMode {...inputViewProps} />
    ) : (
      <InputView {...inputViewProps} disabled={disabled || !journalId || !!journalId.match(TEMPLATE_REGEX)} />
    );

    return (
      <div
        className={classNames('select-journal', {
          'select-journal_compact': isCompact,
          'select-journal_view-only': viewOnly
        })}
      >
        {isFunction(renderView) ? renderView(inputViewProps) : DefaultView}

        {isLoading && <Loader blur type="points" />}

        <FiltersProvider
          columns={journalConfig.columns}
          sourceId={journalConfig.sourceId}
          presetFilterPredicates={this._getPresetFilterPredicates(journalConfig)}
          metaRecord={journalConfig.metaRecord}
        >
          {this.renderSelectModal()}
        </FiltersProvider>
      </div>
    );
  }
}

const predicateShape = PropTypes.shape({
  t: PropTypes.string.isRequired,
  att: PropTypes.string.isRequired,
  val: PropTypes.any
});

SelectJournal.propTypes = {
  journalId: PropTypes.string,
  /** Ref of the record whose workspace related records are searched in. Used by the grid's inline
   *  assoc editor, which has no form to take a ready workspace id from. */
  recordRef: PropTypes.string,
  /** Ready workspace id to search and create in. Wins over recordRef. Passed by the formio control. */
  workspaceId: PropTypes.string,
  searchInWorkspacePolicy: PropTypes.oneOf(Object.values(SearchInWorkspacePolicy)),
  searchInAdditionalWorkspaces: PropTypes.arrayOf(PropTypes.string),
  queryData: PropTypes.object,
  dataType: PropTypes.oneOf(Object.values(DataTypes)),
  customSourceId: PropTypes.string,
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string, PropTypes.object]),
  onChange: PropTypes.func,
  onError: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  isFullScreenWidthModal: PropTypes.bool,
  hideCreateButton: PropTypes.bool,
  enableCreateButton: PropTypes.bool,
  hideEditRowButton: PropTypes.bool,
  hideDeleteRowButton: PropTypes.bool,
  displayColumns: PropTypes.array,
  presetFilterPredicates: PropTypes.arrayOf(predicateShape),
  initCustomPredicate: PropTypes.oneOfType([PropTypes.arrayOf(predicateShape), predicateShape]),
  disableResetOnApplyCustomPredicate: PropTypes.bool,
  viewOnly: PropTypes.bool,
  customActionRefs: PropTypes.array,
  renderView: PropTypes.func,
  searchField: PropTypes.string,
  viewMode: PropTypes.string,
  customValues: PropTypes.array,
  isSelectModalOpen: PropTypes.bool,
  isSelectedValueAsText: PropTypes.bool,
  sortBy: PropTypes.shape({
    attribute: PropTypes.string,
    ascending: PropTypes.bool
  }),
  columns: PropTypes.array,
  title: PropTypes.string
};

SelectJournal.defaultProps = {
  enableCreateButton: false,
  customActionRefs: [],
  isSelectModalOpen: false,
  presetFilterPredicates: []
};
