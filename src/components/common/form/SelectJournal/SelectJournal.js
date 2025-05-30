import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Collapse } from 'reactstrap';

import FormManager from '../../../EcosForm/FormManager';
import JournalsService from '../../../Journals/service';
import { mergeFilters } from '../../../Journals/service/util';
import Records from '../../../Records';
import { PERMISSION_WRITE_ATTR } from '../../../Records/constants';
import { PREDICATE_EQ } from '../../../Records/predicates/predicates';
import { parseAttribute } from '../../../Records/utils/attStrUtils';
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
import { DataTypes, DisplayModes, Labels } from './constants';

import { Attributes, Permissions } from '@/constants';
import JournalsConverter from '@/dto/journals';
import { TEMPLATE_REGEX } from '@/forms/components/custom/selectJournal/constants';
import { getIconUpDown } from '@/helpers/icon';
import { getHtmlIdByUid, beArray, isMobileDevice, t, isNodeRef } from '@/helpers/util';

import './SelectJournal.scss';

const paginationInitState = {
  skipCount: 0,
  maxItems: 10,
  page: 1
};

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
    isLoading: false
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

  get isQuery() {
    return this.props.dataType === DataTypes.QUERY;
  }

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

      const result = await JournalsService.getJournalData(journalConfig, settings);
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
      const { journalConfig, gridData, pagination, filterPredicate, displayedColumns } = this.state;

      const predicates = JournalsConverter.cleanUpPredicate([...(filterPredicate || [])]);

      /** @type JournalSettings */
      const settings = JournalsConverter.getSettingsForDataLoaderServer({
        sourceId: customSourceId,
        sortBy,
        pagination,
        predicates,
        permissions: { [Permissions.Write]: true }
      });
      settings.queryData = queryData;

      const result = await JournalsService.getJournalData(journalConfig, settings);
      const fetchedGridData = JournalsConverter.getJournalDataWeb(result);

      fetchedGridData.columns = displayedColumns;

      const mergedData = await this.mergeFetchedDataWithInMemoryData(fetchedGridData);

      this.setState({
        gridData: { ...gridData, ...mergedData },
        isGridDataReady: true
      });

      resolve(gridData);
    };

    return new Promise(resolve => {
      this.setState({ isGridDataReady: false }, () => getData(resolve));
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

    return readyPromise.then(() => {
      const atts = [];
      const noNeedParseIndices = [];
      const tableColumns = this.getColumns();

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
      this.getJournalConfig().then(this.refreshGridData);
    } else if (!isGridDataReady) {
      this.refreshGridData();
    }
  };

  onCreateFormSubmit = (record, form, alias) => {
    const { multiple } = this.props;
    const { gridData, pagination } = this.state;

    const prevSelected = gridData.selected || [];
    const createdSortObject = gridData.query.sortBy.find(el => el.attribute === '_created');
    const isAscending = createdSortObject && createdSortObject.ascending;
    const newSkipCount = isAscending
      ? Math.floor(gridData.total / pagination.maxItems) * pagination.maxItems
      : paginationInitState.skipCount;
    const newPageNum = isAscending ? Math.ceil((gridData.total + 1) / pagination.maxItems) : paginationInitState.page;

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

      this.setState(newData, this.refreshGridData);
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
        isJournalConfigFetched: true
      }),
      this.refreshGridData
    );
  };

  onCreate = record => {
    this.setValue(record.id);
  };

  getColumns = () => {
    const { columns } = this.props;
    const baseColumns = get(this.state, 'gridData.columns', []);

    if (isEmpty(columns)) {
      return baseColumns;
    }

    return columns.map(item => {
      const { dataField, ...otherData } = baseColumns.find(column => column.dataField === item.dataField) || {};

      return {
        ...otherData,
        ...item,
        dataField: dataField || item.attribute
      };
    });
  };

  showWarningMessage = () => {
    DialogManager.showInfoDialog({
      text: t(Labels.NO_JOURNAL_CONFIG_ERROR, { journalId: this.props.journalId })
    });
  };

  renderSelectModal() {
    const { multiple, hideCreateButton, searchField, isFullScreenWidthModal, title, journalId, customValues, viewMode } = this.props;
    const { isGridDataReady, isSelectModalOpen, isCollapsePanelOpen, gridData, journalConfig, pagination, isCreateModalOpen } = this.state;
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

    return (
      <EcosModal
        title={title || selectModalTitle}
        isOpen={isSelectModalOpen}
        hideModal={this.hideSelectModal}
        className={classNames('select-journal-select-modal', {
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
          {!isGridDataReady && <Loader />}

          <Grid
            {...gridData}
            singleSelectable={!multiple}
            multiSelectable={multiple}
            onSelect={this.onSelectGridItem}
            className={classNames('select-journal__grid', { 'select-journal__grid_transparent': !isGridDataReady })}
            scrollable
            autoHeight
            byContentHeight
            onRowDoubleClick={this.onRowDoubleClick}
            pageId={journalId}
            {...extraProps}
          />
        </div>

        <div className="select-journal-select-modal__buttons">
          <Pagination className="select-journal__pagination" total={gridData.total} {...pagination} onChange={this.onChangePage} />
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

        {isLoading && <Loader blur />}

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
