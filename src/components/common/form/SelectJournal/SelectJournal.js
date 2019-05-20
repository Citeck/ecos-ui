import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import classNames from 'classnames';
import { IcoBtn, Btn } from '../../../common/btns';
import Grid from '../../../common/grid/Grid/Grid';
import Pagination from '../../../common/Pagination/Pagination';
import Loader from '../../../common/Loader/Loader';
import EcosForm from '../../../EcosForm';
import EcosModal from '../../EcosModal';
import InputView from './InputView';
import ViewMode from './ViewMode';
import Filters from './Filters';
import Search from './Search';
import CreateVariants from './CreateVariants';
import FiltersProvider from './Filters/FiltersProvider';
import { JournalsApi } from '../../../../api/journalsApi';
import { t } from '../../../../helpers/util';
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
    isJournalConfigFetched: false,
    journalConfig: {
      meta: []
    },
    isGridDataReady: false,
    gridData: {
      total: 0,
      data: [],
      columns: [],
      selected: []
    },
    requestParams: {
      pagination: paginationInitState,
      predicates: []
    },
    selectedRows: [],
    error: null
  };

  static getDerivedStateFromProps(props, state) {
    if (state.value === undefined) {
      return {
        value: props.multiple ? [] : null
      };
    }

    return null;
  }

  constructor() {
    super();
    this.api = new JournalsApi();
  }

  componentDidMount() {
    const { defaultValue, multiple, journalId, onError } = this.props;

    if (!journalId) {
      const err = new Error('The "journalId" config is required!');
      typeof onError === 'function' && onError(err);
      this.setState({ error: err });
    }

    let initValue;
    if (multiple && Array.isArray(defaultValue) && defaultValue.length > 0) {
      initValue = defaultValue.map(item => ({ id: item }));
    } else if (!multiple && !!defaultValue) {
      initValue = [{ id: defaultValue }];
    }

    if (initValue) {
      this.fetchDisplayNames(initValue).then(value => {
        this.setValue(value, false);
      });
    }
  }

  getJournalConfig = () => {
    const { journalId, displayColumns } = this.props;

    return new Promise((resolve, reject) => {
      if (!journalId) {
        reject();
      }

      this.api.getJournalConfig(journalId).then(journalConfig => {
        // console.log('journalConfig', journalConfig);
        let columns = journalConfig.columns;
        const predicate = journalConfig.meta.predicate;

        if (Array.isArray(displayColumns) && displayColumns.length > 0) {
          columns = columns.map(item => {
            return {
              ...item,
              default: displayColumns.indexOf(item.attribute) !== -1
            };
          });
        }

        this.setState(prevState => {
          return {
            requestParams: {
              ...prevState.requestParams,
              columns,
              journalConfigPredicate: predicate,
              predicates: []
            },
            journalConfig,
            isJournalConfigFetched: true
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
          return this.api.getGridDataUsePredicates(this.state.requestParams).then(gridData => {
            // console.log('gridData', gridData);

            // setTimeout(() => {
            this.setState(prevState => {
              return {
                gridData: {
                  ...prevState.gridData,
                  ...gridData
                },
                isGridDataReady: true
              };
            });
            // }, 3000);

            resolve(gridData);
          });
        }
      );
    });
  };

  toggleSelectModal = () => {
    this.setState({
      isSelectModalOpen: !this.state.isSelectModalOpen
    });
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

  onSelect = () => {
    const selectedRows = this.state.gridData.selected;
    this.fetchDisplayNames(selectedRows).then(value => {
      this.setValue(value).then(() => {
        this.setState({
          isSelectModalOpen: false
        });
      });
    });
  };

  fetchDisplayNames = selectedRows => {
    return this.api.getRecordsDisplayName(selectedRows).then(result =>
      result.records.map(item => {
        return {
          id: item.id,
          disp: item.attributes.name
        };
      })
    );
  };

  setValue = (selected, shouldTriggerOnChange = true) => {
    const { onChange, multiple } = this.props;

    let newValue;
    if (multiple) {
      newValue = selected.map(item => item.id);
    } else {
      newValue = selected.length > 0 ? selected[0]['id'] : null;
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
            onChange(newValue);
          }
          resolve();
        }
      );
    });
  };

  onCancelSelect = () => {
    const { multiple } = this.props;

    this.setState(prevState => {
      return {
        gridData: {
          ...prevState.gridData,
          selected: multiple ? prevState.value : [prevState.value]
        },
        isSelectModalOpen: false
      };
    });
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

  onCreateFormSubmit = form => {
    this.setState({
      isCreateModalOpen: false
    });

    this.refreshGridData();
  };

  onEditFormSubmit = form => {
    this.setState({
      isEditModalOpen: false
    });

    const selectedRows = this.state.gridData.selected;
    this.fetchDisplayNames(selectedRows).then(value => {
      this.setValue(value);
    });

    this.refreshGridData();
  };

  onValueEdit = e => {
    this.setState({
      isEditModalOpen: true,
      editRecordId: e.target.dataset.id
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
          predicates: predicates
        },
        isJournalConfigFetched: true
      };
    }, this.refreshGridData);
  };

  render() {
    const { multiple, placeholder, disabled, isCompact, viewOnly, hideCreateButton } = this.props;
    const {
      isGridDataReady,
      selectedRows,
      isSelectModalOpen,
      isEditModalOpen,
      isCreateModalOpen,
      isCollapsePanelOpen,
      gridData,
      editRecordId,
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
      openSelectModal: this.openSelectModal
    };

    return (
      <div className={wrapperClasses}>
        {viewOnly ? <ViewMode {...inputViewProps} /> : <InputView {...inputViewProps} />}

        <FiltersProvider columns={journalConfig.columns} sourceId={journalConfig.sourceId} api={this.api}>
          <EcosModal
            title={t('select-journal.select-modal.title')}
            isOpen={isSelectModalOpen}
            hideModal={this.toggleSelectModal}
            className={'select-journal-select-modal'}
          >
            <div className={'select-journal-collapse-panel'}>
              <div className={'select-journal-collapse-panel__controls'}>
                <div className={'select-journal-collapse-panel__controls-left'}>
                  <IcoBtn
                    invert={'true'}
                    icon={isCollapsePanelOpen ? 'icon-up' : 'icon-down'}
                    className="ecos-btn_drop-down ecos-btn_r_8 ecos-btn_blue ecos-btn_x-step_10"
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
                  <Search onApply={this.onApplyFilters} />
                </div>
              </div>

              <Collapse isOpen={isCollapsePanelOpen}>
                {journalConfig.columns ? <Filters columns={journalConfig.columns} onApply={this.onApplyFilters} /> : null}
              </Collapse>
            </div>

            <div className={'select-journal__grid'}>
              {!isGridDataReady ? <Loader /> : null}
              <Grid
                {...gridData}
                singleSelectable={!multiple}
                multiSelectable={multiple}
                onSelect={this.onSelectGridItem}
                selectAllRecords={null}
                selectAllRecordsVisible={null}
                className={!isGridDataReady ? 'grid_transparent' : ''}
              />

              <Pagination
                className={'select-journal__pagination'}
                total={gridData.total}
                {...requestParams.pagination}
                onChange={this.onChangePage}
              />
            </div>

            <div className="select-journal-select-modal__buttons">
              <Btn onClick={this.onCancelSelect}>{t('select-journal.select-modal.cancel-button')}</Btn>
              <Btn className={'ecos-btn_blue'} onClick={this.onSelect}>
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
          title={t('select-journal.edit-modal.title')}
          isOpen={isEditModalOpen}
          hideModal={this.toggleEditModal}
        >
          <EcosForm record={editRecordId} onSubmit={this.onEditFormSubmit} onFormCancel={this.toggleEditModal} />
        </EcosModal>
      </div>
    );
  }
}

SelectJournal.propTypes = {
  journalId: PropTypes.string,
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  onChange: PropTypes.func,
  onError: PropTypes.func,
  multiple: PropTypes.bool,
  isCompact: PropTypes.bool,
  hideCreateButton: PropTypes.bool,
  displayColumns: PropTypes.array,
  viewOnly: PropTypes.bool
};
