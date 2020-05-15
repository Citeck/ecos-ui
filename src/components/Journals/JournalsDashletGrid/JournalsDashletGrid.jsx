import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import connect from 'react-redux/es/connect/connect';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';

import JournalsDownloadZip from '../JournalsDownloadZip';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import FormManager from '../../EcosForm/FormManager';
import { ParserPredicate } from '../../Filters/predicates';
import { EcosModal, Loader } from '../../common';
import { EmptyGrid, Grid, InlineTools, Tools } from '../../common/grid';
import { IcoBtn } from '../../common/btns';
import { Dropdown } from '../../common/form';
import { RemoveDialog } from '../../common/dialogs';
import { goToNodeEditPage } from '../../../helpers/urls';
import { t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { PROXY_URI } from '../../../constants/alfresco';
import {
  deleteRecords,
  execRecordsAction,
  goToJournalsPage,
  performGroupAction,
  reloadGrid,
  saveRecords,
  setColumnsSetup,
  setGridInlineToolSettings,
  setPerformGroupActionResponse,
  setPredicate,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords
} from '../../../actions/journals';
import { DEFAULT_INLINE_TOOL_SETTINGS, DEFAULT_JOURNALS_PAGINATION } from '../constants';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    loading: newState.loading,
    grid: newState.grid,
    isMobile: (state.view || {}).isMobile === true,
    predicate: newState.predicate,
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
    setPerformGroupActionResponse: options => dispatch(setPerformGroupActionResponse(w(options))),
    setPredicate: options => dispatch(setPredicate(w(options))),
    setColumnsSetup: (columns, sortBy) => dispatch(setColumnsSetup(w({ columns, sortBy })))
  };
};

class JournalsDashletGrid extends Component {
  selectedRow = {};
  scrollPosition = {};

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

  reloadGrid(options) {
    options = options || {};
    const {
      predicate,
      grid: { columns, groupBy, sortBy }
    } = this.props;
    const predicates = predicate ? [predicate] : [];
    const currentOptions = { columns, groupBy, sortBy, predicates };

    this.hideGridInlineToolSettings();
    this.props.reloadGrid({ ...currentOptions, ...options });
  }

  onFilter = ([filter]) => {
    const {
      setPredicate,
      grid: { columns, pagination: pager }
    } = this.props;
    const predicate = ParserPredicate.getDefaultPredicates(columns, [filter.att]);
    const newPredicate = ParserPredicate.setPredicateValue(predicate, filter, true);
    const { maxItems } = pager || DEFAULT_JOURNALS_PAGINATION;
    const pagination = { ...DEFAULT_JOURNALS_PAGINATION, maxItems };

    setPredicate(newPredicate);
    this.reloadGrid({ predicates: [newPredicate], pagination });
  };

  onSort = e => {
    const {
      setColumnsSetup,
      grid: { columns }
    } = this.props;
    const sortBy = [
      {
        attribute: e.column.attribute,
        ascending: !e.ascending
      }
    ];
    setColumnsSetup(columns, sortBy);
    this.reloadGrid({ sortBy });
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

    this.props.setGridInlineToolSettings({ actions: this.getCurrentRowInlineActions(), ...options });
  };

