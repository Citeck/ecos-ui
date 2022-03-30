import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import moment from 'moment';

import { filterEventsHistory, getEventsHistory, resetEventsHistory, getJournalConfig } from '../../../actions/eventsHistory';
import { selectDataEventsHistoryByStateId } from '../../../selectors/eventsHistory';
import EventsHistoryService from '../../../services/eventsHistory';
import { t } from '../../../helpers/util';
import { InfoText, Loader } from '../../common';
import { Grid } from '../../common/grid';
import EventsHistoryCard from './EventsHistoryCard';
import { DataFormatTypes, DateFormats } from '../../../constants';
import {
  datePredicateVariables,
  PREDICATE_CONTAINS,
  PREDICATE_EMPTY,
  PREDICATE_ENDS,
  PREDICATE_EQ,
  PREDICATE_GE,
  PREDICATE_GT,
  PREDICATE_LE,
  PREDICATE_LT,
  PREDICATE_NOT_CONTAINS,
  PREDICATE_NOT_EMPTY,
  PREDICATE_NOT_EQ,
  PREDICATE_STARTS
} from '../../Records/predicates/predicates';
import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING } from '../../Journals/service/util';

import './style.scss';

const mapStateToProps = (state, context) => {
  const ehState = selectDataEventsHistoryByStateId(state, context.stateId) || {};
  let columns = EventsHistoryService.config.columns;

  if (!!context.selectedJournal) {
    columns = [];
  } else if (!isEmpty(ehState.columns)) {
    columns = ehState.columns;
  } else if (!isEmpty(context.myColumns)) {
    columns = context.myColumns;
  }

  return {
    list: ehState.list,
    isLoading: ehState.isLoading,
    columns,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getEventsHistory: payload => dispatch(getEventsHistory(payload)),
  getJournalConfig: payload => dispatch(getJournalConfig(payload)),
  filterEventsHistory: payload => dispatch(filterEventsHistory(payload)),
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

class EventsHistory extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isMobile: PropTypes.bool,
    isLoading: PropTypes.bool,
    runUpdate: PropTypes.bool,
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
    this.checkHeight({ contentHeightOld: snapshot.contentHeightOld, height: prevProps.height });

    if (!prevProps.runUpdate && this.props.runUpdate) {
      this.getEventsHistory();
    }

    if (!isEqual(prevProps.selectedJournal, this.props.selectedJournal)) {
      this.getJournalConfig();
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

  isDate = value => [DataFormatTypes.DATETIME, DataFormatTypes.DATE].includes(value);

  checkHeight(old) {
    const { getContentHeight } = this.props;
    const contentHeight = this.contentHeight;

    if (contentHeight !== old.contentHeightOld) {
      getContentHeight(contentHeight);
    }
  }

  getEventsHistory = () => {
    const { getEventsHistory, record, stateId, columns } = this.props;

    getEventsHistory({ stateId, record, columns });
  };

  getJournalConfig = () => {
    const { getJournalConfig, record, stateId } = this.props;

    getJournalConfig({ stateId, record });
  };

  getDateCompareResult(filter, value, format) {
    const valueInMoment = moment(value);
    const filterInMoment = moment(filter.val);

    switch (filter.t) {
      case PREDICATE_GT:
        return valueInMoment.isAfter(filterInMoment);
      case PREDICATE_GE:
        return valueInMoment.isSameOrAfter(filterInMoment);
      case PREDICATE_LT:
        return valueInMoment.isBefore(filterInMoment);
      case PREDICATE_LE:
        return valueInMoment.isSameOrBefore(filterInMoment);
      case PREDICATE_NOT_EQ:
        return filterInMoment.format(format) !== valueInMoment.format(format);
      case PREDICATE_EQ:
        return filterInMoment.format(format) === valueInMoment.format(format);
      case PREDICATE_EMPTY:
        return isEmpty(value);
      case PREDICATE_NOT_EMPTY:
        return !isEmpty(value);
      case PREDICATE_CONTAINS:
      default: {
        if (filter.val === datePredicateVariables.TODAY) {
          return valueInMoment.format(DateFormats.DATE) === moment().format(DateFormats.DATE);
        }

        return true;
      }
    }
  }

  getCompareResult(filter, value) {
    if (Array.isArray(filter.val)) {
      return filter.val.some(item => this.getCompareResult({ t: filter.t, val: item }, value));
    }

    switch (filter.t) {
      case PREDICATE_EMPTY:
        return isEmpty(value);
      case PREDICATE_NOT_EMPTY:
        return !isEmpty(value);
      case PREDICATE_ENDS:
        return value.endsWith(filter.val);
      case PREDICATE_STARTS:
        return value.startsWith(filter.val);
      case PREDICATE_EQ:
        return isEqual(value, filter.val);
      case PREDICATE_NOT_EQ:
        return !isEqual(value, filter.val);
      case PREDICATE_CONTAINS:
        return value.toLowerCase().includes((filter.val || '').toLowerCase());
      case PREDICATE_NOT_CONTAINS:
        return !value.toLowerCase().includes((filter.val || '').toLowerCase());
      default:
        return true;
    }
  }

  get filteredGridData() {
    const { list, columns } = this.props;
    const { filters } = this.state;

    return list.filter((item, index) =>
      filters.every(filter => {
        const column = columns.find(column => column.attribute === filter.att || column.dataField === filter.att);
        const formatter = get(column, 'formatExtraData.formatter');
        const format = column.type === DataFormatTypes.DATE ? DateFormats.DATE : DateFormats.DATETIME;

        if (formatter && formatter.getFilterValue) {
          const value =
            formatter.getFilterValue(
              item[filter.att],
              item,
              get(column, 'formatExtraData.params'),
              index,
              column.type === COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.AUTHORITY ? 'nodeRef' : ''
            ) || '';

          if (!this.isDate(column.type)) {
            return this.getCompareResult(filter, value);
          }

          return this.getDateCompareResult(filter, value, format);
        }

        if (!this.isDate(column.type)) {
          return this.getCompareResult(filter, item[filter.att]);
        }

        return this.getDateCompareResult(filter, item[filter.att]);
      })
    );
  }

  onFilter = predicates => {
    const { filterEventsHistory, record, stateId, columns } = this.props;

    filterEventsHistory({ stateId, record, columns, predicates });
  };

  applyFiltering = (items, newItem) => {
    const filtering = item => {
      if (isEqual(item, newItem)) {
        return false;
      }

      return item.att !== newItem.att;
    };

    const result = items.filter(filtering);

    if (!isEmpty(newItem.val) || !newItem.needValue) {
      result.push(newItem);
    }

    return result;
  };

  onGridFilter = (newFilters = [], type) => {
    const { filters } = this.state;
    const newFilter = get(newFilters, '0', {});
    const upFilters = this.applyFiltering(filters, newFilter, type);

    this.setState({ filters: upFilters }, () => {
      this.onFilter(this.state.filters);
    });
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
    const { columns, isMobile, maxHeight } = this.props;
    const { filters } = this.state;

    return (
      <Grid
        fixedHeader
        data={this.filteredGridData}
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
        <div ref={forwardedRef}>{this.renderContent()}</div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventsHistory);
