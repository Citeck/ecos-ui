import React, { Component, Fragment } from 'react';
import lodash from 'lodash';
import connect from 'react-redux/es/connect/connect';
import Loader from '../../common/Loader/Loader';
import JournalsDownloadZip from '../JournalsDownloadZip';
import EcosModal from '../../common/EcosModal/EcosModal';
import { EmptyGrid, Grid, InlineTools, Tools } from '../../common/grid';
import FormManager from '../../EcosForm/FormManager';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { getDownloadContentUrl, goToCardDetailsPage, goToNodeEditPage } from '../../../helpers/urls';
import { t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import classNames from 'classnames';
import {
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
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(w(visible))),
    setGridInlineToolSettings: settings => dispatch(setGridInlineToolSettings(w(settings))),
    goToJournalsPage: row => dispatch(goToJournalsPage(w(row))),
    performGroupAction: options => dispatch(performGroupAction(w(options))),
    setPerformGroupActionResponse: options => dispatch(setPerformGroupActionResponse(w(options)))
  };
};

class DownloadContentLink extends Component {
  render() {
    const { children, row } = this.props;

    if (!row.hasContent) {
      return null;
    }

    return <a href={getDownloadContentUrl(row.id)}>{children}</a>;
  }
}

class JournalsDashletGrid extends Component {
  filters = [];
  selectedRow = {};

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
    const props = this.props;
    const { columns } = props.journalConfig;

    this.filters = predicates;

    this.reloadGrid({ columns, predicates });
  };

  reloadGrid(options) {
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
    this.props.setGridInlineToolSettings(options);
  };

  hideGridInlineToolSettings = () => {
    this.clearSelectedRow();
    this.props.setGridInlineToolSettings({ height: 0, top: 0, row: {} });
  };

  goToJournalPageWithFilter = () => {
    const selectedRow = this.getSelectedRow();
    this.props.goToJournalsPage(selectedRow);
  };

  goToCardDetailsPage = () => {
    const selectedRow = this.getSelectedRow();
    goToCardDetailsPage(selectedRow.id);
  };

  goToNodeEditPage = () => {
    const selectedRow = this.getSelectedRow();
    goToNodeEditPage(selectedRow.id);
  };

  inlineTools = () => {
    const {
      stateId,
      selectedRecords,
      grid: { groupBy = [] }
    } = this.props;
    const inlineToolsActionClassName = 'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_x-step_10';
    const tools = [
      <IcoBtn
        title={t('grid.inline-tools.show')}
        icon={'icon-on'}
        onClick={this.goToCardDetailsPage}
        className={classNames(inlineToolsActionClassName, 'ecos-btn_hover_t-dark-brown')}
      />,
      <DownloadContentLink>
        <IcoBtn
          title={t('grid.inline-tools.download')}
          icon={'icon-download'}
          className={classNames(inlineToolsActionClassName, 'ecos-btn_hover_t-dark-brown')}
        />
      </DownloadContentLink>,
      <IcoBtn
        title={t('grid.inline-tools.edit')}
        icon={'icon-edit'}
        onClick={this.goToNodeEditPage}
        className={classNames(inlineToolsActionClassName, 'ecos-btn_hover_t-dark-brown')}
      />,
      <IcoBtn
        title={t('grid.inline-tools.delete')}
        icon={'icon-delete'}
        onClick={this.deleteRecord}
        className={classNames(inlineToolsActionClassName, 'ecos-btn_hover_t_red')}
      />
    ];

    if (selectedRecords.length) {
      return null;
    }

    if (groupBy.length) {
      tools.push(
        <IcoBtn
          title={t('grid.inline-tools.details')}
          onClick={this.goToJournalPageWithFilter}
          icon={'icon-big-arrow'}
          className={inlineToolsActionClassName}
        />
      );
    }

    return <InlineTools tools={tools} stateId={stateId} />;
  };

  deleteRecord = () => {
    const selectedRow = this.getSelectedRow();
    this.props.deleteRecords([selectedRow.id]);
    this.clearSelectedRow();
    this.hideGridInlineToolSettings();
  };

  deleteRecords = () => {
    const { selectedRecords, deleteRecords } = this.props;
    deleteRecords(selectedRecords);
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
            onClick={this.deleteRecords}
          />,
          <Dropdown
            className={'grid-tools__item_left_5'}
            source={groupActions}
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
        pagination: { maxItems }
      },
      doInlineToolsOnRowClick = false,
      performGroupActionResponse
    } = this.props;

    return (
      <Fragment>
        <div className={'ecos-journal-dashlet__grid'}>
          <EmptyGrid maxItems={maxItems}>
            {loading ? (
              <Loader />
            ) : (
              <Grid
                data={data}
                columns={columns}
                className={className}
                freezeCheckboxes
                filterable
                editable
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
              />
            )}
          </EmptyGrid>
        </div>

        <EcosModal
          title={t('group-action.label.header')}
          isOpen={Boolean(performGroupActionResponse.length)}
          hideModal={this.closePerformGroupActionDialog}
          className={'journal__dialog'}
        >
          <EmptyGrid maxItems={performGroupActionResponse.length}>
            <Grid
              keyField={'nodeRef'}
              data={performGroupActionResponse}
              columns={[
                {
                  dataField: 'title',
                  text: 'Запись'
                },
                {
                  dataField: 'status',
                  text: 'Статус'
                },
                {
                  dataField: 'message',
                  text: 'Описание'
                }
              ]}
              className={className}
            />
          </EmptyGrid>
        </EcosModal>
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
