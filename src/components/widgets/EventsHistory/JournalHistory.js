import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { filterJournalHistory, getJournalHistory, resetEventsHistory } from '../../../actions/eventsHistory';
import { selectDataEventsHistoryByStateId } from '../../../selectors/eventsHistory';
import EventsHistoryService from '../../../services/eventsHistory';
import { t } from '../../../helpers/util';
import { InfoText, Loader } from '../../common';
import { Grid } from '../../common/grid';
import EventsHistoryCard from './EventsHistoryCard';
import { Labels } from './util';

import './style.scss';

const mapStateToProps = (state, context) => {
  const ehState = selectDataEventsHistoryByStateId(state, context.stateId) || {};

  return {
    list: ehState.list,
    isLoading: ehState.isLoading,
    columns: ehState.columns,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getJournalHistory: payload => dispatch(getJournalHistory(payload)),
  filterJournalHistory: payload => dispatch(filterJournalHistory(payload)),
  resetEventsHistory: payload => dispatch(resetEventsHistory(payload))
});

const Scroll = ({ scrollable, children, height = '100%', scrollbarProps }) =>
  scrollable ? (
    <Scrollbars
      style={{ height }}
      className="ecos-event-history__scroll"
      renderTrackVertical={props => <div {...props} className="ecos-event-history__v-scroll" />}
      {...scrollbarProps}
    >
      {children}
    </Scrollbars>
  ) : (
    <>{children}</>
  );

/**
 * @desc JournalHistory is 2d version of history.
 * This version works with Journal config only
 * @default default journal config is defined in EventsHistoryService now
 */
class JournalHistory extends Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    runUpdate: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    getContentHeight: PropTypes.func
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
    this.getJournalHistory();
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    return { contentHeightOld: this.contentHeight };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.checkHeight({ contentHeightOld: snapshot.contentHeightOld, height: prevProps.height });

    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getJournalHistory();
    }

    if (!prevProps.runCleanFilters && this.props.runCleanFilters) {
      this.setState({ filters: [] }, this.runFilter);
    }
  }

  componentWillUnmount() {
    const { resetEventsHistory, stateId } = this.props;

    resetEventsHistory({ stateId });
  }

  get contentHeight() {
    const { isSmallMode, isMobile } = this.props;
    const table = get(this.props, 'forwardedRef.current', null);

    if (table) {
      const content =
        isSmallMode || isMobile
          ? table.querySelector('.ecos-event-history-list')
          : table.querySelector('.ecos-event-history-list .ecos-grid__table');

      return get(content, 'offsetHeight', 0);
    }

    return 0;
  }

  checkHeight(old) {
    const { getContentHeight } = this.props;
    const contentHeight = this.contentHeight;

    if (contentHeight !== old.contentHeightOld) {
      getContentHeight(contentHeight);
    }
  }

  getJournalHistory = () => {
    const { getJournalHistory, record, stateId, selectedJournal } = this.props;

    getJournalHistory({ stateId, record, selectedJournal });
  };

  runFilter = () => {
    const predicates = this.state.filters;
    const { filterJournalHistory, record, stateId, columns } = this.props;

    filterJournalHistory({ stateId, record, columns, predicates });
  };

  handleFilter = (newFilters = [], type) => {
    const newFilter = get(newFilters, '0', {});
    const filters = EventsHistoryService.joinFilters(this.state.filters, newFilter, type);

    this.setState({ filters }, this.runFilter);
  };

  renderEnum() {
    const { list, columns, scrollbarProps } = this.props;

    return (
      <Scroll scrollable scrollbarProps={scrollbarProps}>
        <div className="ecos-event-history-list ecos-event-history-list_view-enum">
          {list.map((item, i) => (
            <EventsHistoryCard key={item.id + i} columns={columns} event={item} />
          ))}
        </div>
      </Scroll>
    );
  }

  renderTable() {
    const { columns, isMobile, maxHeight, list } = this.props;
    const { filters } = this.state;

    return (
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
        onFilter={this.handleFilter}
      />
    );
  }

  renderContent() {
    const { isSmallMode, isMobile, isLoading, columns } = this.props;

    if (!isLoading && isEmpty(columns)) {
      return <InfoText text={t(Labels.NO_COLS)} />;
    }

    if (isSmallMode || isMobile) {
      return this.renderEnum();
    }

    return this.renderTable();
  }

  render() {
    const { isLoading, className, forwardedRef } = this.props;

    return (
      <div className={classNames('ecos-event-history', className)}>
        {isLoading && <Loader className="ecos-event-history-list__loader" blur />}
        <div ref={forwardedRef}>{this.renderContent()}</div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalHistory);
