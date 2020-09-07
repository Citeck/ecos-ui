import React, { Component } from 'react';
import PropTypes from 'prop-types';
import connect from 'react-redux/es/connect/connect';
import get from 'lodash/get';

import { ParserPredicate } from '../../Filters/predicates';
import { Loader } from '../../common';
import { EmptyGrid, Grid, InlineTools, Tools } from '../../common/grid';
import { IcoBtn } from '../../common/btns';
import { DropdownOuter } from '../../common/form';
import { t, trigger } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import {
  execRecordsAction,
  goToJournalsPage,
  reloadGrid,
  saveRecords,
  setColumnsSetup,
  setGridInlineToolSettings,
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
    isLoadingPerformGroupActions: newState.isLoadingPerformGroupActions
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    saveRecords: ({ id, attributes }) => dispatch(saveRecords(w({ id, attributes }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(w(visible))),
    setGridInlineToolSettings: settings => dispatch(setGridInlineToolSettings(w(settings))),
    goToJournalsPage: row => dispatch(goToJournalsPage(w(row))),
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

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (get(prevProps, 'grid.pagination.page') !== get(this.props, 'grid.pagination.page')) {
      this.scrollPosition.scrollTop = 0;
    }
  }

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
      grid: { columns, pagination: pager, predicates }
    } = this.props;
    const currentFilters = ParserPredicate.getFlatFilters(predicates) || [];

    currentFilters.push(filter);

    const predicate = ParserPredicate.getDefaultPredicates(columns, currentFilters.map(filter => filter.att));
    const newPredicate = ParserPredicate.setPredicateValue(predicate, currentFilters, true);
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
      grid: {
        groupBy = [],
        actions: { forRecord = {} }
      }
    } = this.props;

    if (groupBy.length) {
      return [
        {
          title: t('grid.inline-tools.details'),
          onClick: () => this.goToJournalPageWithFilter(),
          icon: 'icon-small-arrow-right'
        }
      ];
    }

    const currentRow = this.getSelectedRow().id;
    const recordActions = get(forRecord, currentRow, []);

    return recordActions.map(action => ({ ...action, onClick: () => execRecordsAction(currentRow, action) }));
  }

  hideGridInlineToolSettings = () => {
    this.clearSelectedRow();
    this.props.setGridInlineToolSettings(DEFAULT_INLINE_TOOL_SETTINGS);
  };

  goToJournalPageWithFilter = () => {
    const selectedRow = this.getSelectedRow();
    this.props.goToJournalsPage(selectedRow);
  };

  inlineTools = () => {
    const { stateId } = this.props;
    return <InlineTools stateId={stateId} />;
  };

  renderTools = () => {
    const {
      isMobile,
      selectAllRecordsVisible,
      selectAllRecords,
      grid: {
        total,
        actions: { forRecords = {}, forQuery = {} }
      },
      toolsClassName
    } = this.props;

    const forRecordsInlineActions = [];
    const forRecordsDropDownActions = [];
    const groupActions = selectAllRecords ? forQuery.actions : forRecords.actions;

    for (let action of groupActions) {
      if (action.icon) {
        forRecordsInlineActions.push(action);
      } else {
        forRecordsDropDownActions.push(action);
      }
    }

    const tools = forRecordsInlineActions.map(action => (
      <IcoBtn
        icon={action.icon}
        className="ecos-journal__tool ecos-btn_i_sm ecos-btn_grey4 ecos-btn_hover_t-dark-brown"
        title={action.pluralName}
        onClick={() => this.executeGroupAction(action)}
      />
    ));

    if (forRecordsDropDownActions.length) {
      tools.push(
        <DropdownOuter
          className="ecos-journal__tool-group-dropdown grid-tools__item_left_5"
          source={forRecordsDropDownActions}
          valueField={'id'}
          titleField={'pluralName'}
          keyFields={['id', 'formRef', 'pluralName']}
          isStatic
          onChange={action => this.executeGroupAction(action)}
        >
          <IcoBtn
            invert
            icon={'icon-small-down'}
            className="ecos-journal__tool-group-btn dashlet__btn ecos-btn_extra-narrow grid-tools__item_select-group-actions-btn"
            onClick={this.onGoTo}
          >
            {t(isMobile ? 'grid.tools.group-actions-mobile' : 'grid.tools.group-actions')}
          </IcoBtn>
        </DropdownOuter>
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

  executeGroupAction(action) {
    const {
      selectAllRecords,
      grid: { query }
    } = this.props;

    if (!selectAllRecords) {
      const records = this.props.selectedRecords || [];
      this.props.execRecordsAction(records, action);
    } else {
      this.props.execRecordsAction(query, action);
    }
  }

  onRowClick = row => {
    trigger.call(this, 'onRowClick', row);
  };

  onDelete = () => null;

  closeDialog = () => {
    this.setState({ isDialogShow: false });
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
        pagination: { maxItems = 0 },
        groupBy,
        total = 0,
        editingRules
      },
      doInlineToolsOnRowClick = false,
      minHeight,
      maxHeight,
      autoHeight,
      predicate,
      journalConfig: { params = {} },
      selectorContainer
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
          <HeightCalculation>
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
                onRowClick={doInlineToolsOnRowClick ? this.onRowClick : null}
                onMouseLeave={!doInlineToolsOnRowClick ? this.hideGridInlineToolSettings : null}
                onChangeTrOptions={this.showGridInlineToolSettings}
                onScrolling={this.onScrolling}
                onEdit={saveRecords}
                selected={selectedRecords}
                selectAll={selectAllRecords}
                minHeight={minHeight}
                maxHeight={maxHeight}
                autoHeight={autoHeight}
                scrollPosition={this.scrollPosition}
                selectorContainer={selectorContainer}
              />
            )}
          </HeightCalculation>
        </div>
      </>
    );
  }
}

JournalsDashletGrid.propTypes = {
  stateId: PropTypes.string,
  className: PropTypes.string,
  toolsClassName: PropTypes.string,
  selectorContainer: PropTypes.string,
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
