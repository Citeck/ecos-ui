import React from 'react';
import PropTypes from 'prop-types';
import connect from 'react-redux/es/connect/connect';
import get from 'lodash/get';

import { ParserPredicate } from '../../Filters/predicates';
import { Loader } from '../../common';
import { EmptyGrid, Grid, InlineTools } from '../../common/grid';
import { t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import {
  execRecordsAction,
  goToJournalsPage,
  reloadGrid,
  saveRecords,
  setColumnsSetup,
  setGridInlineToolSettings,
  setJournalSetting,
  setPredicate,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setSelectedRecords
} from '../../../actions/journals';
import { selectJournalDashletGridProps } from '../../../selectors/dashletJournals';
import { DEFAULT_INLINE_TOOL_SETTINGS, DEFAULT_PAGINATION } from '../constants';

const mapStateToProps = (state, props) => {
  const ownState = selectJournalDashletGridProps(state, props.stateId);

  return {
    isMobile: !!get(state, 'view.isMobile'),
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
    setSelectAllRecords: need => dispatch(setSelectAllRecords(w(need))),
    setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(w(visible))),
    setGridInlineToolSettings: settings => dispatch(setGridInlineToolSettings(w(settings))),
    goToJournalsPage: row => dispatch(goToJournalsPage(w(row))),
    setPredicate: options => dispatch(setPredicate(w(options))),
    setJournalSetting: settings => dispatch(setJournalSetting(w(settings))),
    setColumnsSetup: (columns, sortBy) => dispatch(setColumnsSetup(w({ columns, sortBy })))
  };
};

const HeightCalculation = props => {
  const { minHeight, maxHeight, children, total, maxItems } = props;

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

class JournalsDashletGrid extends React.Component {
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

  handleSetInlineTools = this.props.setGridInlineToolSettings;

  setSelectedRecords = e => {
    const props = this.props;
    props.setSelectedRecords(e.selected);
    props.setSelectAllRecordsVisible(e.all);

    if (!e.all) {
      props.setSelectAllRecords(false);
    }
  };

  reloadGrid(options) {
    options = options || {};
    const { predicate, grid } = this.props;
    const { columns, groupBy, sortBy } = grid || {};
    const predicates = predicate ? [predicate] : [];
    const currentOptions = { columns, groupBy, sortBy, predicates };

    this.hideGridInlineToolSettings();
    this.props.reloadGrid({ ...currentOptions, ...options });
  }

  onFilter = ([filter]) => {
    const { setPredicate, setJournalSetting, grid } = this.props;
    const { pagination: pager, predicates } = grid || {};
    const currentFilters = ParserPredicate.getFlatFilters(predicates) || [];
    const filterIdx = currentFilters.findIndex(item => item.att === filter.att);

    if (filterIdx !== -1) {
      currentFilters[filterIdx] = filter;
    } else {
      currentFilters.push(filter);
    }

    const newPredicate = ParserPredicate.setNewPredicates(predicates[0], currentFilters, true);
    const { maxItems } = pager || DEFAULT_PAGINATION;
    const pagination = { ...DEFAULT_PAGINATION, maxItems };

    setPredicate(newPredicate);
    setJournalSetting({ predicate: newPredicate });
    this.reloadGrid({ predicates: [newPredicate], pagination });
  };

  onSort = e => {
    const { setColumnsSetup, grid } = this.props;
    const { columns } = grid || {};
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
    this.selectedRow = row || {};
  }

  showGridInlineToolSettings = options => {
    this.setSelectedRow(options.row);
    this.handleSetInlineTools({ actions: this.getCurrentRowInlineActions(), ...options });
  };

  getCurrentRowInlineActions() {
    const { execRecordsAction, grid } = this.props;
    const {
      groupBy = [],
      actions: { forRecord = {} }
    } = grid || {};

    if (groupBy.length) {
      return [
        {
          title: t('grid.inline-tools.details'),
          onClick: () => this.props.goToJournalsPage(this.selectedRow),
          icon: 'icon-small-arrow-right'
        }
      ];
    }

    const currentRow = this.selectedRow.id;
    const recordActions = get(forRecord, currentRow, []);

    return recordActions.map(action => ({ ...action, onClick: () => execRecordsAction(currentRow, action) }));
  }

  hideGridInlineToolSettings = () => {
    this.setSelectedRow();
    this.handleSetInlineTools(DEFAULT_INLINE_TOOL_SETTINGS);
  };

  inlineTools = () => {
    const { stateId } = this.props;
    return <InlineTools stateId={stateId} />;
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
      onOpenSettings
    } = this.props;

    const { data, sortBy, pagination, groupBy, total = 0, editingRules } = grid || {};
    const { params = {} } = journalConfig || {};

    let editable = true;

    if ((groupBy && groupBy.length) || params.disableTableEditing) {
      editable = false;
    }

    const filters = ParserPredicate.getFlatFilters(predicate);

    return (
      <>
        <div className="ecos-journal-dashlet__grid">
          {!isWidget && loading && <Loader blur />}

          <HeightCalculation minHeight={minHeight} maxHeight={maxHeight} total={total} maxItems={get(pagination, 'maxItems', 0)}>
            <Grid
              data={data}
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
              onOpenSettings={onOpenSettings}
            />
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
  onRowClick: PropTypes.func,
  onOpenSettings: PropTypes.func
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
