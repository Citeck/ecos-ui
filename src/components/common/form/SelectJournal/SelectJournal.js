import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import lodashGet from 'lodash/get';

import { t } from '../../../../helpers/util';
import { JournalsApi } from '../../../../api/journalsApi';
import { EcosModal, Loader, Pagination } from '../../../common';
import { Btn, IcoBtn } from '../../../common/btns';
import { Grid } from '../../../common/grid';
import { matchCardDetailsLinkFormatterColumn } from '../../../common/grid/mapping/Mapper';
import EcosForm, { FORM_MODE_EDIT } from '../../../EcosForm';
import Records from '../../../Records';
import InputView from './InputView';
import ViewMode from './ViewMode';
import Filters from './Filters';
import Search from './Search';
import CreateVariants from './CreateVariants';
import FiltersProvider from './Filters/FiltersProvider';

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
      meta: []
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
    if (state.value === undefined) {
      return {
        value: props.multiple ? [] : ''
      };
    }

    return null;
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

  setCustomPredicate(customPredicate) {
    if (!isEqual(this.state.customPredicate, customPredicate)) {
      let state = { customPredicate };
      // if (this.state.wasChangedFromPopup) {
      state.isGridDataReady = false;
      // }
      this.setState(state, () => {
        this.shouldResetValue().then(shouldReset => {
          shouldReset && this.setValue(null);
        });
      });
    }
  }

  shouldResetValue = () => {
    return new Promise(resolve => {
      const selectedRows = this.state.selectedRows;
      if (selectedRows.length < 1) {
        return resolve(false);
      }

      const dbIDs = {};
      const dbIDsPromises = selectedRows.map(item => {
        return Records.get(item.id)
          .load('sys:node-dbid')
          .then(dbID => {
            dbIDs[item.id] = dbID;
          });
      });

      Promise.all(dbIDsPromises).then(() => {
        let requestParams = this.state.requestParams;
        let customPredicate = this.state.customPredicate;
        if (customPredicate) {
          let selectedRowsPredicate = selectedRows.map(item => {
            return { t: 'eq', att: 'sys:node-dbid', val: dbIDs[item.id] };
          });

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

        let sourceId = lodashGet(this.state, 'journalConfig.sourceId', '');
        if (sourceId) {
          requestParams['sourceId'] = sourceId;
        }

        return this.api.getGridDataUsePredicates(requestParams).then(gridData => {
          if (gridData.total && gridData.total === selectedRows.length) {
            return resolve(false);
          }

          resolve(true);
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
        // console.log('journalConfig', journalConfig);
        let columns = journalConfig.columns.map(item => {
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

  refreshGridData = () => {
    return new Promise(resolve => {
      this.setState(
        {
          isGridDataReady: false
        },
        () => {
          let requestParams = this.state.requestParams;
          if (this.state.customPredicate) {
            if (requestParams.journalPredicate) {
              requestParams = {
                ...requestParams,
                journalPredicate: {
                  t: 'and',
                  val: [requestParams.journalPredicate, this.state.customPredicate]
                }
              };
            } else {
              requestParams = {
                ...requestParams,
                journalPredicate: this.state.customPredicate
              };
            }
          }

          let sourceId = lodashGet(this.state, 'journalConfig.sourceId', '');
          if (sourceId) {
            requestParams['sourceId'] = sourceId;
          }

          return this.api.getGridDataUsePredicates(requestParams).then(fetchedGridData => {
            const gridData = this.mergeFetchedDataWithInMemoryData(fetchedGridData);

            this.setState(prevState => {
              return {
                gridData: {
                  ...prevState.gridData,
                  ...gridData
                },
                isGridDataReady: true
              };
            });

            resolve(gridData);
          });
        }
      );
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
      const exists = fetchedGridData.data.find(item => item.id === inMemoryData[i].id);
      // если запись успела проиндексироваться, удаляем её из inMemoryData, иначе добаляем в fetchedGridData.data временную запись
      if (exists) {
        newInMemoryData = newInMemoryData.filter(item => item.id !== inMemoryData[i].id);
      } else if (fetchedGridData.data.length < pagination.maxItems) {
        fetchedGridData.data.push(inMemoryData[i]);
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

    this.setState(state => {
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
    }, this.refreshGridData);
  };

  onEditFormSubmit = form => {
    this.setState({
      isEditModalOpen: false
    });

    this.setValue(this.state.gridData.selected);

    this.refreshGridData();
  };

  onValueEdit = e => {
    const editRecordId = e.target.dataset.id;
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

  onValueDelete = e => {
    const newValue = this.state.selectedRows.filter(item => item.id !== e.target.dataset.id);

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

  render() {
    const {
      multiple,
      placeholder,
      disabled,
      isCompact,
      viewOnly,
      hideCreateButton,
      hideEditRowButton,
      hideDeleteRowButton,
      searchField,
      inputViewClass,
      autoFocus,
      onBlur,
      renderView,
      isFullScreenWidthModal,
      presetFilterPredicates,
      isSelectedValueAsText,
      isInlineEditingMode
    } = this.props;
    const {
      isGridDataReady,
      selectedRows,
      isSelectModalOpen,
      isEditModalOpen,
      isCreateModalOpen,
      isCollapsePanelOpen,
      gridData,
      editRecordId,
      editRecordName,
      requestParams,
      journalConfig,
      error
    } = this.state;

    const wrapperClasses = classNames('select-journal', {
      'select-journal_compact': isCompact,
      'select-journal_view-only': viewOnly
    });

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
      isInlineEditingMode
    };

    let selectModalTitle = t('select-journal.select-modal.title');
    let editModalTitle = t('select-journal.edit-modal.title');
    if (journalConfig.meta.title) {
      selectModalTitle += `: ${journalConfig.meta.title}`;
    }

    if (editRecordName) {
      editModalTitle += `: ${editRecordName}`;
    }

    const defaultView = viewOnly ? <ViewMode {...inputViewProps} /> : <InputView {...inputViewProps} />;
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
          isBigHeader={true}
          title={editModalTitle}
          isOpen={isEditModalOpen}
          hideModal={this.toggleEditModal}
          options={{
            formMode: FORM_MODE_EDIT
          }}
        >
          <EcosForm record={editRecordId} onSubmit={this.onEditFormSubmit} onFormCancel={this.toggleEditModal} />
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
  isSelectModalOpen: PropTypes.bool,
  isSelectedValueAsText: PropTypes.bool
};

SelectJournal.defaultProps = {
  isSelectModalOpen: false
};
