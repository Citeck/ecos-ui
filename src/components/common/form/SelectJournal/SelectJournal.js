import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { Attributes, Permissions } from '../../../../constants';
import { t } from '../../../../helpers/util';
import { DisplayModes } from '../../../../forms/components/custom/selectJournal/constants';
import JournalsConverter from '../../../../dto/journals';
import JournalsService from '../../../Journals/service';
import { EcosModal, Loader, Pagination } from '../../../common';
import { Btn, IcoBtn } from '../../../common/btns';
import { Grid } from '../../../common/grid';
import { matchCardDetailsLinkFormatterColumn } from '../../../common/grid/mapping/Mapper';
import FormManager from '../../../EcosForm/FormManager';
import Records from '../../../Records';
import { parseAttribute } from '../../../Records/utils/attStrUtils';

import InputView from './InputView';
import ViewMode from './ViewMode';
import Filters from './Filters';
import Search from './Search';
import CreateVariants from './CreateVariants';
import FiltersProvider from './Filters/FiltersProvider';
import { DialogManager } from '../../dialogs';

import './SelectJournal.scss';

const paginationInitState = {
  skipCount: 0,
  maxItems: 10,
  page: 1
};

const emptyJournalConfig = Object.freeze({
  meta: {}
});

const Labels = {
  NO_JOURNAL_ID_ERROR: 'select-journal.error.no-journal-id',
  NO_JOURNAL_CONFIG_ERROR: 'select-journal.error.no-journal-config',
  DEFAULT_TITLE: 'select-journal.select-modal.title',
  FILTER_BUTTON: 'select-journal.select-modal.filter-button',
  CANCEL_BUTTON: 'select-journal.select-modal.cancel-button',
  SAVE_BUTTON: 'select-journal.select-modal.ok-button'
};

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
    customPredicate: null
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

  componentDidMount() {
    const { defaultValue, multiple, isSelectModalOpen, initCustomPredicate } = this.props;
    this.checkJournalId();

    let initValue;
    if (multiple && Array.isArray(defaultValue) && defaultValue.length > 0) {
      initValue = [...defaultValue];
    } else if (!multiple && !!defaultValue) {
      if (Array.isArray(defaultValue)) {
        initValue = defaultValue;
      } else {
        initValue = [defaultValue];
      }
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

  updateSelectedValue(value = this.props.defaultValue, shouldTriggerOnChange = false) {
    const { multiple } = this.props;
    let newValue;

    if (multiple && Array.isArray(value) && value.length > 0) {
      newValue = [...value];
    } else if (!multiple && !!value) {
      if (Array.isArray(value)) {
        newValue = value;
      } else {
        newValue = [value];
      }
    }

    this.setValue(newValue, shouldTriggerOnChange);
  }

  setCustomPredicate(customPredicate) {
    if (!isEqual(this.state.customPredicate, customPredicate)) {
      this.setState({ customPredicate, isGridDataReady: false }, () => {
        this.shouldResetValue().then(({ shouldReset, matchedRows }) => {
          shouldReset && this.setValue(matchedRows);
        });
      });
    }
  }

  checkJournalId = () => {
    const { journalId, onError } = this.props;

    if (!journalId) {
      const error = new Error(t(Labels.NO_JOURNAL_ID_ERROR));
      typeof onError === 'function' && onError(error);
      this.setState({ error });
    } else {
      this.setState({ error: null });
    }
  };

  isEmptyJournalConfig(config) {
    const isEmptyEachItem = !Object.entries(config || {})
      .map(item => isEmpty(item[1]))
      .includes(false);

    return isEmpty(config) || isEqual(config, emptyJournalConfig) || isEmptyEachItem;
  }

  shouldResetValue = () => {
    return new Promise(async resolve => {
      const { customPredicate, pagination, filterPredicate } = this.state;
      const { selectedRows } = this.state;
      const { sortBy, disableResetOnApplyCustomPredicate } = this.props;
      let { journalConfig } = this.state;

      if (disableResetOnApplyCustomPredicate || selectedRows.length < 1) {
        return resolve({ shouldReset: false });
      }

      const dbIDsArray = await Promise.all(
        selectedRows.map(({ id }) =>
          Records.get(id)
            .load(Attributes.DBID)
            .then(dbID => ({ id, dbID }))
        )
      );
      const dbIDsObj = {};
      dbIDsArray.forEach(({ id, dbID }) => (dbIDsObj[id] = dbID));

      const selectedRowsPredicate = customPredicate
        ? { t: 'or', val: selectedRows.map(item => ({ t: 'eq', att: Attributes.DBID, val: dbIDsObj[item.id] })) }
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
    const { journalId, displayColumns, presetFilterPredicates } = this.props;

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
          filterPredicate: presetFilterPredicates || [],
          displayedColumns,
          journalConfig,
          isJournalConfigFetched: true,
          isSelectModalOpen: state.isSelectModalOpen && this.isEmptyJournalConfig(journalConfig) ? false : state.isSelectModalOpen
          // isCollapsePanelOpen: Array.isArray(presetFilterPredicates) && presetFilterPredicates.length > 0
        }),
        resolve
      );
    });
  };

  refreshGridData = () => {
    const getData = async resolve => {
      const { sortBy, queryData, customSourceId } = this.props;
      const { customPredicate, journalConfig, gridData, pagination, filterPredicate, displayedColumns } = this.state;
      const predicates = JournalsConverter.cleanUpPredicate([customPredicate, ...(filterPredicate || [])]);
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

        // Cause: https://citeck.atlassian.net/browse/ECOSUI-908
        const formattedAtts = {};
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

    this.setState({
      isSelectModalOpen: false
    });

    if (typeof onCancel === 'function') {
      onCancel.call(this);
    }
  };

  toggleCollapsePanel = () => {
    this.setState({
      isCollapsePanelOpen: !this.state.isCollapsePanelOpen
    });
  };

  onSelectFromJournalPopup = () => {
    this.setValue(this.state.gridData.selected).then(() => {
      this.setState({
        isSelectModalOpen: false,
        wasChangedFromPopup: true
      });
    });
  };

  fillCanEdit = rows => {
    return Records.get(rows.map(r => r.id))
      .load('.att(n:"permissions"){has(n:"Write")}')
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
    const { viewMode } = this.props;
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
            .load(atts)
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
    ).then(dispNames => {
      let result = [];
      for (let i = 0; i < selectedRows.length; i++) {
        result.push({
          id: selectedRows[i].id || selectedRows[i],
          disp: dispNames[i] || selectedRows[i]
        });
      }
      return result;
    });
  };

  setValue = (selected, shouldTriggerOnChange = true) => {
    const { onChange, multiple } = this.props;

    if (!selected) {
      selected = [];
    } else if (!Array.isArray(selected)) {
      selected = [selected];
    }

    return this.fetchDisplayNames(selected)
      .then(this.fillCanEdit)
      .then(this.fetchTableAttributes)
      .then(selected => {
        let newValue;
        if (multiple) {
          newValue = selected.map(item => item.id);
        } else {
          newValue = selected.length > 0 ? selected[0]['id'] : '';
        }

        return new Promise(resolve => {
          this.setState(
            prevState => {
              return {
                value: newValue,
                selectedRows: selected,
                gridData: {
                  ...prevState.gridData,
                  selected: selected.map(item => item.id)
                }
              };
            },
            () => {
              if (shouldTriggerOnChange && typeof onChange === 'function') {
                onChange(newValue, selected);
              }
              resolve();
            }
          );
        });
      });
  };

  onCancelSelect = () => {
    const { multiple, onCancel } = this.props;

    this.setState(prevState => {
      return {
        gridData: {
          ...prevState.gridData,
          selected: multiple ? prevState.value : [prevState.value]
        },
        isSelectModalOpen: false
      };
    });

    if (typeof onCancel === 'function') {
      onCancel.call(this);
    }
  };

  onSelectGridItem = value => {
    this.setState(prevState => {
      return {
        gridData: {
          ...prevState.gridData,
          selected: value.selected
        }
      };
    });
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

    this.setState(state => {
      const prevSelected = state.gridData.selected || [];
      const newSkipCount = Math.floor(state.gridData.total / state.pagination.maxItems) * state.pagination.maxItems;
      const newPageNum = Math.ceil((state.gridData.total + 1) / state.pagination.maxItems);

      return {
        gridData: {
          ...state.gridData,
          selected: multiple ? [...prevSelected, record.id] : [record.id],
          inMemoryData: [
            ...state.gridData.inMemoryData,
            {
              id: record.id,
              ...alias.getRawAttributes()
            }
          ]
        },
        filterPredicate: [],
        pagination: {
          ...state.pagination,
          skipCount: newSkipCount,
          page: newPageNum
        }
      };
    }, this.refreshGridData);
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
    const newValue = this.state.selectedRows.filter(item => item.id !== id);

    this.setValue(newValue);
  };

  onChangePage = _pagination_ => {
    const pagination = { ...this.state.pagination, ..._pagination_ };
    this.setState({ pagination }, this.refreshGridData);
  };

  onApplyFilters = filterPredicate => {
    this.setState(prevState => {
      return {
        filterPredicate,
        pagination: paginationInitState,
        isJournalConfigFetched: true
      };
    }, this.refreshGridData);
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
    const { multiple, hideCreateButton, searchField, isFullScreenWidthModal } = this.props;
    const { isGridDataReady, isSelectModalOpen, isCollapsePanelOpen, gridData, journalConfig, pagination } = this.state;

    let selectModalTitle = t(Labels.DEFAULT_TITLE);

    if (get(journalConfig, 'meta.title')) {
      selectModalTitle += `: ${journalConfig.meta.title}`;
    }

    const selectModalClasses = classNames('select-journal-select-modal', {
      'ecos-modal_width-lg': !isFullScreenWidthModal,
      'ecos-modal_width-full': isFullScreenWidthModal
    });

    const gridClasses = classNames('select-journal__grid', {
      'select-journal__grid_transparent': !isGridDataReady
    });

    return (
      <EcosModal title={selectModalTitle} isOpen={isSelectModalOpen} hideModal={this.hideSelectModal} className={selectModalClasses}>
        <div className={'select-journal-collapse-panel'}>
          <div className={'select-journal-collapse-panel__controls'}>
            <div className={'select-journal-collapse-panel__controls-left'}>
              <IcoBtn
                invert
                icon={isCollapsePanelOpen ? 'icon-small-up' : 'icon-small-down'}
                className="ecos-btn_drop-down ecos-btn_r_8 ecos-btn_blue ecos-btn_x-step_10 select-journal-collapse-panel__controls-left-btn-filter"
                onClick={this.toggleCollapsePanel}
              >
                {t(Labels.FILTER_BUTTON)}
              </IcoBtn>

              {hideCreateButton ? null : (
                <CreateVariants items={get(journalConfig, 'meta.createVariants')} onCreateFormSubmit={this.onCreateFormSubmit} />
              )}
            </div>
            <div className={'select-journal-collapse-panel__controls-right'}>
              <Search searchField={searchField} onApply={this.onApplyFilters} />
            </div>
          </div>

          <Collapse isOpen={isCollapsePanelOpen}>
            {journalConfig.columns ? <Filters columns={journalConfig.columns} onApply={this.onApplyFilters} /> : null}
          </Collapse>
        </div>

        <div className={'select-journal__grid-container'}>
          {!isGridDataReady ? <Loader /> : null}

          <Grid
            {...gridData}
            singleSelectable={!multiple}
            multiSelectable={multiple}
            onSelect={this.onSelectGridItem}
            selectAllRecords={null}
            selectAllRecordsVisible={null}
            className={gridClasses}
            scrollable={false}
          />

          <Pagination className={'select-journal__pagination'} total={gridData.total} {...pagination} onChange={this.onChangePage} />
        </div>

        <div className="select-journal-select-modal__buttons">
          <Btn className={'select-journal-select-modal__buttons-cancel'} onClick={this.onCancelSelect}>
            {t(Labels.CANCEL_BUTTON)}
          </Btn>
          <Btn className={'ecos-btn_blue select-journal-select-modal__buttons-ok'} onClick={this.onSelectFromJournalPopup}>
            {t(Labels.SAVE_BUTTON)}
          </Btn>
        </div>
      </EcosModal>
    );
  }

  render() {
    const {
      multiple,
      isCompact,
      viewOnly,
      presetFilterPredicates,
      placeholder,
      disabled,
      hideEditRowButton,
      hideDeleteRowButton,
      inputViewClass,
      autoFocus,
      onBlur,
      renderView,
      isSelectedValueAsText,
      isInlineEditingMode,
      viewMode
    } = this.props;
    const { journalConfig, selectedRows, error } = this.state;
    const inputViewProps = {
      disabled,
      isCompact,
      multiple,
      placeholder,
      error,
      selectedRows,
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
      viewMode,
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
      }
    };
    const defaultView = viewOnly ? <ViewMode {...inputViewProps} /> : <InputView {...inputViewProps} />;
    const wrapperClasses = classNames('select-journal', {
      'select-journal_compact': isCompact,
      'select-journal_view-only': viewOnly
    });

    return (
      <div className={wrapperClasses}>
        {typeof renderView === 'function' ? renderView(inputViewProps) : defaultView}

        <FiltersProvider columns={journalConfig.columns} sourceId={journalConfig.sourceId} presetFilterPredicates={presetFilterPredicates}>
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
  customSourceId: PropTypes.string,
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  onChange: PropTypes.func,
  onError: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  isFullScreenWidthModal: PropTypes.bool,
  hideCreateButton: PropTypes.bool,
  hideEditRowButton: PropTypes.bool,
  hideDeleteRowButton: PropTypes.bool,
  displayColumns: PropTypes.array,
  presetFilterPredicates: PropTypes.arrayOf(predicateShape),
  initCustomPredicate: PropTypes.oneOfType([PropTypes.arrayOf(predicateShape), predicateShape]),
  disableResetOnApplyCustomPredicate: PropTypes.bool,
  viewOnly: PropTypes.bool,
  renderView: PropTypes.func,
  searchField: PropTypes.string,
  viewMode: PropTypes.string,
  isSelectModalOpen: PropTypes.bool,
  isSelectedValueAsText: PropTypes.bool,
  sortBy: PropTypes.shape({
    attribute: PropTypes.string,
    ascending: PropTypes.bool
  }),
  columns: PropTypes.array
};

SelectJournal.defaultProps = {
  isSelectModalOpen: false,
  presetFilterPredicates: []
};
