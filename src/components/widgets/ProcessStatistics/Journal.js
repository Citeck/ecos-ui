import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { t } from '../../../helpers/util';
import { InfoText, Loader } from '../../common';
import { Grid } from '../../common/grid';

import './style.scss';
import { Labels } from './util';
import { getJournal } from '../../../actions/processStatistics';

const mapStateToProps = (state, context) => {
  const psState = get(state, ['processStatistics', context.stateId], {});

  return {
    data: psState.data,
    isLoading: psState.isLoading,
    columns: psState.columns,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getJournalData: payload => dispatch(getJournal(payload))
  // filterJournalHistory: payload => dispatch(filterJournalHistory(payload)),
  // resetEventsHistory: payload => dispatch(resetEventsHistory(payload))
});

class Journal extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    runUpdate: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: ''
  };

  state = {
    contentHeight: 0,
    filters: []
  };

  _filter = React.createRef();

  componentDidMount() {
    this.getJournal();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getJournal();
    }
  }

  componentWillUnmount() {
    const { resetEventsHistory, stateId } = this.props;

    //resetEventsHistory({ stateId });
  }

  getJournal = () => {
    const { getJournalData, record, stateId, selectedJournal } = this.props;

    getJournalData({ stateId, record, selectedJournal });
  };

  onFilter = predicates => {
    const { filterJournalHistory, record, stateId, columns } = this.props;

    //filterJournalHistory({ stateId, record, columns, predicates });
  };

  onGridFilter = (newFilters = [], type) => {
    // const { filters } = this.state;
    // const newFilter = get(newFilters, '0', {});
    // const upFilters = EventsHistoryService.applyFilters(filters, newFilter, type);
    //
    // this.setState({ filters: upFilters }, () => this.onFilter(this.state.filters));
  };

  render() {
    const { isLoading, columns, isMobile, maxHeight, list } = this.props;
    const { filters } = this.state;

    if (!isLoading && isEmpty(columns)) {
      return <InfoText text={t(Labels.NO_COLS)} />;
    }

    return (
      <>
        {isLoading && <Loader blur />}
        <Grid
          fixedHeader
          data={list}
          columns={columns}
          scrollable={!isMobile}
          noTopBorder
          className="ecos-event-history-list ecos-event-history-list_view-table"
          maxHeight={maxHeight}
          autoHeight
          filterable
          filters={filters}
          onFilter={this.onGridFilter}
        />
      </>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journal);