  getCurrentRowInlineActions() {
    const {
      execRecordsAction,
      grid: { groupBy = [], actions }
    } = this.props;

    if (groupBy.length) {
      return [
        {
          title: t('grid.inline-tools.details'),
          onClick: () => this.goToJournalPageWithFilter(),
          icon: 'icon-big-arrow'
        }
      ];
    }

    const currentRow = this.getSelectedRow().id;
    const recordActions = get(actions, currentRow, []);

    return recordActions.map(action => ({ ...action, onClick: () => execRecordsAction([currentRow], action) }));
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

  renderTools = selected => {
    const toolsActionClassName = 'ecos-btn_i_sm ecos-btn_grey4';
    const {
      stateId,
      isMobile,
      selectAllRecordsVisible,
      selectAllRecords,
      grid: { total },
      journalConfig: {
        meta: { groupActions = [] }
      },
      toolsClassName
    } = this.props;

    const sourceGroupActions = groupActions.filter(g => (selectAllRecords && g.type === 'filtered') || g.type === 'selected');
    const tools = [
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
      />
    ];

    if (sourceGroupActions && sourceGroupActions.length) {
      tools.push(
        <Dropdown
          className={'grid-tools__item_left_5'}
          source={sourceGroupActions}
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
            {t(isMobile ? 'grid.tools.group-actions-mobile' : 'grid.tools.group-actions')}
          </IcoBtn>
        </Dropdown>
      );
    }
    return (
      <Tools
        onSelectAll={this.setSelectAllRecords}
        selectAllVisible={selectAllRecordsVisible}
        selectAll={selectAllRecords}
        total={total}
        className={toolsClassName}
        tools={tools}
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
          let action = cloneDeep(groupAction);
          action.params = action.params || {};
          action.params.attributes = rec.getAttributesToSave();
          performGroupAction({ groupAction: action, selected: selectedRecords });
        }
      });
    } else {
      performGroupAction({ groupAction, selected: selectedRecords });
    }
  };

  onDelete = () => null;

  closeDialog = () => {
    this.setState({ isDialogShow: false });
  };

  showDeleteRecordsDialog = () => {
    this.setState({ isDialogShow: true });
    this.onDelete = this.deleteRecords;
  };

  renderPerformGroupActionResponse = performGroupActionResponse => {
    const { className } = this.props;
    const performGroupActionResponseUrl = (performGroupActionResponse[0] || {}).url;

    return (
      <EmptyGrid maxItems={performGroupActionResponse.length}>
        {performGroupActionResponseUrl ? (
          <Grid
            className={className}
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
          />
        ) : (
          <Grid
            className={className}
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
          />
        )}
      </EmptyGrid>
    );
  };

  onScrolling = e => {
    this.scrollPosition = e;
    this.hideGridInlineToolSettings();
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
        groupBy,
        total,
        editingRules
      },
      doInlineToolsOnRowClick = false,
      performGroupActionResponse,
      minHeight,
      maxHeight,
      autoHeight,
      predicate,
      journalConfig: { params = {} }
    } = this.props;

    let editable = true;

    if ((groupBy && groupBy.length) || params.disableTableEditing) {
      editable = false;
    }

    const filters = ParserPredicate.getFlatFilters(predicate);

    const HeightCalculation = ({ children }) => {
      if (minHeight !== undefined) {
        return <div style={{ minHeight, maxHeight }}>{children}</div>;
      }

      let rowsNumber = total > maxItems ? maxItems : total;
      if (rowsNumber < 1) {
        rowsNumber = 1;
      }

      return (
        <EmptyGrid maxItems={rowsNumber} minHeight={minHeight} maxHeight={maxHeight}>
          {children}
        </EmptyGrid>
      );
    };

    return (
      <>
        <div className="ecos-journal-dashlet__grid">
          <HeightCalculation maxItems={maxItems} minHeight={minHeight} total={total}>
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
                editingRules={editingRules}
                multiSelectable
                sortBy={sortBy}
                changeTrOptionsByRowClick={doInlineToolsOnRowClick}
                filters={filters}
                inlineTools={this.inlineTools}
                tools={this.renderTools}
                onSort={this.onSort}
                onFilter={this.onFilter}
                onSelect={this.setSelectedRecords}
                onRowClick={doInlineToolsOnRowClick && this.onRowClick}
                onMouseLeave={!doInlineToolsOnRowClick && this.hideGridInlineToolSettings}
                onChangeTrOptions={this.showGridInlineToolSettings}
                onScrolling={this.onScrolling}
                onEdit={saveRecords}
                selected={selectedRecords}
                selectAll={selectAllRecords}
                minHeight={minHeight}
                maxHeight={maxHeight}
                autoHeight={autoHeight}
                scrollPosition={this.scrollPosition}
              />
            )}
          </HeightCalculation>
        </div>

        <EcosModal
          title={t('group-action.label.header')}
          isOpen={Boolean(performGroupActionResponse.length)}
          hideModal={this.closePerformGroupActionDialog}
          className="journal__dialog"
        >
          {this.renderPerformGroupActionResponse(performGroupActionResponse)}
        </EcosModal>

        <RemoveDialog
          isOpen={this.state.isDialogShow}
          title={t('journals.action.delete-records-msg')}
          text={t('journals.action.remove-records-msg')}
          onDelete={this.onDelete}
          onCancel={this.closeDialog}
          onClose={this.closeDialog}
        />
      </>
    );
  }
}

JournalsDashletGrid.propTypes = {
  stateId: PropTypes.string,
  className: PropTypes.string,
  toolsClassName: PropTypes.string,
  minHeight: PropTypes.any,
  maxHeight: PropTypes.any,
  autoHeight: PropTypes.bool,
  doInlineToolsOnRowClick: PropTypes.bool,
  isWidget: PropTypes.bool,
  onRowClick: PropTypes.func
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
