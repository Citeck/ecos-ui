import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Grid from '../../common/grid/Grid/Grid';
import Loader from '../../common/Loader/Loader';
import {
  reloadGrid,
  deleteRecords,
  saveRecords,
  setSelectedRecords,
  setSelectAllRecords,
  setSelectAllRecordsVisible,
  setGridEmptyHeight
} from '../../../actions/journals';

const mapStateToProps = state => ({
  loading: state.journals.loading,
  gridData: state.journals.gridData,
  emptyRowsCount: state.journals.emptyRowsCount,
  journalConfig: state.journals.journalConfig,
  selectedRecords: state.journals.selectedRecords,
  selectAllRecords: state.journals.selectAllRecords,
  selectAllRecordsVisible: state.journals.selectAllRecordsVisible,
  emptyGridHeight: state.journals.emptyGridHeight
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: ({ journalId, pagination, columns, criteria }) => dispatch(reloadGrid({ journalId, pagination, columns, criteria })),
  deleteRecords: records => dispatch(deleteRecords(records)),
  saveRecords: ({ id, attributes }) => dispatch(saveRecords({ id, attributes })),
  setSelectedRecords: records => dispatch(setSelectedRecords(records)),
  setSelectAllRecords: need => dispatch(setSelectAllRecords(need)),
  setSelectAllRecordsVisible: visible => dispatch(setSelectAllRecordsVisible(visible)),
  setGridEmptyHeight: ({ height }) => dispatch(setGridEmptyHeight(height))
});

class JournalsDashletGrid extends Component {
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

  onFilter = filter => {
    const props = this.props;
    const {
      columns,
      meta: { criteria }
    } = props.journalConfig;
    props.reloadGrid({ columns, criteria: [...filter, ...criteria] });
  };

  render() {
    const props = this.props;

    return (
      <div className={'journal-dashlet__grid'}>
        {props.loading ? <Loader /> : null}

        <Grid
          {...props.gridData}
          className={props.loading ? 'grid_transparent' : ''}
          hasCheckboxes
          hasInlineTools
          onFilter={this.onFilter}
          onSelectAll={this.setSelectAllRecords}
          onSelect={this.setSelectedRecords}
          onDelete={props.deleteRecords}
          onEdit={props.saveRecords}
          onEmptyHeight={props.setGridEmptyHeight}
          minHeight={props.emptyGridHeight}
          selected={props.selectedRecords}
          selectAllRecords={props.selectAllRecords}
          selectAllRecordsVisible={props.selectAllRecordsVisible}
          emptyRowsCount={props.emptyRowsCount}
        />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletGrid);
