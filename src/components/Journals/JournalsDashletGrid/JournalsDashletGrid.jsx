import first from 'lodash/first';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ParserPredicate } from '../../Filters/predicates';
import { InfoText, Loader } from '../../common';
import { EmptyGrid, Grid, InlineTools } from '../../common/grid';
import { DEFAULT_PAGINATION } from '../constants';

import {
  deselectAllRecords,
  execRecordsAction,
  goToJournalsPage,
  reloadGrid,
  saveRecords,
  setColumnsSetup,
  setExcludedRecords,
  setJournalSetting,
  setPredicate,
  setSelectAllPageRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords,
  saveColumn
} from '@/actions/journals';
import { wrapArgs } from '@/helpers/redux';
import { t } from '@/helpers/util';
import { selectJournalDashletGridProps } from '@/selectors/dashletJournals';
import { selectOriginGridPredicates } from '@/selectors/journals';
import { selectIsViewNewJournal } from '@/selectors/view';

const mapStateToProps = (state, props) => {
  const ownState = selectJournalDashletGridProps(state, props.stateId);

  const reduxKey = get(props, 'reduxKey', 'journals');
  const stateId = get(props, 'stateId', '');
  const newState = state[reduxKey][stateId] || {};
  const isViewNewJournal = selectIsViewNewJournal(state);

  return {
    isMobile: !!get(state, 'view.isMobile'),
    originPredicates: selectOriginGridPredicates(state, props.stateId),
    isViewNewJournal,

    settingsInlineTools: {
      className: props.className,
      selectedRecords: newState.selectedRecords || [],
      selectAllPageRecords: newState.selectAllPageRecords
    },

    ...ownState
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    reloadGrid: options => dispatch(reloadGrid(w(options))),
    saveRecords: ({ id, attributes }) => dispatch(saveRecords(w({ id, attributes }))),
    execRecordsAction: (records, action, context) => dispatch(execRecordsAction(w({ records, action, context }))),
    setSelectedRecords: records => dispatch(setSelectedRecords(w(records))),
    setExcludedRecords: records => dispatch(setExcludedRecords(w(records))),
    setSelectAllPageRecords: need => dispatch(setSelectAllPageRecords(w(need))),
    setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(w(visible))),
    deselectAllRecords: () => dispatch(deselectAllRecords(w())),
    goToJournalsPage: row => dispatch(goToJournalsPage(w(row))),
    setPredicate: options => dispatch(setPredicate(w(options))),
    setJournalSetting: settings => dispatch(setJournalSetting(w(settings))),
    setColumnsSetup: (columns, sortBy) => dispatch(setColumnsSetup(w({ columns, sortBy }))),
    saveColumn: data => dispatch(saveColumn(w(data)))
  };
};
//todo rethink this solution without empty grid and especially cloneElement for grid
export const HeightCalculation = props => {
  const { minHeight, maxHeight, loading, children, total, maxItems } = props;

  if (!isNil(minHeight) && loading) {
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

class JournalsDashletGrid extends Component {
  selectedRow = {};
  scrollPosition = {};

  state = {
    isDialogShow: false
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (get(prevProps, 'grid.pagination.page') !== get(this.props, 'grid.pagination.page')) {
      this.scrollPosition.scrollTop = 0;
    } else {
      this.scrollPosition.scrollTop = undefined;
    }
  }

  setSelectedRecords = ({ selected, all: allPage, allPossible, excluded }) => {
    const {
      setSelectedRecords,
      setExcludedRecords,
      setSelectAllRecordsVisible,
      setSelectAllPageRecords,
      deselectAllRecords,
      selectAllRecordsVisible
    } = this.props;

    if (!selected.length) {
      deselectAllRecords();
      return;
    }

    setSelectedRecords(selected);
    setSelectAllPageRecords(allPage);
    !isNil(allPossible) && setSelectAllRecordsVisible(allPossible);

    const _allPossible = isNil(allPossible) ? selectAllRecordsVisible : allPossible;
    !isNil(excluded) && setExcludedRecords(_allPossible ? excluded : []);
  };

  reloadGrid = options => {
    options = options || {};
    const { predicate, grid } = this.props;
    const { columns, groupBy, sortBy } = grid || {};
    const predicates = predicate ? [predicate] : [];
    const currentOptions = { columns, groupBy, sortBy, predicates };

    this.hideGridInlineToolSettings();
    this.props.reloadGrid({ ...currentOptions, ...options });
  };

  onFilterInline = (_predicates, _type) => {
    const [filter] = _predicates;
    const { setPredicate, setJournalSetting, grid } = this.props;
    const { pagination: pager, predicates } = grid || {};
    const newPredicates = ParserPredicate.setNewPredicates(first(predicates), filter, true);
    const { maxItems } = pager || DEFAULT_PAGINATION;
    const pagination = { ...DEFAULT_PAGINATION, maxItems };

    setPredicate(newPredicates);
    setJournalSetting({ predicate: newPredicates });
    this.reloadGrid({ predicates: [newPredicates], pagination });
  };

  onSort = e => {
    const sortBy = [
      {
        attribute: e.column.attribute,
        ascending: !e.ascending
      }
    ];

    this.reloadGrid({ sortBy });
  };

  setSelectedRow(row) {
    this.selectedRow = row || {};
  }

  showGridInlineToolSettings = options => {
    this.setSelectedRow(options.row);
  };

  getCurrentRowInlineActions(row) {
    const { execRecordsAction, grid } = this.props;
    const { groupBy = [], actions } = grid || {};
    const { forRecord = {} } = actions || {};

    if (groupBy.length) {
      return [
        {
          title: t('grid.inline-tools.details'),
          onClick: () => this.props.goToJournalsPage(row || this.selectedRow),
          icon: 'icon-small-arrow-right'
        }
      ];
    }

    const currentRow = this.selectedRow.id;
    const recordActions = get(forRecord, currentRow, []);
    const handlers = {
      reloadJournalGrid: this.reloadGrid
    };

    return recordActions.map(action => ({
      ...action,
      onClick: () => execRecordsAction(currentRow, { ...action, config: { handlers, ...(action.config || {}) } })
    }));
  }

  hideGridInlineToolSettings = () => {
    this.setSelectedRow();
  };

  inlineTools = inlineToolSettings => {
    const { settingsInlineTools, loading } = this.props;

    inlineToolSettings.actions = this.getCurrentRowInlineActions(inlineToolSettings.row);

    const settings = {
      ...settingsInlineTools,
      inlineToolSettings,
      loading
    };

    return <InlineTools {...settings} />;
  };

  onRowClick = row => {
    const { onRowClick } = this.props;

    if (typeof onRowClick === 'function') {
      onRowClick(row);
    }
  };

  onDelete = () => null;

  closeDialog = () => {
    this.setState({ isDialogShow: false });
  };

  handleColumnSave = updatedColumn => {
    const { saveColumn } = this.props;
    saveColumn(updatedColumn);
  };

  render() {
    const {
      isBlockNewJournalFormatter,
      selectedRecords,
      excludedRecords,
      selectAllPageRecords,
      saveRecords,
      className,
      loadingGrid,
      loading,
      isWidget,
      grid,
      doInlineToolsOnRowClick = false,
      minHeight,
      maxHeight,
      autoHeight,
      predicate,
      journalConfig,
      selectorContainer,
      viewColumns,
      onOpenSettings,
      query,
      isGrouped,
      originPredicates,
      isResetGridSettings,
      deselectAllRecords,
      journalId,
      footerValue,
      journalSetting,
      journalSettings,
      draggableEvents,
      isViewNewJournal
    } = this.props;

    const { data, sortBy, pagination, groupBy, total = 0, editingRules } = grid || {};
    const { params = {}, meta = {} } = journalConfig || {};
    const maxItems = get(pagination, 'maxItems', 0);

    let editable = true;

    if ((groupBy && groupBy.length) || params.disableTableEditing) {
      editable = false;
    }

    let filters = ParserPredicate.getFlatFilters(predicate);

    if (isGrouped && isEmpty(filters)) {
      filters = ParserPredicate.getFlatFilters(query);
    }

    return (
      <>
        <div className="ecos-journal-dashlet__grid">
          {/* loadingGrid is an indicator of the loading of the primary data of the table. You can't change it to global loading */}
          {!isWidget && loadingGrid && <Loader blur />}
          {!loading && isEmpty(viewColumns) && <InfoText text={t('journal.table.no-columns')} />}
          <HeightCalculation loading={loadingGrid} minHeight={minHeight} maxHeight={maxHeight} total={total} maxItems={maxItems}>
            <Grid
              isBlockNewJournalFormatter={isBlockNewJournalFormatter}
              recordRef={meta.metaRecord}
              originPredicates={originPredicates}
              data={data}
              loading={!isWidget && loading}
              columns={viewColumns}
              className={className}
              gridWrapperClassName="ecos-journal-dashlet__grid-wrapper"
              hTrackClassName="ecos-journal-dashlet__grid-track ecos-journal-dashlet__grid-track_h"
              freezeCheckboxes
              filterable
              editable={editable}
              editingRules={editingRules}
              multiSelectable
              sortBy={sortBy}
              changeTrOptionsByRowClick={doInlineToolsOnRowClick}
              filters={filters}
              inlineTools={this.inlineTools}
              onSort={this.onSort}
              onFilter={this.onFilterInline}
              onSelect={this.setSelectedRecords}
              onRowClick={doInlineToolsOnRowClick ? this.onRowClick : null}
              onMouseLeave={!doInlineToolsOnRowClick ? this.hideGridInlineToolSettings : null}
              onChangeTrOptions={this.showGridInlineToolSettings}
              onEdit={saveRecords}
              selected={selectedRecords}
              excluded={excludedRecords}
              selectAll={selectAllPageRecords}
              minHeight={minHeight}
              maxHeight={maxHeight}
              autoHeight={autoHeight}
              scrollPosition={this.scrollPosition}
              selectorContainer={selectorContainer}
              onOpenSettings={onOpenSettings}
              isResetSettings={isResetGridSettings}
              deselectAllRecords={deselectAllRecords}
              journalId={journalId}
              onColumnSave={this.handleColumnSave}
              footerValue={footerValue}
              journalSetting={journalSetting}
              journalSettings={journalSettings}
              isViewNewJournal={isViewNewJournal}
              {...draggableEvents}
            />
          </HeightCalculation>
        </div>
      </>
    );
  }
}

JournalsDashletGrid.propTypes = {
  stateId: PropTypes.string,
  journalId: PropTypes.string,
  className: PropTypes.string,
  draggableEvents: PropTypes.object,
  toolsClassName: PropTypes.string,
  selectorContainer: PropTypes.string,
  originPredicates: PropTypes.array,
  minHeight: PropTypes.any,
  maxHeight: PropTypes.any,
  autoHeight: PropTypes.bool,
  doInlineToolsOnRowClick: PropTypes.bool,
  isWidget: PropTypes.bool,
  isResetGridSettings: PropTypes.bool,
  onRowClick: PropTypes.func,
  onOpenSettings: PropTypes.func
};

export default connect(mapStateToProps, mapDispatchToProps)(JournalsDashletGrid);
