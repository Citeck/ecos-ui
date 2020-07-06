import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import lodashGet from 'lodash/get';

import { Attributes } from '../../../../constants';
import { t } from '../../../../helpers/util';
import { JournalsApi } from '../../../../api/journalsApi';
import { EcosModal, Loader, Pagination } from '../../../common';
import { Btn, IcoBtn } from '../../../common/btns';
import { Grid } from '../../../common/grid';
import { matchCardDetailsLinkFormatterColumn } from '../../../common/grid/mapping/Mapper';
import EcosForm, { FORM_MODE_EDIT } from '../../../EcosForm';
import Records from '../../../Records';
import { parseAttribute } from '../../../Records/Record';
import InputView from './InputView';
import ViewMode from './ViewMode';
import Filters from './Filters';
import Search from './Search';
import CreateVariants from './CreateVariants';
import FiltersProvider from './Filters/FiltersProvider';
import { DisplayModes } from '../../../../forms/components/custom/selectJournal/constants';

import './SelectJournal.scss';

const paginationInitState = {
  skipCount: 0,
  maxItems: 10,
  page: 1
};

export default class SelectJournal extends Component {
  state = {
    isCollapsePanelOpen: false,
    isSelectModalOpen: false,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    editRecordId: null,
    editRecordName: null,
    isJournalConfigFetched: false,
    journalConfig: {
      meta: {}
    },
    isGridDataReady: false,
    gridData: {
      total: 0,
      data: [],
      inMemoryData: [],
      columns: [],
      selected: []
    },
    requestParams: {
      pagination: paginationInitState,
      predicates: []
    },
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

  constructor(props) {
    super(props);
    this.api = new JournalsApi();
  }

  componentDidMount() {
    const { defaultValue, multiple, journalId, onError, isSelectModalOpen, initCustomPredicate } = this.props;

    if (!journalId) {
      const err = new Error('The "journalId" config is required!');
      typeof onError === 'function' && onError(err);
      this.setState({ error: err });
    }

    let initValue;
    if (multiple && Array.isArray(defaultValue) && defaultValue.length > 0) {
      initValue = [...defaultValue];
    } else if (!multiple && !!defaultValue) {
      initValue = [defaultValue];
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
  }

  updateSelectedValue(value = this.props.defaultValue, shouldTriggerOnChange = false) {
    const { multiple } = this.props;
    let newValue;

    if (multiple && Array.isArray(value) && value.length > 0) {
      newValue = [...value];
    } else if (!multiple && !!value) {
      newValue = [value];
    }

    this.setValue(newValue, shouldTriggerOnChange);
  }

  setCustomPredicate(customPredicate) {
    if (!isEqual(this.state.customPredicate, customPredicate)) {
      let state = { customPredicate };
      // if (this.state.wasChangedFromPopup) {
      state.isGridDataReady = false;
      // }
      this.setState(state, () => {
        this.shouldResetValue().then(({ shouldReset, matchedRows }) => {
          shouldReset && this.setValue(matchedRows);
        });
      });
    }
  }

  shouldResetValue = () => {
    return new Promise(resolve => {
      const { selectedRows } = this.state;
      const { sortBy } = this.props;

      if (selectedRows.length < 1) {
        return resolve({ shouldReset: false });
      }

      const dbIDs = {};
      const dbIDsPromises = selectedRows.map(item => {
        return Records.get(item.id)
          .load(Attributes.DBID)
          .then(dbID => {
            dbIDs[item.id] = dbID;
          });
      });

      Promise.all(dbIDsPromises).then(() => {
        let { requestParams, customPredicate, journalConfig } = this.state;
        const sourceId = lodashGet(journalConfig, 'sourceId', '');

        if (customPredicate) {
          let selectedRowsPredicate = selectedRows.map(item => ({ t: 'eq', att: Attributes.DBID, val: dbIDs[item.id] }));

          selectedRowsPredicate = {
            t: 'or',
            val: [...selectedRowsPredicate]
          };

          if (requestParams.journalPredicate) {
            requestParams = {
              ...requestParams,
              journalPredicate: {
                t: 'and',
                val: [requestParams.journalPredicate, customPredicate, selectedRowsPredicate]
              }
            };
          } else {
            requestParams = {
              ...requestParams,
              journalPredicate: {
                t: 'and',
                val: [customPredicate, selectedRowsPredicate]
              }
            };
          }
        }

        if (sourceId) {
          requestParams.sourceId = sourceId;
        }

        requestParams.sortBy = sortBy;

        return this.api.getGridDataUsePredicates(requestParams).then(gridData => {
          if (gridData.total && gridData.total === selectedRows.length) {
            return resolve({ shouldReset: false });
          }

          let matchedRows = null;
          if (Array.isArray(gridData.data)) {
            matchedRows = selectedRows.filter(row => gridData.data.findIndex(item => item.id === row.id) !== -1);
          }

          resolve({ shouldReset: true, matchedRows });
        });
      });
    });
  };

  getJournalConfig = () => {
    const { journalId, displayColumns, presetFilterPredicates } = this.props;

    return new Promise((resolve, reject) => {
      if (!journalId) {
        reject();
      }

      this.api.getJournalConfig(journalId).then(journalConfig => {
        journalConfig = journalConfig || { meta: {} };

        let columns = (journalConfig.columns || []).map(item => {
          const column = { ...item };
          if (matchCardDetailsLinkFormatterColumn(item)) {
            column.disableFormatter = true;
          }
          return column;
        });

        if (Array.isArray(displayColumns) && displayColumns.length > 0) {
          columns = columns.map(item => {
            return {
              ...item,
              default: displayColumns.indexOf(item.attribute) !== -1
            };
          });
        }

        const predicate = journalConfig.meta.predicate;

        this.setState(prevState => {
          return {
            requestParams: {
              ...prevState.requestParams,
              columns,
              journalPredicate: predicate,
              predicates: presetFilterPredicates || []
            },
            journalConfig,
            isJournalConfigFetched: true
            // isCollapsePanelOpen: Array.isArray(presetFilterPredicates) && presetFilterPredicates.length > 0
          };
        }, resolve);
      });
    });
  };

  refreshGridData = info => {
    return new Promise(resolve => {
      this.setState({ isGridDataReady: false }, () => {
        const { sortBy, queryData, customSourceId } = this.props;
        let { requestParams, customPredicate, journalConfig } = this.state;
        const sourceId = customSourceId || lodashGet(journalConfig, 'sourceId', '');

        if (customPredicate) {
          if (requestParams.journalPredicate) {
            requestParams = {
              ...requestParams,
              journalPredicate: {
                t: 'and',
                val: [requestParams.journalPredicate, customPredicate]
              }
            };
          } else {
            requestParams = {
              ...requestParams,
              journalPredicate: customPredicate
            };
          }
        }

        if (sourceId) {
          requestParams.sourceId = sourceId;
        }
        if (queryData) {
          requestParams.queryData = queryData;
        }

        requestParams.sortBy = sortBy;

        return this.api
          .getGridDataUsePredicates(requestParams)
          .then(fetchedGridData => {
            const recordId = lodashGet(info, 'record.id');

            if (!recordId) {
              return Promise.resolve(fetchedGridData);
            }

            return new Promise(resolve =>
              Records.get(recordId)
                .load(fetchedGridData.attributes)
                .then(recordData => {
                  recordData.id = recordId;
                  resolve({ ...fetchedGridData, recordData });
                })
            );
          })
          .then(fetchedGridData => {
            const gridData = this.mergeFetchedDataWithInMemoryData(fetchedGridData);

            this.setState(prevState => ({
              gridData: {
                ...prevState.gridData,
                ...gridData
              },
              isGridDataReady: true
            }));

            resolve(gridData);
          });
      });
    });
  };

  mergeFetchedDataWithInMemoryData = fetchedGridData => {
    const { requestParams, gridData } = this.state;
    const { pagination } = requestParams;
    const { inMemoryData } = gridData;

    if (inMemoryData.length < 1) {
      return fetchedGridData;
    }

    let newInMemoryData = [...inMemoryData];

    for (let i = 0; i < inMemoryData.length; i++) {
      const memoryRecord = inMemoryData[i];
      const exists = fetchedGridData.data.find(item => item.id === memoryRecord.id);
      // если запись успела проиндексироваться, удаляем её из inMemoryData, иначе добаляем в fetchedData.data временную запись
      if (exists) {
        newInMemoryData = newInMemoryData.filter(item => item.id !== memoryRecord.id);
      } else if (fetchedGridData.data.length < pagination.maxItems) {
        let record = memoryRecord;

        if (memoryRecord.id === lodashGet(fetchedGridData, 'recordData.id')) {
          newInMemoryData[i] = record = fetchedGridData.recordData;
        }

        fetchedGridData.data.push(record);
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

  toggleCreateModal = () => {
    this.setState({
      isCreateModalOpen: !this.state.isCreateModalOpen
    });
  };

  toggleEditModal = () => {
    this.setState({
      isEditModalOpen: !this.state.isEditModalOpen
    });
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
      const tableColumns = this.getColumns();

      tableColumns.forEach(item => {
        const hasBracket = item.attribute.includes('{');
        const hasQChar = item.attribute.includes('?');
        if (hasBracket || hasQChar) {
          atts.push(item.attribute);
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
              for (let attSchema in result) {
                if (!result.hasOwnProperty(attSchema)) {
                  continue;
                }

                const attData = parseAttribute(attSchema);
                if (!attData) {
                  continue;
                }

                fetchedAtts[attData.name] = result[attSchema];
              }

              return { ...fetchedAtts, ...r };
            });
        })
      );
    });
  };

  fetchDisplayNames = selectedRows => {
    let computedDispName = lodashGet(this.props, 'computed.valueDisplayName', null);
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
    const { isJournalConfigFetched, isGridDataReady } = this.state;

    this.setState({
      isSelectModalOpen: true
    });

    if (!isJournalConfigFetched) {
      this.getJournalConfig().then(this.refreshGridData);
    } else if (!isGridDataReady) {
      this.refreshGridData();
    }
  };

  onCreateFormSubmit = (record, form, alias) => {
    const { multiple } = this.props;

    this.setState(
      state => {
        const prevSelected = state.gridData.selected || [];
        const newSkipCount =
          Math.floor(state.gridData.total / state.requestParams.pagination.maxItems) * state.requestParams.pagination.maxItems;
        const newPageNum = Math.ceil((state.gridData.total + 1) / state.requestParams.pagination.maxItems);

        return {
          isCreateModalOpen: false,
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
          requestParams: {
            ...state.requestParams,
            predicates: [],
            pagination: {
              ...state.requestParams.pagination,
              skipCount: newSkipCount,
              page: newPageNum
            }
          }
        };
      },
      () => this.refreshGridData({ record })
    );
  };

  onEditFormSubmit = form => {
    this.setState({
      isEditModalOpen: false
    });

    this.setValue(this.state.gridData.selected);

    this.refreshGridData();
  };

  onValueEdit = editRecordId => {
    Records.get(editRecordId)
      .load('.disp')
      .then(disp => {
        this.setState({
          isEditModalOpen: true,
          editRecordId: editRecordId,
          editRecordName: disp
        });
      });
  };

  onValueDelete = id => {
    const newValue = this.state.selectedRows.filter(item => item.id !== id);

    this.setValue(newValue);
  };

  onChangePage = pagination => {
    this.setState(prevState => {
      return {
        requestParams: {
          ...prevState.requestParams,
          pagination
        }
      };
    }, this.refreshGridData);
  };

  onApplyFilters = predicates => {
    this.setState(prevState => {
      return {
        requestParams: {
          ...prevState.requestParams,
          predicates: predicates,
          pagination: paginationInitState
        },
        isJournalConfigFetched: true
      };
    }, this.refreshGridData);
  };

  getColumns = () => {
    const { columns } = this.props;
    const baseColumns = lodashGet(this.state, 'gridData.columns', []);

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

  render() {
    const {
      multiple,
      isCompact,
      viewOnly,
      hideCreateButton,
      searchField,
      isFullScreenWidthModal,
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
    const {
      isGridDataReady,
      isSelectModalOpen,
      isEditModalOpen,
      isCreateModalOpen,
      isCollapsePanelOpen,
      gridData,
      editRecordId,
      editRecordName,
      requestParams,
      journalConfig,
      selectedRows,
      error
    } = this.state;
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

    let selectModalTitle = t('select-journal.select-modal.title');
    let editModalTitle = t('select-journal.edit-modal.title');
    if (journalConfig.meta.title) {
      selectModalTitle += `: ${journalConfig.meta.title}`;
    }

    if (editRecordName) {
      editModalTitle += `: ${editRecordName}`;
    }

    const selectModalClasses = classNames('select-journal-select-modal', {
      'ecos-modal_width-lg': !isFullScreenWidthModal,
      'ecos-modal_width-full': isFullScreenWidthModal
    });

    const gridClasses = classNames('select-journal__grid', {
      'select-journal__grid_transparent': !isGridDataReady
    });

    return (
      <div className={wrapperClasses}>
        {typeof renderView === 'function' ? renderView(inputViewProps) : defaultView}

        <FiltersProvider
          columns={journalConfig.columns}
          sourceId={journalConfig.sourceId}
          api={this.api}
          presetFilterPredicates={presetFilterPredicates}
        >
          <EcosModal title={selectModalTitle} isOpen={isSelectModalOpen} hideModal={this.hideSelectModal} className={selectModalClasses}>
            <div className={'select-journal-collapse-panel'}>
              <div className={'select-journal-collapse-panel__controls'}>
                <div className={'select-journal-collapse-panel__controls-left'}>
                  <IcoBtn
                    invert
                    icon={isCollapsePanelOpen ? 'icon-up' : 'icon-down'}
                    className="ecos-btn_drop-down ecos-btn_r_8 ecos-btn_blue ecos-btn_x-step_10 select-journal-collapse-panel__controls-left-btn-filter"
                    onClick={this.toggleCollapsePanel}
                  >
                    {t('select-journal.select-modal.filter-button')}
                  </IcoBtn>

                  {hideCreateButton ? null : (
                    <CreateVariants
                      items={journalConfig.meta.createVariants}
                      toggleCreateModal={this.toggleCreateModal}
                      isCreateModalOpen={isCreateModalOpen}
                      onCreateFormSubmit={this.onCreateFormSubmit}
                    />
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

              <Pagination
                className={'select-journal__pagination'}
                total={gridData.total}
                {...requestParams.pagination}
                onChange={this.onChangePage}
              />
            </div>

            <div className="select-journal-select-modal__buttons">
              <Btn className={'select-journal-select-modal__buttons-cancel'} onClick={this.onCancelSelect}>
                {t('select-journal.select-modal.cancel-button')}
              </Btn>
              <Btn className={'ecos-btn_blue select-journal-select-modal__buttons-ok'} onClick={this.onSelectFromJournalPopup}>
                {t('select-journal.select-modal.ok-button')}
              </Btn>
            </div>
          </EcosModal>
        </FiltersProvider>

        <EcosModal
          reactstrapProps={{
            backdrop: 'static'
          }}
          className="ecos-modal_width-lg"
          isBigHeader
          title={editModalTitle}
          isOpen={isEditModalOpen}
          hideModal={this.toggleEditModal}
        >
          <EcosForm
            record={editRecordId}
            onSubmit={this.onEditFormSubmit}
            onFormCancel={this.toggleEditModal}
            options={{
              formMode: FORM_MODE_EDIT
            }}
          />
        </EcosModal>
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
  isSelectModalOpen: false
};
