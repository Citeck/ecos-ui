import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import lodash from 'lodash';
import connect from 'react-redux/es/connect/connect';
import Loader from '../../common/Loader/Loader';
import JournalsDownloadZip from '../JournalsDownloadZip';
import EcosModal from '../../common/EcosModal/EcosModal';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import FormManager from '../../EcosForm/FormManager';
import { EmptyGrid, Grid, InlineTools, Tools } from '../../common/grid';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { RemoveDialog } from '../../common/dialogs';
import { goToNodeEditPage } from '../../../helpers/urls';
import { t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { DEFAULT_INLINE_TOOL_SETTINGS } from '../constants';
import { PROXY_URI } from '../../../constants/alfresco';
import RecordActions from '../../Records/actions';
import {
  execRecordsAction,
  deleteRecords,
  goToJournalsPage,
  performGroupAction,
  reloadGrid,
  saveRecords,
  setGridInlineToolSettings,
  setPerformGroupActionResponse,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords
} from '../../../actions/journals';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    loading: newState.loading,
    grid: newState.grid,
    journalConfig: newState.journalConfig,
    selectedRecords: newState.selectedRecords,
    selectAllRecords: newState.selectAllRecords,
    selectAllRecordsVisible: newState.selectAllRecordsVisible,
    performGroupActionResponse: newState.performGroupActionResponse
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    deleteRecords: records => dispatch(deleteRecords(w(records))),
    saveRecords: ({ id, attributes }) => dispatch(saveRecords(w({ id, attributes }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(w(visible))),
    setGridInlineToolSettings: settings => dispatch(setGridInlineToolSettings(w(settings))),
    goToJournalsPage: row => dispatch(goToJournalsPage(w(row))),
    performGroupAction: options => dispatch(performGroupAction(w(options))),
    setPerformGroupActionResponse: options => dispatch(setPerformGroupActionResponse(w(options)))
  };
};

class JournalsDashletGrid extends Component {
  filters = [];
  selectedRow = {};

  state = {
    isDialogShow: false
  };

  setSelectedRecords = e => {
    const props = this.props;
    props.setSelectedRecords(e.selected);
    props.setSelectAllRecordsVisible(e.all);

    if (!e.all) {
      props.setSelectAllRecords(false);
    }
  };

  setSelectAllRecords = () => {
    const props = this.props;
    props.setSelectAllRecords(!props.selectAllRecords);

    if (!props.selectAllRecords) {
      props.setSelectedRecords([]);
    }
  };

  onFilter = predicates => {
    this.filters = predicates;

    this.reloadGrid({ predicates });
  };

  reloadGrid(options) {
    options = options || {};
    this.hideGridInlineToolSettings();
    this.props.reloadGrid({ ...options });
  }

  sort = e => {
    this.reloadGrid({
      sortBy: [
        {
          attribute: e.column.attribute,
          ascending: !e.ascending
        }
      ]
    });
  };

  setSelectedRow(row) {
    this.selectedRow = row;
  }

  getSelectedRow() {
    return this.selectedRow;
  }

  clearSelectedRow() {
    this.selectedRow = {};
  }

  showGridInlineToolSettings = options => {
    this.setSelectedRow(options.row);
    this.getCurrentRowInlineActions().then(actions => {
      this.props.setGridInlineToolSettings(
        Object.assign(
          {
            actions: actions
          },
          options
        )
      );
    });
  };

  getCurrentRowInlineActions() {
    const {
      journalConfig = {},
      execRecordsAction,
      selectedRecords,
      grid: { groupBy = [] }
    } = this.props;
    let currentRow = this.getSelectedRow().id;

    if (selectedRecords.length) {
      return Promise.resolve([]);
    }

    if (groupBy.length) {
      return Promise.resolve([
        {
          title: t('grid.inline-tools.details'),
          onClick: () => this.goToJournalPageWithFilter(),
          icon: 'icon-big-arrow'
        }
      ]);
    }

    const context = {
      mode: 'journal',
      scope: journalConfig.id,
      journalConfig
    };

    return RecordActions.getActions(currentRow, context)
      .then(actions => {
        return actions.map(action => {
          return Object.assign({}, action, {
            onClick: () => execRecordsAction([currentRow], action, context)
          });
        });
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  }

  hideGridInlineToolSettings = () => {
    this.clearSelectedRow();
    this.props.setGridInlineToolSettings(DEFAULT_INLINE_TOOL_SETTINGS);
  };

  goToJournalPageWithFilter = () => {
    const selectedRow = this.getSelectedRow();
    this.props.goToJournalsPage(selectedRow);
  };

  edit = () => {
    const selectedRow = this.getSelectedRow();
    const recordRef = selectedRow.id;

    EcosFormUtils.editRecord({
      recordRef: recordRef,
      fallback: () => goToNodeEditPage(recordRef),
      onSubmit: () => this.reloadGrid()
    });
  };

  inlineTools = () => {
    const { stateId } = this.props;
    return <InlineTools stateId={stateId} />;
  };

  deleteRecords = () => {
    const { selectedRecords, deleteRecords } = this.props;
    deleteRecords(selectedRecords);
    this.closeDialog();
  };

  tools = selected => {
    const toolsActionClassName = 'ecos-btn_i_sm ecos-btn_grey4';
    const {
      stateId,
      selectAllRecordsVisible,
      selectAllRecords,
      grid: { total },
      journalConfig: {
        meta: { groupActions = [] }
      },
      toolsClassName
    } = this.props;

    return (
      <Tools
        onSelectAll={this.setSelectAllRecords}
        selectAllVisible={selectAllRecordsVisible}
        selectAll={selectAllRecords}
        total={total}
        className={toolsClassName}
        tools={[
          <JournalsDownloadZip stateId={stateId} selected={selected} />,
          <IcoBtn
            icon={'icon-copy'}
            className={classNames(toolsActionClassName, 'ecos-btn_hover_t-dark-brown')}
            title={t('grid.tools.copy-to')}
          />,
          <IcoBtn
            icon={'icon-big-arrow'}
            className={classNames(toolsActionClassName, 'ecos-btn_hover_t-dark-brown')}
            title={t('grid.tools.move-to')}
          />,
          <IcoBtn
            icon={'icon-delete'}
            className={classNames(toolsActionClassName, 'ecos-btn_hover_t_red')}
            title={t('grid.tools.delete')}
            onClick={this.showDeleteRecordsDialog}
          />,
          <Dropdown
            className={'grid-tools__item_left_5'}
            source={groupActions.filter(g => {
              if (selectAllRecords) {
                return g.type === 'filtered';
              }

              return g.type === 'selected';
            })}
            valueField={'id'}
            titleField={'title'}
            isButton={true}
            onChange={this.changeGroupAction}
          >
            <IcoBtn
              invert
              icon={'icon-down'}
              className={'dashlet__btn ecos-btn_extra-narrow grid-tools__item_select-group-actions-btn'}
              onClick={this.onGoTo}
            >
              {t('grid.tools.group-actions')}
            </IcoBtn>
          </Dropdown>
        ]}
      />
    );
  };

  onRowClick = row => {
    trigger.call(this, 'onRowClick', row);
  };

  closePerformGroupActionDialog = () => {
    this.props.setPerformGroupActionResponse([]);
  };

  changeGroupAction = groupAction => {
    const { selectedRecords, performGroupAction } = this.props;

    if (groupAction.formKey) {
      FormManager.openFormModal({
        record: '@',
        formKey: groupAction.formKey,
        saveOnSubmit: false,
        onSubmit: rec => {
          let action = lodash.cloneDeep(groupAction);
          action.params = action.params || {};
          action.params.attributes = rec.getAttributesToPersist();
          performGroupAction({ groupAction: action, selected: selectedRecords });
        }
      });
    } else {
      performGroupAction({ groupAction, selected: selectedRecords });
    }
  };

  delete = () => {};

  closeDialog = () => {
    this.setState({ isDialogShow: false });
  };

  showDeleteRecordsDialog = () => {
    this.setState({ isDialogShow: true });
    this.delete = this.deleteRecords;
  };

  renderPerformGroupActionResponse = performGroupActionResponse => {
    const { className } = this.props;
    const performGroupActionResponseUrl = (performGroupActionResponse[0] || {}).url;

    return (
      <EmptyGrid maxItems={performGroupActionResponse.length}>
        {performGroupActionResponseUrl ? (
          <Grid
            keyField={'link'}
            data={[
              {
                status: t('group-action.label.report'),
                link: performGroupActionResponseUrl
              }
            ]}
            columns={[
              {
                dataField: 'status',
                text: t('group-action.label.status')
              },
              {
                dataField: 'link',
                text: t('actions.document.download'),
                formatExtraData: {
                  formatter: ({ cell }) => {
                    const html = `<a href="${PROXY_URI + cell}" onclick="event.stopPropagation()">${t('actions.document.download')}</a>`;
                    return <span dangerouslySetInnerHTML={{ __html: html }} />;
                  }
                }
              }
            ]}
            className={className}
          />
        ) : (
          <Grid
            keyField={'nodeRef'}
            data={performGroupActionResponse}
            columns={[
              {
                dataField: 'title',
                text: t('group-action.label.record')
              },
              {
                dataField: 'status',
                text: t('group-action.label.status')
              },
              {
                dataField: 'message',
                text: t('group-action.label.message')
              }
            ]}
            className={className}
          />
        )}
      </EmptyGrid>
    );
  };

  render() {
    const {
      selectedRecords,
      selectAllRecords,
      saveRecords,
      className,
      loading,
      grid: {
        data,
        columns,
        sortBy,
        pagination: { maxItems },
        groupBy
      },
      doInlineToolsOnRowClick = false,
      performGroupActionResponse,
      doNotCount,
      minHeight
    } = this.props;

    const editable = !(groupBy && groupBy.length);

    const HeightCalculation = ({ doNotCount, children, maxItems, minHeight }) =>
      doNotCount ? <div style={{ height: minHeight }}>{children}</div> : <EmptyGrid maxItems={maxItems}>{children}</EmptyGrid>;

    return (
      <Fragment>
        <div className={'ecos-journal-dashlet__grid'}>
          <HeightCalculation maxItems={maxItems} doNotCount={doNotCount} minHeight={minHeight}>
            {loading ? (
              <Loader />
            ) : (
              <Grid
                data={data}
                columns={columns}
                className={className}
                freezeCheckboxes
                filterable
                editable={editable}
                multiSelectable
                sortBy={sortBy}
                changeTrOptionsByRowClick={doInlineToolsOnRowClick}
                filters={this.filters}
                inlineTools={this.inlineTools}
                tools={this.tools}
                onSort={this.sort}
                onFilter={this.onFilter}
                onSelect={this.setSelectedRecords}
                onRowClick={doInlineToolsOnRowClick && this.onRowClick}
                onMouseLeave={!doInlineToolsOnRowClick && this.hideGridInlineToolSettings}
                onChangeTrOptions={this.showGridInlineToolSettings}
                onScrolling={this.hideGridInlineToolSettings}
                onEdit={saveRecords}
                selected={selectedRecords}
                selectAll={selectAllRecords}
                minHeight={minHeight}
              />
            )}
          </HeightCalculation>
        </div>

        <EcosModal
          title={t('group-action.label.header')}
          isOpen={Boolean(performGroupActionResponse.length)}
          hideModal={this.closePerformGroupActionDialog}
          className={'journal__dialog'}
        >
          {this.renderPerformGroupActionResponse(performGroupActionResponse)}
        </EcosModal>

        <RemoveDialog
          isOpen={this.state.isDialogShow}
          title={t('journals.action.delete-records-msg')}
          text={t('journals.action.remove-records-msg')}
          onDelete={this.delete}
          onCancel={this.closeDialog}
          onClose={this.closeDialog}
        />
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
