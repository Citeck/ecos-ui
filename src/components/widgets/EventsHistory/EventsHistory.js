import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import set from 'lodash/set';
import isEmpty from 'lodash/isEmpty';
import { Scrollbars } from 'react-custom-scrollbars';

import { filterEventsHistory, getEventsHistory, resetEventsHistory } from '../../../actions/eventsHistory';
import { selectDataEventsHistoryByStateId } from '../../../selectors/eventsHistory';
import EventsHistoryService from '../../../services/eventsHistory';
import { t } from '../../../helpers/util';
import { getOptimalHeight } from '../../../helpers/layout';
import { InfoText, Loader } from '../../common';
import { Grid } from '../../common/grid';
import EventsHistoryCard from './EventsHistoryCard';

import './style.scss';

const mapStateToProps = (state, context) => {
  const ahState = selectDataEventsHistoryByStateId(state, context.stateId) || {};

  return {
    list: ahState.list,
    isLoading: ahState.isLoading,
    columns: isEmpty(ahState.columns)
      ? isEmpty(context.myColumns)
        ? EventsHistoryService.config.columns
        : context.myColumns
      : ahState.columns,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getEventsHistory: payload => dispatch(getEventsHistory(payload)),
  filterEventsHistory: payload => dispatch(filterEventsHistory(payload)),
  resetEventsHistory: payload => dispatch(resetEventsHistory(payload))
});

const Scroll = ({ scrollable, children, height = '100%' }) =>
  scrollable ? (
    <Scrollbars
      style={{ height }}
      className="ecos-event-history__scroll"
      renderTrackVertical={props => <div {...props} className="ecos-event-history__v-scroll" />}
    >
      {children}
    </Scrollbars>
  ) : (
    <>{children}</>
  );

class EventsHistory extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    myColumns: PropTypes.array,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    getContentHeight: PropTypes.func
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isMobile: false,
    isLoading: false,
    myColumns: []
  };

  state = {
    contentHeight: 0,
    filters: []
  };

  _filter = React.createRef();

  componentDidMount() {
    this.getEventsHistory();
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    return { contentHeightOld: this.contentHeight };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { isLoading, height, minHeight, maxHeight, getContentHeight } = this.props;
    const table = get(this.props, 'forwardedRef.current', null);
    const contentHeight = this.contentHeight;
    const filterHeight = get(this._filter, 'current.offsetHeight', 0);
    const fixHeight = height ? height - filterHeight : null;

    if (contentHeight !== snapshot.contentHeightOld) {
      getContentHeight(contentHeight);
    }

    if (contentHeight !== snapshot.contentHeightOld || height !== prevProps.height) {
      const optimalHeight = getOptimalHeight(fixHeight, contentHeight, minHeight, maxHeight, isLoading || !contentHeight);

      set(table, 'style.height', `${optimalHeight}px`);
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

  getEventsHistory = () => {
    const { getEventsHistory, record, stateId, columns } = this.props;

    getEventsHistory({
      stateId,
      record,
      columns
    });
  };

  onFilter = predicates => {
    const { filterEventsHistory, record, stateId, columns } = this.props;

    filterEventsHistory({
      stateId,
      record,
      columns,
      predicates
    });
  };

  onGridFilter = (newFilters = []) => {
    const { filters } = this.state;
    const newFilter = get(newFilters, '0', {});
    const upFilters = filters.filter(item => item.att !== newFilter.att).concat(newFilters || []);

    this.setState({ filters: upFilters }, () => {
      this.onFilter(this.state.filters);
    });
  };

  renderEnum() {
    const { list, columns, isMobile } = this.props;

    return (
      <Scroll scrollable={!isMobile}>
        <div className="ecos-event-history-list ecos-event-history-list_view-enum">
          {list.map((item, i) => (
            <EventsHistoryCard key={item.id + i} columns={columns} event={item} />
          ))}
        </div>
      </Scroll>
    );
  }

  renderTable() {
    const { list, columns, isMobile } = this.props;
    //todo for server filer const { filters } = this.state;

    return (
      <Grid
        fixedHeader
        data={list}
        columns={columns}
        scrollable={!isMobile}
        className="ecos-event-history-list ecos-event-history-list_view-table ecos-grid_no-top-border"
      />
      // filterable={false}
      // filters={filters}
      // onFilter={this.onGridFilter}
    );
  }

  renderContent() {
    const { isSmallMode, isMobile, isLoading, list, columns } = this.props;

    if (isLoading) {
      return <Loader className="ecos-event-history-list__loader" />;
    }

    if (isEmpty(columns)) {
      return <InfoText text={t('events-history-widget.info.no-columns')} />;
    }

    if (isEmpty(list)) {
      return <InfoText text={t('events-history-widget.info.no-events')} />;
    }

    if (isSmallMode || isMobile) {
      return this.renderEnum();
    }

    return this.renderTable();
  }

  render() {
    const { className, forwardedRef } = this.props;

    return (
      <div className={classNames('ecos-event-history', className)}>
        <div ref={this._filter}>
          {/*{(isMobile || isSmallMode) && (
            <DropdownFilter columns={columns} className="ecos-event-history__filter" onFilter={this.onFilter} />
          )}*/}
        </div>
        <div ref={forwardedRef}>{this.renderContent()}</div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventsHistory);
