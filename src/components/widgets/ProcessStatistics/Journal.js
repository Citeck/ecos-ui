import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { Collapse } from 'react-collapse';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { getJournal } from '../../../actions/processStatistics';
import { t } from '../../../helpers/util';
import { Icon, InfoText, Loader } from '../../common';
import { Grid } from '../../common/grid';
import { Caption } from '../../common/form';
import { Labels } from './util';

import './style.scss';

const mapStateToProps = (state, context) => {
  const psState = get(state, ['processStatistics', context.stateId], {});

  return {
    data: psState.data,
    isLoading: psState.isLoadingJournal,
    columns: get(psState, 'journalConfig.columns', []),
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

  constructor(props) {
    super(props);
    this.state = {
      contentHeight: 0,
      filters: [],
      isOpened: !!props.showJournalDefault
    };
  }

  componentDidMount() {
    this.getJournal();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getJournal();
    }
  }

  componentWillUnmount() {
    //const { resetEventsHistory, stateId } = this.props;
    //resetEventsHistory({ stateId });
  }

  getJournal = () => {
    const { getJournalData, record, stateId, selectedJournal } = this.props;

    getJournalData({ stateId, record, selectedJournal });
  };

  onFilter = predicates => {
    //const { filterJournalHistory, record, stateId, columns } = this.props;
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
    const { isLoading, columns, isMobile, maxHeight, data } = this.props;
    const { filters, isOpened } = this.state;

    return (
      <div className="ecos-process-statistics-journal">
        {isLoading && <Loader blur />}
        <Caption small onClick={() => this.setState({ isOpened: !isOpened })}>
          {t(Labels.JOURNAL_TITLE)}
          <Icon className={classNames({ 'icon-small-up': isOpened, 'icon-small-down': !isOpened })} />
        </Caption>
        <Collapse isOpened={isOpened}>
          {!isLoading && isEmpty(columns) && <InfoText text={t(Labels.NO_COLS)} />}
          <Grid
            fixedHeader
            data={data}
            columns={columns}
            scrollable={!isMobile}
            maxHeight={maxHeight}
            autoHeight
            filterable
            filters={filters}
            onFilter={this.onGridFilter}
          />
          {!isEmpty(columns) && <InfoText text={t(Labels.JOURNAL_LAST_RECORDS)} noIndents />}
        </Collapse>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journal);
